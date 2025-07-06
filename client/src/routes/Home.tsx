import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User, Item } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import RecentItemBanner from "../components/RecentItemBanner";
import Map from "../components/Map";
import { useOutletContext } from "react-router-dom";
import CreateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";

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
      category
    }
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, email } = useOutletContext<OutletContext>();

  // State for controlling CreateUser dialog
  const [showCreateUser, setShowCreateUser] = useState(false);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [maplocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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
      setMapLocation({
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Typography sx={{ flex: 1 }}>
              {t("home.welcome", { nickname: user.nickname })}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowCreateUser(true)}
            >
              Edit Profile
            </Button>
            <Button
              variant="contained"
              onClick={signOut}
            >
              {t("auth.signOut")}
            </Button>
          </Box>
        ) : (
          email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography sx={{ flex: 1 }}>
                {t("home.welcome")} {email}
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowCreateUser(true)}
              >
                Create Profile
              </Button>
              <Button
                variant="outlined"
                onClick={signOut}
              >
                {t("auth.signOut")}
              </Button>
            </Box>
          )
        )}
      </ListItem>

      <ListItem>
        <RecentNewsBanner user={user} />
      </ListItem>

      <ListItem>
        <RecentItemBanner user={user} category="" />
      </ListItem>

      <ListItem>
        <Button variant="contained" onClick={getLocation}>
          {t("home.displayNearbyItems")}
        </Button>
        {location && (
          <>
            <Map
              open={maplocation != null}
              closeEvent={() => setMapLocation(null)}
              location={maplocation}
            />
          </>
        )}
      </ListItem>

      {itemsByLocationOutput.data && (
        <Box mt={2}>
          <Typography variant="h6">{t("home.itemsWithinRadius")}</Typography>
          <List>
            {itemsByLocationOutput.data.itemsByLocation.map((item) => (
              <ListItem key={item.id}>
                {item.name} ({item.condition}, {item.status})
              </ListItem>
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

      {/* CreateUser Dialog - Only render when needed */}
      {showCreateUser && (
        <CreateUser
          onUserCreated={handleUserCreated}
          open={showCreateUser}
          onClose={() => setShowCreateUser(false)}
        />
      )}
    </List>
  );
};

export default HomePage;