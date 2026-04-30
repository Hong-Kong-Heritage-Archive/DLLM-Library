import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Button,
  Box,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Chat as ChatIcon } from "@mui/icons-material";
import {
  User,
  Item,
  RecommendationType,
  HostConfig,
} from "../generated/graphql";
import RecentItemBanner from "../components/RecentItemBanner";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { sendVerificationEmail } from "../firebase";
import ItemForm from "../components/ItemForm";

const RecentCategoriesQuery = gql`
  query RecentCategories($limit: Int!) {
    recentUpdateCategories(limit: $limit)
  }
`;

const HotCategoriesQuery = gql`
  query HotCategories($limit: Int!) {
    hotCategories(limit: $limit)
  }
`;

const RecommendedItemsQuery = gql`
  query RecommendedItems($type: RecommendationType!, $limit: Int!) {
    recommendedItems(type: $type, limit: $limit) {
      id
      name
      category
      status
      images
      thumbnails
      condition
      location {
        latitude
        longitude
      }
      ownerId
    }
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
  hostConfig?: HostConfig;
  onSignOut: () => Promise<void>;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [showItemForm, setShowItemForm] = useState(false);
  const { user, emailVerified, email, hostConfig, onSignOut } =
    useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAddressReminder, setShowAddressReminder] = useState(false);

  const handleItemCreated = () => {
    setShowItemForm(false);
    recentCategoriesRefetch();
    hotCategoriesRefetch();
    userPickedRefetch();
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  // Query for USER_PICKED recommendations only
  const {
    data: userPickedData,
    loading: userPickedLoading,
    error: userPickedError,
    refetch: userPickedRefetch,
  } = useQuery<{
    recommendedItems: Item[];
  }>(RecommendedItemsQuery, {
    variables: {
      type: RecommendationType.UserPicked,
      limit: 5,
    },
    skip: !user?.isActive,
    errorPolicy: "all",
  });

  // Query for recent categories
  const {
    data: recentCategoriesData,
    loading: recentCategoriesLoading,
    refetch: recentCategoriesRefetch,
  } = useQuery<{
    recentUpdateCategories: string[];
  }>(RecentCategoriesQuery, {
    variables: { limit: 1 },
  });

  // Query for hot categories
  const {
    data: hotCategoriesData,
    loading: hotCategoriesLoading,
    refetch: hotCategoriesRefetch,
  } = useQuery<{
    hotCategories: string[];
  }>(HotCategoriesQuery, {
    variables: { limit: 3 },
  });

  const handleAddItem = () => {
    if (!user?.address) {
      setShowAddressReminder(true);
      return;
    }
    setShowItemForm(true);
  };

  const handleGoToProfile = () => {
    setShowAddressReminder(false);
    setShowCreateUser(true);
  };

  const handleUserCreated = () => {
    setShowCreateUser(false);
    window.location.reload();
  };

  const handleViewAllItems = () => {
    navigate("/item/all");
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleChatClick = () => {
    if (hostConfig?.chatLink) {
      window.open(hostConfig.chatLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <List
        sx={{
          px: 2,
          pb: hostConfig?.chatLink ? 8 : 2, // Add extra bottom padding only if chat button is visible
        }}
      >
        {/* Welcome Section */}
        <ListItem>
          <Box sx={{ width: "100%" }}>
            {user?.isVerified ? (
              <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t("home.welcome", { nickname: user.nickname })}
                </Typography>
                {!user.isActive && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "home.accountPending",
                      "Your account is pending activation.",
                    )}
                  </Alert>
                )}
              </Box>
            ) : (
              email && (
                <Box>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {t("home.welcome")} {email}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {!emailVerified && (
                      <Button
                        variant="outlined"
                        onClick={async () => {
                          await sendVerificationEmail();
                          alert(t("auth.verificationEmailSent"));
                        }}
                        size="large"
                      >
                        {t(
                          "auth.resendVerification",
                          "Resend Verification Email",
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleSignOut}
                      size="large"
                    >
                      {t("auth.signOut")}
                    </Button>
                  </Box>
                </Box>
              )
            )}
          </Box>
        </ListItem>

        {/* View All Items Button */}
        <ListItem>
          <Button
            variant="contained"
            onClick={handleViewAllItems}
            size="large"
            fullWidth
            data-tour="view-all-items"
          >
            {t("navigation.viewAllItems")}
          </Button>
          {user?.isVerified && (
            <Button
              variant="contained"
              onClick={handleAddItem}
              size="large"
              fullWidth
              sx={{ ml: 2 }}
              data-tour="add-item"
            >
              {t("item.create", "Add Item")}
            </Button>
          )}
        </ListItem>

        {/* User Picked Recommendations Section - Only for active users */}
        {user?.isActive && (
          <>
            {userPickedLoading && (
              <ListItem>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography>
                    {t(
                      "home.loadingRecommendations",
                      "Loading recommendations...",
                    )}
                  </Typography>
                </Box>
              </ListItem>
            )}

            {userPickedError && (
              <ListItem>
                <Alert severity="warning" sx={{ width: "100%" }}>
                  {t(
                    "home.recommendationsError",
                    "Unable to load recommendations",
                  )}
                  <Typography variant="caption" display="block">
                    {userPickedError.message}
                  </Typography>
                </Alert>
              </ListItem>
            )}

            {userPickedData?.recommendedItems &&
              userPickedData.recommendedItems.length > 0 && (
                <ListItem>
                  <RecentItemBanner
                    recommendationType={RecommendationType.UserPicked}
                    recommendedItems={userPickedData.recommendedItems}
                    titleOverride={t(
                      "home.userPickedItems",
                      "Recommended for You",
                    )}
                    descriptionOverride={t(
                      "home.userPickedDescription",
                      "Based on your interests and activity",
                    )}
                  />
                </ListItem>
              )}

            {!userPickedLoading &&
              !userPickedData?.recommendedItems?.length &&
              !userPickedError && (
                <ListItem>
                  <Alert severity="info" sx={{ width: "100%" }}>
                    {t(
                      "home.noRecommendations",
                      "No recommendations available at the moment. Browse items to help us learn your preferences!",
                    )}
                  </Alert>
                </ListItem>
              )}
          </>
        )}

        {/* Recent Categories Section */}
        {/*
        {recentCategoriesData?.recentUpdateCategories && (
          <>
            {recentCategoriesData.recentUpdateCategories.map(
              (category, index) => (
                <ListItem key={`recent-category-${index}`}>
                  <RecentItemBanner category={category} isRecent={true} />
                </ListItem>
              ),
            )}
          </>
        )}
        */}
        <ListItem key={`recent-category-all`}>
          <RecentItemBanner category="" isRecent={true} />
        </ListItem>

        <ListItem>
          <RecentItemBanner
            recommendationType={RecommendationType.NewArrivals}
            isRecent={false}
          />
        </ListItem>

        {recentCategoriesLoading && (
          <ListItem>
            <Typography>{t("common.loading")}</Typography>
          </ListItem>
        )}

        {/* Hot Categories Section */}
        {hotCategoriesData?.hotCategories && (
          <>
            {hotCategoriesData.hotCategories.map((category, index) => (
              <ListItem key={`hot-category-${index}`}>
                <RecentItemBanner category={category} isRecent={false} />
              </ListItem>
            ))}
          </>
        )}

        {hotCategoriesLoading && (
          <ListItem>
            <Typography>{t("common.loading")}</Typography>
          </ListItem>
        )}

        {showCreateUser && (
          <UpdateUser
            email={email}
            onUserCreated={handleUserCreated}
            open={showCreateUser}
            isCreateUser={false}
            onClose={() => setShowCreateUser(false)}
            initialNickname={user?.nickname}
            initialAddress={user?.address}
            initialExchangePoints={user?.exchangePoints}
            initialContactMethods={user?.contactMethods}
            initialVisibleContentRating={(user as any)?.visibleContentRating}
          />
        )}

        <Dialog
          open={showAddressReminder}
          onClose={() => setShowAddressReminder(false)}
        >
          <DialogTitle>
            {t("user.addressRequiredTitle", "Address Required")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t(
                "user.addressRequiredMessage",
                "Please set your exchange address in your profile before adding items. This helps other users know where to exchange.",
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddressReminder(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="contained" onClick={handleGoToProfile}>
              {t("user.goToProfile", "Go to Profile")}
            </Button>
          </DialogActions>
        </Dialog>

        {showItemForm && user && (
          <ItemForm
            open={showItemForm}
            user={user}
            onClose={() => setShowItemForm(false)}
            onItemCreated={handleItemCreated}
          />
        )}
      </List>

      {/* Floating Chat Button */}
      {hostConfig?.chatLink && (
        <Tooltip
          title={t("home.joinCommunityChat", "Join Community Chat")}
          placement="left"
        >
          <Fab
            color="primary"
            aria-label="chat"
            onClick={handleChatClick}
            sx={{
              position: "fixed",
              bottom: 80, // Increased from 64 to 80 to avoid overlap with bottom navigation bar
              right: 16,
              zIndex: 1000,
            }}
          >
            <ChatIcon />
          </Fab>
        </Tooltip>
      )}
    </>
  );
};

export default HomePage;
