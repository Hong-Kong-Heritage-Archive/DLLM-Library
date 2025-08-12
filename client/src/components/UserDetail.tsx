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
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { User, Item } from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import ItemSummary from "./ItemSummary";
import PaginationControls from "./PaginationControls";

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
  query ItemsByUser($userId: ID!, $limit: Int, $offset: Int) {
    itemsByUser(userId: $userId, limit: $limit, offset: $offset) {
      id
      name
      condition
      status
      images
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

const ITEMS_PER_PAGE = 10;

const UserDetail: React.FC<UserDetailProps> = ({
  userId,
  currentUser,
  onBack,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [itemsPage, setItemsPage] = useState<number>(1);

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery<{ user: User }>(USER_DETAIL_QUERY, {
    variables: { userId: userId! },
    skip: !userId,
  });

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
    },
    skip: !userId,
  });

  // Refetch items when page changes
  useEffect(() => {
    if (userId) {
      refetchItems();
    }
  }, [itemsPage, refetchItems, userId]);

  const handleItemsPageChange = (newPage: number) => {
    setItemsPage(newPage);
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
              <Grid size={12}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: "flex", alignItems: "center" }}
                >
                  <PersonIcon sx={{ mr: 1 }} />
                  {t("user.basicInfo", "Basic Information")}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("user.nickname", "Nickname")}:</strong>{" "}
                  {userData.user.nickname || t("user.notSet", "Not set")}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("user.email", "Email")}:</strong>{" "}
                  {userData.user.email}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("user.joinedOn", "Joined on")}:</strong>{" "}
                  {formatDate(userData.user.createdAt)}
                </Typography>
              </Grid>

              <Grid size={6}>
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
                <Grid size={12}>
                  <Typography variant="body1" color="text.secondary">
                    <HomeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    <strong>{t("user.address", "Address")}:</strong>{" "}
                    {userData.user.address}
                  </Typography>
                </Grid>
              )}

              {/* Distance */}
              {currentUser && getDistanceToUser() && (
                <Grid size={12}>
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

          {/* User's Items */}
          <Paper elevation={1} sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {isCurrentUser
                ? t("user.yourItems", "Your Items")
                : t("user.userItems", "{{name}}'s Items", {
                    name: userData.user.nickname || userData.user.email,
                  })}
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
                  hasNextPage={itemsData.itemsByUser.length === ITEMS_PER_PAGE}
                  hasPrevPage={itemsPage > 1}
                  isLoading={itemsLoading}
                  itemsPerPage={ITEMS_PER_PAGE}
                  showPageInfo={true}
                />
              </>
            ) : (
              <Alert severity="info">
                {isCurrentUser
                  ? t("user.noItemsYou", "You haven't added any items yet.")
                  : t(
                      "user.noItemsUser",
                      "This user hasn't added any items yet."
                    )}
              </Alert>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default UserDetail;
