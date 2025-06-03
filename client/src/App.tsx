import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "./firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User as fireUser } from "firebase/auth";
import { User, Item } from "./generated/graphql"; // Adjust the import path as necessary
import Map from "./components/Map";
import News from "./News";

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

const ME_QUERY = gql`
  query Me {
    me {
      address
      createdAt
      email
      id
      isVerified
      isActive
      role
      nickname
      location {
        latitude
        longitude
      }
    }
  }
`;

interface AppProps {
  user: fireUser | null;
}

const App: React.FC<AppProps> = ({ user }) => {
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

  const meOutput = useQuery<{ me: User }>(ME_QUERY, {
    skip: !user,
  });

  const getLocation = () => {
    if (meOutput.data?.me?.location?.latitude) {
      setLocation({
        latitude: meOutput.data.me.location.latitude,
        longitude: meOutput.data.me.location.longitude,
      });
      setMapLocation({
        latitude: meOutput.data.me.location.latitude,
        longitude: meOutput.data.me.location.longitude,
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

  return (
    <Box p={2}>
      <List>
        {user && (
          <ListItem>
            {meOutput.data && meOutput.data.me ? (
                <>
                  {/* display user with nickname and address */}
                  <Typography>Welcome, {meOutput.data.me.nickname}</Typography>
                  <Button onClick={signOut}>Sign Out</Button>
                </>
            ) : (
              <Typography>TODO: Please add a box to create user</Typography>
            )}
          </ListItem>
        )}
        <ListItem>
          <News user={meOutput?.data?.me} />
        </ListItem>
        <ListItem>
          <Button variant="contained" onClick={getLocation}>
            Display nearby items
          </Button>
          {location && (
            <>
              <Map
                open={maplocation != null}
                closeEvent={(event, reason) => setMapLocation(null)}
                location={maplocation}
              />
            </>
          )}
        </ListItem>
        {itemsByLocationOutput.data && (
          <Box mt={2}>
            <Typography variant="h6">Items within 10km</Typography>
            <List>
              {itemsByLocationOutput.data.itemsByLocation.map((item) => (
                <ListItem key={item.id}>
                  {item.name} ({item.condition}, {item.status})
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        {itemsByLocationOutput.loading && <Typography>Loading...</Typography>}
        {itemsByLocationOutput.error && (
          <ListItem>
            <Typography>
              Error: {itemsByLocationOutput.error.message}
            </Typography>
          </ListItem>
        )}
        {meOutput.loading && <Typography>Loading user...</Typography>}
        {meOutput.error && (
          <ListItem>
            <Typography>Error: {meOutput.error.message}</Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default App;
