import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import {
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Pagination,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Badge,
} from "@mui/material";
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { User, Item } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import RecentItemBanner from "../components/RecentItemBanner";
import ItemForm from "../components/ItemForm";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

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

const GET_USER_OPEN_TRANSACTIONS_FOR_COUNT = gql`
  query GetUserOpenTransactionsForCount($userId: ID!) {
    openTransactionsByUser(userId: $userId) {
      id
      status
      createdAt
      item {
        id
        name
      }
    }
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

  // State for controlling CreateUser dialog
  const [showCreateUser, setShowCreateUser] = useState(false);

  // State for exchange points pagination
  const [exchangePointsPage, setExchangePointsPage] = useState(1);
  const exchangePointsPerPage = 5;

  // Query for user's open transactions to show notification count
  const { data: transactionsData } = useQuery(
    GET_USER_OPEN_TRANSACTIONS_FOR_COUNT,
    {
      variables: { userId: user?.id! },
      skip: !user?.id,
      pollInterval: 30000, // Poll every 30 seconds for new transactions
    }
  );

  const handleItemCreated = () => {
    recentCategoriesRefetch();
    hotCategoriesRefetch();
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleTransactionsClick = () => {
    navigate("/transactions");
  };

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Query for recent categories
  const {
    data: recentCategoriesData,
    loading: recentCategoriesLoading,
    error: recentCategoriesError,
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
    error: errorHotCategories,
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
    // Optionally refresh the page or refetch user data
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

  // Calculate total pages for exchange points
  const totalExchangePointsPages = exchangePointsCountData?.exchangePointsCount
    ? Math.ceil(
        exchangePointsCountData.exchangePointsCount / exchangePointsPerPage
      )
    : 0;

  // Calculate notification count
  const notificationCount =
    transactionsData?.openTransactionsByUser?.length || 0;

  return (
    <List>
      <ListItem>
        {user ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Typography sx={{ flex: 1 }}>
              {t("home.welcome", { nickname: user.nickname })}
            </Typography>

            {/* Notifications Bell Icon */}
            <IconButton
              onClick={handleTransactionsClick}
              sx={{ mr: 1 }}
              title={t("transactions.viewTransactions", "View Transactions")}
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {user?.isActive && (
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => handleUserClick(user.id)}
              />
            )}
            {user?.isActive && <ItemForm onItemCreated={handleItemCreated} />}
            <Button variant="contained" onClick={signOut}>
              {t("auth.signOut")}
            </Button>
          </Box>
        ) : (
          email && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <Typography sx={{ flex: 1 }}>
                {t("home.welcome")} {email}
              </Typography>
              {emailVerified && (
                <Button
                  variant="contained"
                  onClick={() => setShowCreateUser(true)}
                >
                  {t("auth.createProfile")}
                </Button>
              )}
              <Button variant="outlined" onClick={signOut}>
                {t("auth.signOut")}
              </Button>
            </Box>
          )
        )}
      </ListItem>

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

              {/* Pagination */}
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

      <ListItem>
        <Button variant="contained" onClick={handleViewAllItems}>
          {t("navigation.viewAllItems")}
        </Button>
      </ListItem>

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

      {/* Loading state for recent categories */}
      {recentCategoriesLoading && (
        <ListItem>
          <Typography>{t("common.loading")}</Typography>
        </ListItem>
      )}

      {/* Recent Categories Section */}
      {hotCategoriesData?.hotCategories && (
        <>
          {hotCategoriesData.hotCategories.map((category, index) => (
            <ListItem key={`hot-category-${index}`}>
              <RecentItemBanner category={category} isRecent={false} />
            </ListItem>
          ))}
        </>
      )}

      {/* Loading state for recent categories */}
      {recentCategoriesLoading && (
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
