import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import {
  Button,
  Box,
  Typography,
  List,
  ListItem,
  Pagination,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { User, Item, RecommendationType } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import RecentItemBanner from "../components/RecentItemBanner";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { sendVerificationEmail } from "../firebase";

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

const GET_EXCHANGE_POINTS = gql`
  query GetExchangePoints($limit: Int, $offset: Int) {
    exchangePoints(limit: $limit, offset: $offset) {
      id
      nickname
      address
      location {
        latitude
        longitude
        geohash
      }
    }
  }
`;

const GET_EXCHANGE_POINTS_COUNT = gql`
  query GetExchangePointsCount {
    exchangePointsCount
  }
`;

interface ExchangePoint {
  id: string;
  nickname: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
}

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, emailVerified, email } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [exchangePointsPage, setExchangePointsPage] = useState(1);
  const exchangePointsPerPage = 5;

  const handleItemCreated = () => {
    recentCategoriesRefetch();
    hotCategoriesRefetch();
    userPickedRefetch();
  };

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  // Query for exchange points with pagination
  const {
    data: exchangePointsData,
    loading: exchangePointsLoading,
    error: exchangePointsError,
  } = useQuery<{
    exchangePoints: ExchangePoint[];
  }>(GET_EXCHANGE_POINTS, {
    variables: {
      limit: exchangePointsPerPage,
      offset: (exchangePointsPage - 1) * exchangePointsPerPage,
    },
  });

  // Query for total count of exchange points
  const { data: exchangePointsCountData } = useQuery<{
    exchangePointsCount: number;
  }>(GET_EXCHANGE_POINTS_COUNT);
  const getLocation = () => {
    if (user?.location?.latitude) {
      setLocation({
        latitude: user?.location.latitude,
        longitude: user?.location.longitude,
      });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        (err) => console.error(err)
      );
    }
  };

  const signOut = async () => {
    await auth.signOut();
  };

  const handleUserCreated = () => {
    setShowCreateUser(false);
    window.location.reload();
  };

  const handleViewAllItems = () => {
    navigate("/item/all");
  };

  const handleExchangePointClick = (exchangePointId: string) => {
    navigate(`/user/${exchangePointId}`);
  };

  const handleExchangePointsPageChange = (value: number) => {
    setExchangePointsPage(value);
  };

  const totalExchangePointsPages = exchangePointsCountData?.exchangePointsCount
    ? Math.ceil(
        exchangePointsCountData.exchangePointsCount / exchangePointsPerPage
      )
    : 0;

  return (
    <List>
      {/* Welcome Section */}
      <ListItem>
        <Box sx={{ width: "100%" }}>
          {user ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t("home.welcome", { nickname: user.nickname })}
              </Typography>
              {!user.isActive && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t(
                    "home.accountPending",
                    "Your account is pending activation."
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
                  {emailVerified ? (
                    <Button
                      variant="contained"
                      onClick={() => setShowCreateUser(true)}
                      size="large"
                    >
                      {t("auth.createProfile")}
                    </Button>
                  ) : (
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
                        "Resend Verification Email"
                      )}
                    </Button>
                  )}
                  <Button variant="outlined" onClick={signOut} size="large">
                    {t("auth.signOut")}
                  </Button>
                </Box>
              </Box>
            )
          )}
        </Box>
      </ListItem>

      {/* Recent News Banner */}
      <ListItem>
        <RecentNewsBanner user={user} />
      </ListItem>

      {/* Exchange Points Section */}
      <ListItem>
        <Box sx={{ width: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("home.exchangePoints", "Exchange Points")}
          </Typography>

          {exchangePointsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1 }}>
                {t("home.loadingExchangePoints", "Loading exchange points...")}
              </Typography>
            </Box>
          )}

          {exchangePointsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("home.exchangePointsError", "Error loading exchange points")}:{" "}
              {exchangePointsError.message}
            </Alert>
          )}

          {exchangePointsData?.exchangePoints && (
            <>
              <Box sx={{ mb: 2 }}>
                {exchangePointsData.exchangePoints.map((point) => (
                  <Card
                    key={point.id}
                    sx={{
                      mb: 1,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                    onClick={() => handleExchangePointClick(point.id)}
                  >
                    <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {point.nickname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {point.address}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {totalExchangePointsPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={totalExchangePointsPages}
                    page={exchangePointsPage}
                    onChange={(_, value) =>
                      handleExchangePointsPageChange(value)
                    }
                    color="primary"
                    size="small"
                  />
                </Box>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                {t(
                  "home.exchangePointsCount",
                  "{{current}} of {{total}} exchange points",
                  {
                    current: exchangePointsData.exchangePoints.length,
                    total: exchangePointsCountData?.exchangePointsCount || 0,
                  }
                )}
              </Typography>
            </>
          )}

          {exchangePointsData?.exchangePoints?.length === 0 && (
            <Alert severity="info">
              {t("home.noExchangePoints", "No exchange points available.")}
            </Alert>
          )}
        </Box>
      </ListItem>

      {/* View All Items Button */}
      <ListItem>
        <Button variant="contained" onClick={handleViewAllItems} size="large">
          {t("navigation.viewAllItems")}
        </Button>
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
                    "Loading recommendations..."
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
                  "Unable to load recommendations"
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
                    "Recommended for You"
                  )}
                  descriptionOverride={t(
                    "home.userPickedDescription",
                    "Based on your interests and activity"
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
                    "No recommendations available at the moment. Browse items to help us learn your preferences!"
                  )}
                </Alert>
              </ListItem>
            )}
        </>
      )}

      {/* Recent Categories Section */}
      {recentCategoriesData?.recentUpdateCategories && (
        <>
          {recentCategoriesData.recentUpdateCategories.map(
            (category, index) => (
              <ListItem key={`recent-category-${index}`}>
                <RecentItemBanner category={category} isRecent={true} />
              </ListItem>
            )
          )}
        </>
      )}

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
          isCreateUser={true}
          onClose={() => setShowCreateUser(false)}
        />
      )}
    </List>
  );
};

export default HomePage;
