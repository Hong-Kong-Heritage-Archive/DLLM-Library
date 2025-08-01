import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User, Item } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import RecentItemBanner from "../components/RecentItemBanner";
import ItemForm from "../components/ItemForm";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import ItemSummary from "../components/ItemSummary";
import { calculateDistance } from "../utils/geoProcessor";

const RecentCategoriesQuery = gql`
  query RecentCategories($limit: Int!) {
    recentUpdateCategories(limit: $limit)
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, email } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // State for controlling CreateUser dialog
  const [showCreateUser, setShowCreateUser] = useState(false);

  // State for controlling UpdateUser dialog
  const [showUpdateUser, setShowUpdateUser] = useState(false);

  const handleItemCreated = () => {
    refetch();
  };

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Query for recent categories
  const {
    data: recentCategoriesData,
    loading: recentCategoriesLoading,
    error,
    refetch,
  } = useQuery<{
    recentUpdateCategories: string[];
  }>(RecentCategoriesQuery, {
    variables: { limit: 3 },
  });

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
            {user?.isActive && <ItemForm onItemCreated={handleItemCreated} />}
            <Button variant="outlined" onClick={() => setShowUpdateUser(true)}>
              {t("auth.editProfile")}
            </Button>
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
              <Button
                variant="contained"
                onClick={() => setShowCreateUser(true)}
              >
                {t("auth.createProfile")}
              </Button>
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

      {/* Recent Categories Section */}
      {recentCategoriesData?.recentUpdateCategories && (
        <>
          {recentCategoriesData.recentUpdateCategories.map(
            (category, index) => (
              <ListItem key={`recent-category-${index}`}>
                <RecentItemBanner category={category} />
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

      <ListItem>
        <Button variant="contained" onClick={handleViewAllItems}>
          {t("navigation.viewAllItems")}
        </Button>
      </ListItem>

      {/* UpdateUser Dialog - Only render when needed */}
      {showUpdateUser && (
        <UpdateUser
          email={email}
          onUserCreated={handleUserCreated}
          open={showUpdateUser}
          isCreateUser={false}
          initialNickname={user?.nickname}
          initialAddress={user?.address}
          onClose={() => setShowUpdateUser(false)}
        />
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
