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
  Select,
  useMediaQuery,
  useTheme,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import BookSpinePreview from "./BookSpinePreview";
import ItemPreview from "./ItemPreview";
import PaginationControls from "./PaginationControls";
// import { TagCloud } from "react-tagcloud";
import UpdateUser from "./UserProfile";
import { USER_DETAIL_QUERY } from "../hook/user";
import ContactMethods from "./ContactMethods";
import UserProfileShareDialog from "./UserProfileShareDialog";
import { semanticTokens } from "../styles/semanticTokens";
import AddressReminderDialog from "./AddressReminderDialog";
import ItemForm from "./ItemForm";
import { PageLoader } from "./LoadingState";
import UserBookListBanner from "./UserBookListBanner";

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
      clssfctns
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

const pageContainerMdSx = { py: 4 };
const pageContainerLgSx = { py: 4 };
const headerRowSx = { display: "flex", alignItems: "center", mb: 3 };
const backIconButtonSx = { mr: 2 };
const sectionTitleWithIconSx = { mb: 2, display: "flex", alignItems: "center" };
const iconInlineSx = { mr: 1, verticalAlign: "middle" };
const loadingCenterPaddedSx = {
  display: "flex",
  justifyContent: "center",
  py: { xs: 0, sm: 2, md: 8 },
};
const resultHeaderRowSx = {
  mb: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const itemsGridSx = { mb: 3 };
const paginationWrapSx = { mt: 4 };

const UserDetail: React.FC<UserDetailProps> = ({
  userId,
  currentUser,
  onBack,
  signOut,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktopLayout = useMediaQuery(theme.breakpoints.up("md"));
  const isPortraitOrientation = useMediaQuery("(orientation: portrait)");
  const useBookSpine = !isDesktopLayout || isPortraitOrientation;
  const [searchParams, setSearchParams] = useSearchParams();
  const [itemsPage, setItemsPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null,
  );
  const [includeExchangePointItems, setIncludeExchangePointItems] =
    useState<boolean>(true);
  // State for controlling UpdateUser dialog
  const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showAddressReminder, setShowAddressReminder] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "bookshelf">(
    "profile",
  );

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

  // Count for selected category (or total) comes free from itemCategory metadata
  const selectedCategoryCount = selectedCategory
    ? (userData?.user?.itemCategory?.find(
        (c) => c.category === selectedCategory,
      )?.count ?? ITEMS_PER_PAGE)
    : null;
  const totalUserItemCount =
    userData?.user?.itemCategory?.reduce((sum, c) => sum + c.count, 0) ?? 0;

  // Both modes: backend-paginated with cache-first. Category count from metadata = total known, no count query.
  const { data: itemsData, loading: itemsLoading } = useQuery<{
    itemsByUser: Item[];
  }>(USER_ITEMS_QUERY, {
    variables: {
      userId: userId!,
      limit: ITEMS_PER_PAGE,
      offset: (itemsPage - 1) * ITEMS_PER_PAGE,
      category: selectedCategory ? [selectedCategory] : undefined,
      isExchangePointItem: isExchangePointAdmin && includeExchangePointItems,
    },
    fetchPolicy: "cache-first",
    skip: !userId,
  });

  // Count from itemCategory metadata — no extra query needed
  const totalFilteredCount = selectedCategory
    ? (selectedCategoryCount ?? 0)
    : totalUserItemCount;

  // Prefetch next page — silently warms cache so Next is instant.
  const hasNextPageEstimate = totalFilteredCount > itemsPage * ITEMS_PER_PAGE;
  useQuery<{ itemsByUser: Item[] }>(USER_ITEMS_QUERY, {
    variables: {
      userId: userId!,
      limit: ITEMS_PER_PAGE,
      offset: itemsPage * ITEMS_PER_PAGE,
      category: selectedCategory ? [selectedCategory] : undefined,
      isExchangePointItem: isExchangePointAdmin && includeExchangePointItems,
    },
    fetchPolicy: "cache-first",
    skip: !userId || !hasNextPageEstimate,
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

  const profileShareUrl = useMemo(() => {
    if (!userId || typeof window === "undefined") return "";
    return `${window.location.origin}/user/${userId}`;
  }, [userId]);

  // Reset page when category changes or exchange point toggle changes
  useEffect(() => {
    setItemsPage(1);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      return params;
    });
  }, [selectedCategory, includeExchangePointItems]);

  const handleItemsPageChange = (newPage: number) => {
    setItemsPage(newPage);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemCreated = () => {
    setShowItemForm(false);
    // recentCategoriesRefetch();
    // hotCategoriesRefetch();
    // userPickedRefetch();
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  const clearCategory = () => {
    setSelectedCategory(null);
    setItemsPage(1);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("category");
      params.set("page", "1");
      return params;
    });
  };

  const handleExchangePointItemsToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIncludeExchangePointItems(event.target.checked);
  };

  const isCurrentUser =
    currentUser && userData?.user && currentUser.id === userData.user.id;

  useEffect(() => {
    if (!userData?.user) return;
    setActiveTab(isCurrentUser ? "profile" : "bookshelf");
  }, [isCurrentUser, userData?.user?.id]);

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

  const handleAddItem = () => {
    if (!userData?.user?.address) {
      setShowAddressReminder(true);
      return;
    }
    setShowItemForm(true);
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
          color: isSelected ? semanticTokens.color.brandPrimary : color,
          fontWeight: isSelected ? "bold" : "normal",
          cursor: "pointer",
          margin: "4px",
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: isSelected
            ? alpha(semanticTokens.color.brandPrimary, 0.1)
            : "transparent",
          border: isSelected
            ? `2px solid ${semanticTokens.color.brandPrimary}`
            : "1px solid transparent",
          display: "inline-block",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
            backgroundColor: isSelected
              ? alpha(semanticTokens.color.brandPrimary, 0.2)
              : alpha(semanticTokens.color.textPrimary, 0.05),
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
      <Container maxWidth="md" sx={pageContainerMdSx}>
        <Box sx={headerRowSx}>
          <IconButton onClick={handleBack} sx={backIconButtonSx}>
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
  const bookshelfTitle = isCurrentUser
    ? t("user.yourBookshelf", "Bookshelf")
    : t("user.otherUsersBookshelf", "{{name}}'s Bookshelf", {
        name: userData?.user?.nickname || userData?.user?.email || "User",
      });
  const pageLoading = userLoading || itemsLoading;

  return (
    <Container maxWidth="lg" sx={pageContainerLgSx}>
      {pageLoading && (
        <PageLoader
          message={
            userLoading
              ? t("user.loadingProfile", "Loading user profile...")
              : t("common.loading", "Loading...")
          }
          size={48}
          minHeight={220}
        />
      )}

      {userError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("user.errorLoading", "Error loading user profile")}:{" "}
          {userError.message}
        </Alert>
      )}

      {userData?.user && (
        <Paper
          elevation={0}
          sx={{
            mx: "auto",
            width: "100%",
            border: `1px solid ${semanticTokens.color.borderSubtle}`,
            bgcolor: semanticTokens.color.bgSubtle,
            p: 2.5,
            boxShadow: "inset 0 0 0 1px var(--color-border-subtle)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {userData.user.nickname || userData.user.email}
                </Typography>
                {userData.user.isVerified && (
                  <VerifiedIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", fontSize: 20 }}
                    titleAccess={t("user.verified", "Verified User")}
                  />
                )}
                {signOut && (
                  <Button
                    variant="text"
                    size="small"
                    sx={{
                      p: 0,
                      minWidth: 0,
                      color: semanticTokens.color.brandPrimary,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                    onClick={signOut}
                  >
                    {t("auth.signOut", "Sign out")}
                  </Button>
                )}
              </Box>

              {isCurrentUser && (
                <Button
                  variant="text"
                  color="secondary"
                  size="small"
                  sx={{
                    p: 0,
                    minWidth: 0,
                    mt: 0.5,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => setShowUpdateUser(true)}
                >
                  {t("user.editProfile", "Edit profile")}
                </Button>
              )}
            </Box>

            {userData?.user && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ShareIcon />}
                sx={{
                  px: 1.25,
                  py: 0.6,
                  minWidth: 0,
                  borderRadius: 999,
                  backgroundColor: semanticTokens.color.brandPrimary,
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: semanticTokens.color.brandPrimary,
                    filter: "brightness(0.96)",
                  },
                }}
                onClick={() => setShareDialogOpen(true)}
              >
                {t("user.shareProfile", "Share profile")}
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              borderBottom: `1px solid ${semanticTokens.color.borderSubtle}`,
              mb: 2,
            }}
          >
            <Button
              onClick={() => setActiveTab("profile")}
              sx={{
                flex: 1,
                borderBottom:
                  activeTab === "profile"
                    ? `2px solid ${semanticTokens.color.brandPrimary}`
                    : "2px solid transparent",
                borderRadius: 0,
                color:
                  activeTab === "profile"
                    ? semanticTokens.color.brandPrimary
                    : semanticTokens.color.textSecondary,
                fontWeight: 600,
                textTransform: "none",
                py: 1.2,
              }}
            >
              {t("user.accountProfile", "Account Profile")}
            </Button>
            <Button
              onClick={() => setActiveTab("bookshelf")}
              sx={{
                flex: 1,
                borderBottom:
                  activeTab === "bookshelf"
                    ? `2px solid ${semanticTokens.color.brandPrimary}`
                    : "2px solid transparent",
                borderRadius: 0,
                color:
                  activeTab === "bookshelf"
                    ? semanticTokens.color.brandPrimary
                    : semanticTokens.color.textSecondary,
                fontWeight: 600,
                textTransform: "none",
                py: 1.2,
              }}
            >
              {t("user.yourBookshelf", "Bookshelf")}
            </Button>
          </Box>

          {activeTab === "profile" ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  bgcolor: semanticTokens.color.bgSubtle,
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: "text.secondary",
                    }}
                  >
                    {t("user.memberInformation", "MEMBER INFORMATION")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("user.email", "Email")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      textAlign: "right",
                      wordBreak: "break-word",
                    }}
                  >
                    {userData.user.email}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    borderTop: `1px solid ${semanticTokens.color.borderSubtle}`,
                    my: 0.5,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("user.joinedOn", "Joined")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(userData.user.createdAt)}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: alpha(semanticTokens.color.brandPrimary, 0.04),
                  border: `1px solid ${alpha(semanticTokens.color.brandPrimary, 0.12)}`,
                  borderRadius: 2,
                  p: 1.5,
                  color: semanticTokens.color.brandAccent,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: semanticTokens.color.brandPrimary,
                    }}
                  >
                    {t("user.exchangeInformation", "EXCHANGE INFORMATION")}
                  </Typography>
                  {isCurrentUser && (
                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        p: 0,
                        minWidth: 0,
                        color: semanticTokens.color.brandPrimary,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => setShowUpdateUser(true)}
                    >
                      {t("common.edit", "Edit")}
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2">
                    {t("user.exchangeAddress", "Exchange address")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, textAlign: "right" }}
                  >
                    {userData.user.address || t("user.notSet", "Not set yet")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    borderTop: `1px solid ${alpha(semanticTokens.color.brandAccent, 0.18)}`,
                    my: 0.5,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2">
                    {t("user.meetupContact", "Meetup contact")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, textAlign: "right" }}
                  >
                    {userData.user.contactMethods &&
                    userData.user.contactMethods.length > 0
                      ? t("user.seeDetails", "Available")
                      : t("user.notSet", "None added yet")}
                  </Typography>
                </Box>

                {userData.user.contactMethods &&
                  userData.user.contactMethods.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <ContactMethods
                        contactMethods={userData.user.contactMethods}
                        readOnly={true}
                        canViewPrivateMethods={Boolean(isCurrentUser)}
                        title={t(
                          "userProfile.contactMethods.title",
                          "Contact Methods",
                        )}
                        showTitle={true}
                        showAddButton={false}
                        maxHeight={320}
                      />
                    </Box>
                  )}
              </Box>

              <Box
                sx={{
                  bgcolor: semanticTokens.color.bgSubtle,
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: "text.secondary",
                    }}
                  >
                    {t("user.exchangePoints", "EXCHANGE POINTS")}
                  </Typography>
                  {isCurrentUser && (
                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        p: 0,
                        minWidth: 0,
                        color: semanticTokens.color.brandPrimary,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => setShowUpdateUser(true)}
                    >
                      {t("common.edit", "Edit")}
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    py: 0.75,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, textAlign: "right" }}
                  >
                    {userData.user.exchangePoints &&
                    userData.user.exchangePoints.length > 0
                      ? userData.user.exchangePoints.join(", ")
                      : t("user.notSet", "None selected")}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: semanticTokens.color.bgSubtle,
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: "text.secondary",
                    }}
                  >
                    {t("user.contentFilter", "CONTENT FILTER")}
                  </Typography>
                  {isCurrentUser && (
                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        p: 0,
                        minWidth: 0,
                        color: semanticTokens.color.brandPrimary,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => setShowUpdateUser(true)}
                    >
                      {t("common.edit", "Edit")}
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("user.currentSetting", "Current setting")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("contentRating.cat2b", "Category IIB")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <UserBookListBanner userId={userId} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {bookshelfTitle}
                </Typography>
                {isCurrentUser && (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={pageLoading}
                    sx={{
                      bgcolor: semanticTokens.color.brandPrimary,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 700,
                      px: 1.4,
                      opacity: pageLoading ? 0.6 : 1,
                      cursor: pageLoading ? "not-allowed" : "pointer",
                    }}
                    onClick={pageLoading ? undefined : handleAddItem}
                    data-tour="add-item"
                  >
                    <Box component="span" sx={{ mr: 0.5 }}>
                      +
                    </Box>
                    {t("item.create", "Create Item")}
                  </Button>
                )}
              </Box>

              {pinnedItemsWithDistance.length > 0 && (
                <Box
                  sx={{
                    bgcolor: alpha(semanticTokens.color.bgSurface, 0.7),
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}
                  >
                    {t("user.pinnedItems", "Pinned Items")}
                  </Typography>
                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                    {pinnedItemsWithDistance.map((item) => (
                      <Grid key={item.id} size={{ xs: 3, sm: 2, md: 2 }}>
                        {useBookSpine ? (
                          <BookSpinePreview
                            item={item}
                            distance={item.distance}
                            onClick={handleItemClick}
                          />
                        ) : (
                          <ItemPreview item={item} onClick={handleItemClick} />
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Box
                sx={{
                  bgcolor: alpha(semanticTokens.color.bgSurface, 0.7),
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {isCurrentUser
                      ? t("item.myLentItems", "All My Items")
                      : t("item.allItems", "All Items")}
                  </Typography>

                  {tagCloudData.length > 0 && (
                    <Select
                      native
                      value={selectedCategory || ""}
                      onChange={(e) =>
                        setSelectedCategory(e.target.value || null)
                      }
                      sx={{ minWidth: 170, fontSize: "0.875rem" }}
                    >
                      <option value="">
                        {t("user.allCategories", "All Categories")}
                      </option>
                      {tagCloudData.map((tag) => (
                        <option key={tag.value} value={tag.value}>
                          {tag.value} ({tag.count})
                        </option>
                      ))}
                    </Select>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("itemsAll.itemsFound", "Found {{count}} item(s)", {
                      count: totalFilteredCount,
                    })}
                  </Typography>
                </Box>

                {!itemsLoading && itemsWithDistance.length > 0 ? (
                  <>
                    <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                      {itemsWithDistance.map((item) => (
                        <Grid key={item.id} size={{ xs: 3, sm: 2, md: 2 }}>
                          {useBookSpine ? (
                            <BookSpinePreview
                              item={item}
                              distance={item.distance}
                              onClick={handleItemClick}
                            />
                          ) : (
                            <ItemPreview
                              item={item}
                              onClick={handleItemClick}
                            />
                          )}
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <PaginationControls
                        currentPage={itemsPage}
                        onPageChange={handleItemsPageChange}
                        hasNextPage={
                          itemsPage * ITEMS_PER_PAGE < totalFilteredCount
                        }
                        totalItems={totalFilteredCount}
                        hasPrevPage={itemsPage > 1}
                        isLoading={itemsLoading}
                        itemsPerPage={ITEMS_PER_PAGE}
                        showPageInfo={true}
                      />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {isCurrentUser
                      ? t("item.noLentItems", "You currently have no items.")
                      : t(
                          "user.noPinnedItemsUser",
                          "This user hasn't added any items yet.",
                        )}
                  </Typography>
                )}
              </Box>

              {isCurrentUser && (
                <Box sx={{ textAlign: "center", mt: 0.5 }}>
                  <Button
                    variant="text"
                    sx={{
                      color: semanticTokens.color.brandPrimary,
                      textTransform: "none",
                      fontWeight: 600,
                      p: 0,
                    }}
                    onClick={() => navigate("/import/goodreads")}
                  >
                    {t(
                      "user.goodreadsImport",
                      "Already have a Goodreads list? Import it here.",
                    )}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

      {showAddressReminder && (
        <AddressReminderDialog
          open={showAddressReminder}
          onClose={() => setShowAddressReminder(false)}
          onGoToProfile={null}
        />
      )}

      {showItemForm && userData?.user && (
        <ItemForm
          open={showItemForm}
          user={userData.user}
          onClose={() => setShowItemForm(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      {isCurrentUser && showUpdateUser && userData?.user && (
        <UpdateUser
          email={userData.user.email}
          onUserCreated={handleUserCreated}
          open={showUpdateUser}
          isCreateUser={false}
          initialNickname={userData.user?.nickname || userData.user.email}
          initialAddress={userData.user?.address || ""}
          initialExchangePoints={userData.user?.exchangePoints}
          initialContactMethods={userData.user?.contactMethods || []}
          initialVisibleContentRating={
            (userData.user as any)?.visibleContentRating
          }
          onClose={() => setShowUpdateUser(false)}
        />
      )}

      <UserProfileShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        profileUrl={profileShareUrl}
        displayName={
          userData?.user?.nickname ||
          userData?.user?.email ||
          userData?.user?.id ||
          ""
        }
      />
    </Container>
  );
};

export default UserDetail;
