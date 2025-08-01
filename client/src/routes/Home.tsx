import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User, Item } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import RecentItemBanner from "../components/RecentItemBanner";
import Map from "../components/Map";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import ItemSummary from "../components/ItemSummary";
import { calculateDistance } from "../utils/geoProcessor";

const ITEMS_QUERY = gql`
  query ItemsByLocation(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Float!
  ) {
    itemsByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
    ) {
      id
      name
      condition
      status
      location {
        latitude
        longitude
      }
      images
      category
    }
  }
`;

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

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Query for recent categories
  const { data: recentCategoriesData, loading: recentCategoriesLoading } =
    useQuery<{
      recentUpdateCategories: string[];
    }>(RecentCategoriesQuery, {
      variables: { limit: 3 },
    });

  const itemsByLocationOutput = useQuery<{ itemsByLocation: Item[] }>(
    ITEMS_QUERY,
    {
      variables: location ? { ...location, radiusKm: 10 } : undefined,
      skip: !location,
    }
  );

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
                <RecentItemBanner user={user} category={category} />
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
        <Button variant="contained" onClick={getLocation}>
          {t("home.displayNearbyItems")}
        </Button>
      </ListItem>

      {itemsByLocationOutput.data && (
        <Box mt={2}>
          <Typography variant="h6">{t("home.itemsWithinRadius")}</Typography>
          <List>
            {itemsByLocationOutput.data.itemsByLocation.map((item) => (
              <ItemSummary
                key={item.id}
                item={{
                  id: item.id,
                  name: item.name,
                  distance:
                    item.location && location
                      ? calculateDistance(
                        item.location?.latitude,
                        item.location?.longitude,
                        location.latitude,
                        location.longitude
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
        </Box>
      )}

      {itemsByLocationOutput.loading && (
        <Typography>{t("common.loading")}</Typography>
      )}

      {itemsByLocationOutput.error && (
        <ListItem>
          <Typography>
            {t("common.error", {
              message: itemsByLocationOutput.error.message,
            })}
          </Typography>
        </ListItem>
      )}

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
