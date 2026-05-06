import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Chip,
  Grid,
  Container,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Verified as VerifiedIcon,
  Label as LabelIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { User, Item, Category, Binder } from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import ItemPreview from "./ItemPreview";
import PaginationControls from "./PaginationControls";
import { TagCloud } from "react-tagcloud";
import UpdateUser from "./UserProfile";
import { USER_DETAIL_QUERY } from "../hook/user";
import ContactMethods from "./ContactMethods";
import BinderPreview from "./BinderPreview";
import UserProfileShareDialog from "./UserProfileShareDialog";

// GraphQL query to fetch user's items with pagination and category filter
const USER_ITEMS_QUERY = gql`
  query ItemsByUser(
    $userId: ID!
    $limit: Int
    $offset: Int
    $category: [String!]
    $isExchangePointItem: Boolean
  ) {
    itemsByUser(
      userId: $userId
      limit: $limit
      offset: $offset
      category: $category
      isExchangePointItem: $isExchangePointItem
    ) {
      id
      name
      description
      condition
      status
      images
      thumbnails
      category
      publishedYear
      language
      location {
        latitude
        longitude
      }
      createdAt
    }
  }
`;

const USER_ITEMS_COUNT_QUERY = gql`
  query TotalItemsByUser(
    $userId: ID!
    $category: [String!]
    $isExchangePointItem: Boolean
  ) {
    totalItemsCountByUser(
      userId: $userId
      category: $category
      isExchangePointItem: $isExchangePointItem
    )
  }
`;

const USER_ROOT_BINDER_QUERY = gql`
  query UserRootBinder($binderId: ID!) {
    binder(id: $binderId) {
      id
      name
      description
      images
      thumbnails
      binds {
        type
        id
        name
      }
      bindedCount
      updatedAt
      owner {
        id
        nickname
        email
      }
    }
  }
`;

interface UserDetailProps {
  userId: string | null;
  currentUser?: User | null;
  onBack?: () => void;
  signOut?: () => Promise<void> | undefined;
}

interface TagCloudData {
  value: string;
  count: number;
}

const ITEMS_PER_PAGE = 12; // Match Item.all.tsx

const UserDetail: React.FC<UserDetailProps> = ({
  userId,
  currentUser,
  onBack,
  signOut,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [includeExchangePointItems, setIncludeExchangePointItems] =
    useState<boolean>(true);
  // State for controlling UpdateUser dialog
  const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery<{ user: User }>(USER_DETAIL_QUERY, {
    variables: { userId: userId! },
    skip: !userId,
  });

  // Check if user is exchange point admin
  const isExchangePointAdmin = userData?.user?.role === "EXCHANGE_POINT_ADMIN";

  const {
    data: itemsData,
    loading: itemsLoading,
    refetch: refetchItems,
  } = useQuery<{
    itemsByUser: Item[];
  }>(USER_ITEMS_QUERY, {
    variables: {
      userId: userId!,
      limit: ITEMS_PER_PAGE,
      offset: (itemsPage - 1) * ITEMS_PER_PAGE,
      category: selectedCategory ? [selectedCategory] : undefined,
      isExchangePointItem: isExchangePointAdmin && includeExchangePointItems,
    },
    skip: !userId || !selectedCategory, // Only query when category is selected
  });

  const { data: totalItemsData, loading: totalItemsLoading } = useQuery<{
    totalItemsCountByUser: number;
  }>(USER_ITEMS_COUNT_QUERY, {
    variables: {
      userId: userId!,
      category: selectedCategory ? [selectedCategory] : undefined,
      isExchangePointItem: isExchangePointAdmin && includeExchangePointItems,
    },
    skip: !userId || !selectedCategory, // Only query when category is selected
  });

  const {
    data: binderData,
    loading: binderLoading,
    error: binderError,
  } = useQuery<{ binder: Binder }>(USER_ROOT_BINDER_QUERY, {
    variables: { binderId: userId! },
    skip: !userId,
  });

  const profileShareUrl = useMemo(() => {
    if (!userId || typeof window === "undefined") return "";
    return `${window.location.origin}/user/${userId}`;
  }, [userId]);

  // Reset page when category changes or exchange point toggle changes
  useEffect(() => {
    setItemsPage(1);
  }, [selectedCategory, includeExchangePointItems]);

  // Refetch items when page changes, category changes, or exchange point setting changes
  useEffect(() => {
    console.log("Refetching items... " + selectedCategory);
    if (userId && selectedCategory) {
      refetchItems();
    }
  }, [
    itemsPage,
    selectedCategory,
    includeExchangePointItems,
    refetchItems,
    userId,
  ]);

  const handleItemsPageChange = (newPage: number) => {
    setItemsPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryClick = (tag: TagCloudData) => {
    const category = tag.value;
    console.log("Clicked category:", tag);
    if (selectedCategory === category) {
      // If clicking the same category, deselect it
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleExchangePointItemsToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIncludeExchangePointItems(event.target.checked);
  };

  const isCurrentUser =
    currentUser && userData?.user && currentUser.id === userData.user.id;

  const handleUserCreated = () => {
    setShowUpdateUser(false);
    // Optionally refresh the page or refetch user data
    window.location.reload();
  };

  // Calculate distance between current user and profile user
  const getDistanceToUser = (): string | null => {
    if (
      !currentUser?.location?.latitude ||
      !currentUser?.location?.longitude ||
      !userData?.user?.location?.latitude ||
      !userData?.user?.location?.longitude ||
      isCurrentUser
    ) {
      return null;
    }

    const distance = calculateDistance(
      currentUser.location.latitude,
      currentUser.location.longitude,
      userData.user.location.latitude,
      userData.user.location.longitude,
    );

    return formatDistance(distance);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleBinderClick = (binderId: string) => {
    navigate(`/binder/${binderId}`);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Prepare data for TagCloud component
  const tagCloudData: TagCloudData[] = userData?.user?.itemCategory
    ? userData.user.itemCategory.map((categoryItem) => ({
        value: categoryItem.category,
        count: categoryItem.count,
      }))
    : [];

  // Custom renderer for TagCloud
  const customRenderer = (tag: TagCloudData, size: number, color: string) => {
    const isSelected = selectedCategory === tag.value;

    return (
      <Box
        key={tag.value}
        component="span"
        sx={{
          fontSize: `${size}px`,
          color: isSelected ? "#1976d2" : color,
          fontWeight: isSelected ? "bold" : "normal",
          cursor: "pointer",
          margin: "4px",
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: isSelected
            ? "rgba(25, 118, 210, 0.1)"
            : "transparent",
          border: isSelected ? "2px solid #1976d2" : "1px solid transparent",
          display: "inline-block",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
            backgroundColor: isSelected
              ? "rgba(25, 118, 210, 0.2)"
              : "rgba(0, 0, 0, 0.05)",
          },
        }}
        title={`${tag.value} (${tag.count} items)`}
      >
        {tag.value} ({tag.count})
      </Box>
    );
  };

  // Calculate distances for items
  const itemsWithDistance =
    itemsData?.itemsByUser.map((item) => ({
      ...item,
      distance:
        item.location && currentUser?.location
          ? calculateDistance(
              item.location.latitude,
              item.location.longitude,
              currentUser.location.latitude,
              currentUser.location.longitude,
            )
          : 0,
    })) || [];

  // Calculate distances for pinned items
  const pinnedItemsWithDistance =
    userData?.user?.pinItems?.map((item) => ({
      ...item,
      distance:
        item.location && currentUser?.location
          ? calculateDistance(
              item.location.latitude,
              item.location.longitude,
              currentUser.location.latitude,
              currentUser.location.longitude,
            )
          : 0,
    })) || [];

  // Handle case when userId is null
  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {t("user.profile", "User Profile")}
          </Typography>
        </Box>
        <Alert severity="error">
          {t("user.noUserId", "No user ID provided")}
        </Alert>
      </Container>
    );
  }

  const sortedCategories = userData?.user?.itemCategory;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 3,
        }}
      >
        {onBack && (
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
        )}
        <Typography variant="h4" sx={{ flexGrow: 1, minWidth: 0 }}>
          {userData?.user ? (
            <>
              <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              {userData.user.nickname || userData.user.email}
              {isCurrentUser && (
                <Chip
                  label={t("user.editProfile")}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={() => setShowUpdateUser(true)}
                />
              )}
              {isCurrentUser && (
                <Chip
                  label={t("goodreads.importButton", "Import from GoodReads")}
                  color="secondary"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => navigate("/import/goodreads")}
                />
              )}
              {userData.user.isVerified && (
                <VerifiedIcon
                  color="primary"
                  sx={{ ml: 1, verticalAlign: "middle" }}
                  titleAccess={t("user.verified", "Verified User")}
                />
              )}
              {isExchangePointAdmin && (
                <Chip
                  label={t("user.exchangePointAdmin", "Exchange Point Admin")}
                  color="secondary"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
              {signOut && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={signOut}
                >
                  {t("auth.signOut", "Sign Out")}
                </Button>
              )}
            </>
          ) : (
            t("user.loadingProfile", "Profile Loading")
          )}
        </Typography>
        {userData?.user && (
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
          >
            {t("user.shareProfile", "Share profile")}
          </Button>
        )}
      </Box>

      {/* Loading State */}
      {userLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {userError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("user.errorLoading", "Error loading user profile")}:{" "}
          {userError.message}
        </Alert>
      )}

      {/* User Content */}
      {userData?.user && (
        <>
          {/* User Info Card */}
          <Accordion>
            {/* Basic Info */}
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: "flex", alignItems: "center" }}
                >
                  <PersonIcon sx={{ mr: 1 }} />
                  {t("user.basicInfo", "Basic Information")}
                </Typography>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("user.email", "Email")}:</strong>{" "}
                    {userData.user.email}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("user.joinedOn", "Joined on")}:</strong>{" "}
                    {formatDate(userData.user.createdAt)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("user.status.title", "Status")}:</strong>{" "}
                    <Chip
                      label={
                        userData.user.isActive
                          ? t("user.status.active", "Active")
                          : t("user.status.inactive", "Inactive")
                      }
                      color={userData.user.isActive ? "success" : "default"}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>

                {/* Address */}
                {userData.user.address && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" color="text.secondary">
                      <HomeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      <strong>{t("user.address", "Address")}:</strong>{" "}
                      {userData.user.address}
                    </Typography>
                  </Grid>
                )}

                {/* Distance */}
                {currentUser && getDistanceToUser() && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" color="text.secondary">
                      <LocationOnIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      <strong>
                        {t("user.distance", "Distance from you")}:
                      </strong>{" "}
                      <Chip
                        label={getDistanceToUser()}
                        color="info"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                )}
              </Grid>
              {/* Contact Methods in read-only mode */}
              {userData.user.contactMethods &&
                userData.user.contactMethods.length > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <ContactMethods
                      contactMethods={userData.user.contactMethods}
                      readOnly={true}
                      title={t("user.contactMethods", "Contact Methods")}
                      showTitle={true}
                      showAddButton={false}
                      showPublicPrivateFilter={!isCurrentUser} // Show filter only for other users
                      maxHeight={300}
                    />
                  </Box>
                )}
            </AccordionDetails>
          </Accordion>

          {/* Pinned Items Section - Grid Layout */}
          <Paper elevation={1} sx={{ p: 4, mt: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center" }}
            >
              <LabelIcon sx={{ mr: 1 }} />
              {t("user.pinnedItems", "Pinned Items")}
            </Typography>

            {pinnedItemsWithDistance.length > 0 ? (
              <>
                <Grid
                  container
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{
                    mb: 2,
                  }}
                >
                  {pinnedItemsWithDistance.map((item) => (
                    <Grid key={item.id} size={{ xs: 4, sm: 3, md: 2 }}>
                      <ItemPreview
                        item={item}
                        distance={item.distance}
                        onClick={handleItemClick}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {t("user.pinnedItemsCount", "{{count}} pinned item(s)", {
                    count: pinnedItemsWithDistance.length,
                  })}
                </Typography>
              </>
            ) : (
              <Alert severity="info">
                {isCurrentUser
                  ? t(
                      "user.noPinnedItemsYou",
                      "You haven't pinned any items yet.",
                    )
                  : t(
                      "user.noPinnedItemsUser",
                      "This user hasn't pinned any items.",
                    )}
              </Alert>
            )}
          </Paper>

          {/* Root Binder Section - Add this BEFORE Item Categories Tag Cloud */}
          {binderData?.binder && (
            <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <FolderIcon sx={{ mr: 1 }} />
                {t("user.rootBinder", "Root Binder")}
              </Typography>
              {/*
              {binderLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : binderError ? (
                <Alert severity="info">
                  {t(
                    "user.noRootBinder",
                    "This user hasn't created a root binder yet."
                  )}
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <BinderPreview
                      binder={binderData.binder}
                      onClick={handleBinderClick}
                    />
                  </Grid>
                </Grid>
              )}
              */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2 }}
              >
                {t(
                  "user.rootBinderHelper",
                  "The root binder contains all items organized by this user. Click to explore the contents.",
                )}
              </Typography>
            </Paper>
          )}

          {/* Item Categories Tag Cloud */}
          {userData.user.itemCategory &&
            userData.user.itemCategory.length > 0 && (
              <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: "flex", alignItems: "center" }}
                >
                  <LabelIcon sx={{ mr: 1 }} />
                  {t("user.itemCategories", "Item Categories")}
                </Typography>

                {/* Exchange Point Items Control - Only show for exchange point admins */}
                {isExchangePointAdmin && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeExchangePointItems}
                          onChange={handleExchangePointItemsToggle}
                          icon={<StorageIcon />}
                          checkedIcon={<StorageIcon />}
                        />
                      }
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {t(
                              "user.includeExchangePointItems",
                              "Include Exchange Point Cached Items",
                            )}
                          </Typography>
                          <Chip
                            label={
                              includeExchangePointItems
                                ? t("common.enabled", "Enabled")
                                : t("common.disabled", "Disabled")
                            }
                            size="small"
                            color={
                              includeExchangePointItems ? "success" : "default"
                            }
                          />
                        </Box>
                      }
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      {t(
                        "user.exchangePointItemsHelper",
                        "When enabled, includes items cached at your exchange point in addition to your personal items.",
                      )}
                    </Typography>
                  </Box>
                )}

                {selectedCategory && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "user.filteringByCategory",
                      "Filtering by category: {{category}}",
                      {
                        category: selectedCategory,
                      },
                    )}
                    <Chip
                      label={t("common.clearFilter", "Clear Filter")}
                      size="small"
                      onClick={() => setSelectedCategory(null)}
                      onDelete={() => setSelectedCategory(null)}
                      sx={{ ml: 1 }}
                    />
                  </Alert>
                )}

                {!selectedCategory && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "user.selectCategoryToViewItems",
                      "Select a category below to view items.",
                    )}
                  </Alert>
                )}

                {/* React TagCloud */}
                <Box
                  sx={{
                    minHeight: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  {tagCloudData.length > 0 ? (
                    <TagCloud
                      minSize={14}
                      maxSize={32}
                      tags={tagCloudData}
                      onClick={(tag) => handleCategoryClick(tag)}
                      renderer={customRenderer}
                      shuffle={false}
                      colorOptions={{
                        luminosity: "dark",
                        hue: "blue",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("user.noCategories", "No categories available")}
                    </Typography>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: "block" }}
                >
                  {t(
                    "user.tagCloudHelper",
                    "Click on a category to filter items. Larger tags indicate more items in that category.",
                  )}
                </Typography>
              </Paper>
            )}

          {/* UpdateUser Dialog - Only render when needed */}
          {showUpdateUser && (
            <UpdateUser
              email={userData.user.email}
              onUserCreated={handleUserCreated}
              open={showUpdateUser}
              isCreateUser={false}
              initialNickname={userData.user?.nickname}
              initialAddress={userData.user?.address}
              initialExchangePoints={userData.user?.exchangePoints}
              initialContactMethods={userData.user?.contactMethods || []}
              onClose={() => setShowUpdateUser(false)}
            />
          )}

          <UserProfileShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            profileUrl={profileShareUrl}
            displayName={
              userData.user.nickname || userData.user.email || userData.user.id
            }
          />

          {/* User's Items - Only show when a category is selected - Grid Layout */}
          {selectedCategory && (
            <Paper elevation={1} sx={{ p: 4 }}>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">
                  {isCurrentUser
                    ? t("user.yourItemsInCategory", "Your {{category}} Items", {
                        category: selectedCategory,
                      })
                    : t(
                        "user.userItemsInCategory",
                        "{{name}}'s {{category}} Items",
                        {
                          name: userData.user.nickname || userData.user.email,
                          category: selectedCategory,
                        },
                      )}
                  {isExchangePointAdmin && includeExchangePointItems && (
                    <Chip
                      label={t(
                        "user.includesCachedItems",
                        "Includes cached items",
                      )}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>

                {/* Results count */}
                <Typography variant="body2" color="text.secondary">
                  {itemsLoading || totalItemsLoading
                    ? t("common.loading", "Loading...")
                    : totalItemsData?.totalItemsCountByUser
                      ? t("itemsAll.itemsFound", "Found {{count}} item(s)", {
                          count: totalItemsData.totalItemsCountByUser,
                        })
                      : t("itemsAll.itemsFound", "Found {{count}} item(s)", {
                          count: itemsWithDistance.length,
                        })}
                </Typography>
              </Box>

              {/* Loading State */}
              {(itemsLoading || totalItemsLoading) && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Items Grid */}
              {!itemsLoading && itemsWithDistance.length > 0 ? (
                <>
                  <Grid
                    container
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{
                      mb: 3,
                    }}
                  >
                    {itemsWithDistance.map((item) => (
                      <Grid key={item.id} size={{ xs: 4, sm: 3, md: 2 }}>
                        <ItemPreview
                          item={item}
                          distance={item.distance}
                          onClick={handleItemClick}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Pagination Controls */}
                  <Box sx={{ mt: 4 }}>
                    <PaginationControls
                      currentPage={itemsPage}
                      onPageChange={handleItemsPageChange}
                      hasNextPage={itemsWithDistance.length === ITEMS_PER_PAGE}
                      totalItems={totalItemsData?.totalItemsCountByUser}
                      hasPrevPage={itemsPage > 1}
                      isLoading={itemsLoading || totalItemsLoading}
                      itemsPerPage={ITEMS_PER_PAGE}
                      showPageInfo={true}
                    />
                  </Box>
                </>
              ) : (
                !itemsLoading && (
                  <Alert severity="info">
                    {isCurrentUser
                      ? t(
                          "user.noItemsInCategoryYou",
                          "You haven't added any {{category}} items yet.",
                          {
                            category: selectedCategory,
                          },
                        )
                      : t(
                          "user.noItemsInCategoryUser",
                          "This user hasn't added any {{category}} items yet.",
                          {
                            category: selectedCategory,
                          },
                        )}
                  </Alert>
                )
              )}
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default UserDetail;
