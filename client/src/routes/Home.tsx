import React, { useState, useEffect, useRef } from "react";
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
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
} from "@mui/material";
import { Chat as ChatIcon } from "@mui/icons-material";
import {
  User,
  Item,
  RecommendationType,
  HostConfig,
  NewsStatus,
} from "../generated/graphql";
import RecentItemBanner from "../components/RecentItemBanner";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { sendVerificationEmail } from "../firebase";
import ItemForm from "../components/ItemForm";
import RecentNewsBanner from "../components/RecentNewsBanner";
import AddressReminderDialog from "../components/AddressReminderDialog";
import SearchBar from "../components/SearchBar";

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
  const [recentBannerTab, setRecentBannerTab] = useState<"recent" | "new">(
    "recent",
  );
  const [hotCategorieTab, setHotCategorieTab] = useState<number>(0);
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
          pb: hostConfig?.chatLink ? 8 : 2,
        }}
      >
        {/* Welcome Section */}
        <ListItem>
          <Box sx={{ width: "100%" }}>
            {user?.isVerified ? (
              <Box>
                <Grid container alignItems="center">
                  <Grid size={{ xs: 12, md: 12 }}>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-family-display)",
                        fontWeight: 900,
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        letterSpacing: "-0.5px",
                        lineHeight: "1.1",
                        fontSize: { xs: "18px", sm: "24px", md: "28px" },
                      }}
                    >
                      {t("home.welcome", { nickname: user.nickname })}
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--color-text-tertiary)",
                        fontFamily: "var(--font-family-body)",
                        fontSize: "13px",
                      }}
                    >
                      {t("app.description", "Greetings from the Library! We are Librarians, and we are here to help you discover your next great read. Whether you're searching for resources, reliable information, or something entirely unexpected, we're here to guide you every step of the way. Explore our collection today and find your new favorites!")}
                    </Typography>
                  </Grid>
                </Grid>
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

        <RecentNewsBanner
          newsStatus={NewsStatus.Published}
          isFrontPage={true}
        />
        {userPickedLoading && (
          <ListItem>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>
                {t("home.loadingRecommendations", "Loading recommendations...")}
              </Typography>
            </Box>
          </ListItem>
        )}

        {userPickedError && (
          <ListItem>
            <Alert severity="warning" sx={{ width: "100%" }}>
              {t("home.recommendationsError", "Unable to load recommendations")}
              <Typography variant="caption" display="block">
                {userPickedError.message}
              </Typography>
            </Alert>
          </ListItem>
        )}
        <ListItem>
          <Box sx={{ width: "100%" }}>
            <Tabs
              value={recentBannerTab}
              onChange={(_, value: "recent" | "new") =>
                setRecentBannerTab(value)
              }
              aria-label="recent and new arrivals tabs"
              sx={{ mb: 1 }}
            >
              <Tab value="new" label={t("home.newArrivals", "New Arrivals")} />
              <Tab
                value="recent"
                label={t("item.recent.updatedItems", "Recent Updates")}
              />
              {userPickedData?.recommendedItems &&
                userPickedData.recommendedItems.length > 0 && (
                  <Tab
                    value="userPicked"
                    label={t("home.userPickedItems", "Recommended for You")}
                  />
                )}
            </Tabs>

            {recentBannerTab === "new" ? (
              <RecentItemBanner
                recommendationType={RecommendationType.NewArrivals}
                category=""
              />
            ) : recentBannerTab === "recent" ? (
              <RecentItemBanner category="" />
            ) : (
              userPickedData?.recommendedItems &&
              userPickedData.recommendedItems.length > 0 && (
                <RecentItemBanner
                  recommendationType={RecommendationType.UserPicked}
                  recommendedItems={userPickedData.recommendedItems}
                  titleOverride={""}
                  descriptionOverride={t(
                    "home.userPickedDescription",
                    "Based on your interests and activity",
                  )}
                />
              )
            )}
          </Box>
        </ListItem>

        {recentCategoriesLoading && (
          <ListItem>
            <Typography>{t("common.loading")}</Typography>
          </ListItem>
        )}

        {/* Hot Categories Section */}
        {hotCategoriesData?.hotCategories && (
          <ListItem>
            <Box sx={{ width: "100%" }}>
              <Tabs
                value={hotCategorieTab}
                onChange={(_, value: number) => setHotCategorieTab(value)}
                aria-label="recent and new arrivals tabs"
                sx={{ mb: 1 }}
              >
                {hotCategoriesData.hotCategories.map((category, index) => (
                  <Tab
                    value={index}
                    label={category}
                    key={`hot-category-tab-${index}`}
                  />
                ))}
              </Tabs>
              <ListItem key={`hot-category-${hotCategorieTab}`}>
                <RecentItemBanner
                  category={hotCategoriesData.hotCategories[hotCategorieTab]}
                />
              </ListItem>
            </Box>
          </ListItem>
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

        {showAddressReminder && (
          <AddressReminderDialog
            open={showAddressReminder}
            onClose={() => setShowAddressReminder(false)}
            onGoToProfile={handleGoToProfile}
          />
        )}

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
