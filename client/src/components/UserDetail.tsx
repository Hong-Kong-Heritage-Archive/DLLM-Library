import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Container,
  Paper,
  Card,
  CardContent,
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
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { User, Item, Category } from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import ItemSummary from "./ItemSummary";
import PaginationControls from "./PaginationControls";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

const USER_DETAIL_QUERY = gql`
  query User($userId: ID!) {
    user(id: $userId) {
      createdAt
      email
      id
      nickname
      address
      isVerified
      isActive
      role
      exchangePoints
      itemCategory {
        category
        count
      }
      contactMethods {
        type
        value
        isPublic
      }
      location {
        latitude
        longitude
      }
    }
  }
`;

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
      condition
      status
      images
      thumbnails
      category
      location {
        latitude
        longitude
      }
    }
  }
`;

interface UserDetailProps {
  userId: string | null;
  currentUser?: User | null;
  onBack?: () => void;
}

interface TagCloudData {
  value: string;
  count: number;
}

const ITEMS_PER_PAGE = 10;

const UserDetail: React.FC<UserDetailProps> = ({
  userId,
  currentUser,
  onBack,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [includeExchangePointItems, setIncludeExchangePointItems] =
    useState<boolean>(true);

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
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIncludeExchangePointItems(event.target.checked);
  };

  const isCurrentUser =
    currentUser && userData?.user && currentUser.id === userData.user.id;

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
      userData.user.location.longitude
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Prepare data for bubble chart
  const tagCloudData: TagCloudData[] = userData?.user?.itemCategory
    ? userData.user.itemCategory.map((categoryItem) => ({
      value: categoryItem.category,
      count: categoryItem.count,
    }))
    : [];

  // Convert tagCloudData to bubble chart points using a simple spiral layout
  const bubbleData = tagCloudData.map((tag, i) => {
    const n = tagCloudData.length || 1;
    const angle = (i / n) * Math.PI * 2;
    // increase radius spacing so bubbles don't cluster
    const radius = 18 * Math.sqrt(i + 1);
    // scale up z so bubbles render much larger for clearer labels
    const baseSize = Math.max(tag.count, 1);
    return {
      name: tag.value,
      value: tag.count,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: baseSize * 250, // larger scale factor
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0].payload;
    return (
      <Box sx={{ bgcolor: "background.paper", p: 1, borderRadius: 1, boxShadow: 3 }}>
        <Typography variant="subtitle2">{p.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {p.value} items
        </Typography>
      </Box>
    );
  };

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {userData?.user ? (
            <>
              <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              {userData.user.nickname || userData.user.email}
              {isCurrentUser && (
                <Chip
                  label={t("user.you", "You")}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
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
            </>
          ) : (
            t("user.profileLoading", "Profile Loading")
          )}
        </Typography>
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
          <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: "flex", alignItems: "center" }}
                >
                  <PersonIcon sx={{ mr: 1 }} />
                  {t("user.basicInfo", "Basic Information")}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("user.nickname", "Nickname")}:</strong>{" "}
                  {userData.user.nickname || t("user.notSet", "Not set")}
                </Typography>
              </Grid>

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
                  <strong>{t("user.status", "Status")}:</strong>{" "}
                  <Chip
                    label={
                      userData.user.isActive
                        ? t("user.active", "Active")
                        : t("user.inactive", "Inactive")
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
          </Paper>

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
                              "Include Exchange Point Cached Items"
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
                        "When enabled, includes items cached at your exchange point in addition to your personal items."
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
                      }
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
                      "Select a category below to view items."
                    )}
                  </Alert>
                )}

                {/* Bubble Chart (replaces TagCloud) */}
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
                    width: "100%",
                  }}
                >
                  {bubbleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name="x" hide />
                        <YAxis type="number" dataKey="y" name="y" hide />
                        <ZAxis dataKey="z" range={[400, 3200]} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Scatter
                          data={bubbleData}
                          fill="#1976d2"
                          onClick={(d: any) =>
                            handleCategoryClick({ value: d.name, count: d.value })
                          }
                        >
                          <LabelList
                            dataKey="name"
                            position="inside"
                            formatter={(val: string) => val}
                            style={{ fill: "#fff", pointerEvents: "none", fontSize: 14, fontWeight: 600 }}
                          />
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
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
                    "Click on a category to filter items. Larger tags indicate more items in that category."
                  )}
                </Typography>
              </Paper>
            )}

          {/* Contact Methods */}
          {userData.user.contactMethods &&
            userData.user.contactMethods.length > 0 && (
              <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: "flex", alignItems: "center" }}
                >
                  <EmailIcon sx={{ mr: 1 }} />
                  {t("user.contactMethods", "Contact Methods")}
                </Typography>
                <List>
                  {userData.user.contactMethods.map((contact, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={contact.type}
                        secondary={contact.value}
                      />
                      <Chip
                        label={
                          contact.isPublic
                            ? t("user.public", "Public")
                            : t("user.private", "Private")
                        }
                        color={contact.isPublic ? "success" : "default"}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

          {/* User's Items - Only show when a category is selected */}
          {selectedCategory && (
            <Paper elevation={1} sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
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
                    }
                  )}
                {isExchangePointAdmin && includeExchangePointItems && (
                  <Chip
                    label={t(
                      "user.includesCachedItems",
                      "Includes cached items"
                    )}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>

              {itemsLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {itemsData?.itemsByUser && itemsData.itemsByUser.length > 0 ? (
                <>
                  <List>
                    {itemsData.itemsByUser.map((item) => (
                      <ItemSummary
                        key={item.id}
                        item={{
                          id: item.id,
                          name: item.name,
                          distance:
                            item.location && currentUser?.location
                              ? calculateDistance(
                                item.location.latitude,
                                item.location.longitude,
                                currentUser.location.latitude,
                                currentUser.location.longitude
                              )
                              : 0,
                          status: item.status,
                          images: item.images,
                          thumbnails: item.thumbnails,
                          tags: item.category,
                        }}
                        onClick={handleItemClick}
                      />
                    ))}
                  </List>

                  {/* Pagination Controls for Items */}
                  <PaginationControls
                    currentPage={itemsPage}
                    onPageChange={handleItemsPageChange}
                    hasNextPage={
                      itemsData.itemsByUser.length === ITEMS_PER_PAGE
                    }
                    hasPrevPage={itemsPage > 1}
                    isLoading={itemsLoading}
                    itemsPerPage={ITEMS_PER_PAGE}
                    showPageInfo={true}
                  />
                </>
              ) : (
                <Alert severity="info">
                  {isCurrentUser
                    ? t(
                      "user.noItemsInCategoryYou",
                      "You haven't added any {{category}} items yet.",
                      {
                        category: selectedCategory,
                      }
                    )
                    : t(
                      "user.noItemsInCategoryUser",
                      "This user hasn't added any {{category}} items yet.",
                      {
                        category: selectedCategory,
                      }
                    )}
                </Alert>
              )}
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default UserDetail;
