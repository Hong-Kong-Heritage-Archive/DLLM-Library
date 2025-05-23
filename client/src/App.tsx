import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "./firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import {
  User as fireUser,
} from "firebase/auth";

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
      nickname
      location {
        latitude
        longitude
      }
    }
  }
`;

interface Item {
  id: string;
  name: string;
  condition: string;
  status: string;
  category: string[];
}

interface User {
  id: string;
  address: string;
  createdAt: string;
  email: string;
  nickname: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface AppProps {
  user: fireUser | null;
}

const App: React.FC<AppProps> = ({ user }) => {
  const [location, setLocation] = useState<{
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
        })
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
    <Box p={4}>
      <Button onClick={signOut}>Sign Out</Button>

      {meOutput.loading && <Typography>Loading...</Typography>}
      {meOutput.error && (
        <Typography>Error: {meOutput.error.message}</Typography>
      )}
      {meOutput.data && meOutput.data.me ? (
        <>
          <Typography>Welcome, {meOutput.data.me.nickname}</Typography>
          <Button onClick={getLocation}>Use My Location</Button>
          {location && (
            <Box mt={2}>
              <Typography variant="h6">Items within 10km</Typography>
              {itemsByLocationOutput.loading && (
                <Typography>Loading...</Typography>
              )}
              {itemsByLocationOutput.error && (
                <Typography>
                  Error: {itemsByLocationOutput.error.message}
                </Typography>
              )}
              {itemsByLocationOutput.data && (
                <List>
                  {itemsByLocationOutput.data.itemsByLocation.map((item) => (
                    <ListItem key={item.id}>
                      {item.name} ({item.condition}, {item.status})
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography>Please add a box to create user</Typography>
      )}
    </Box>
  );
};

export default App;
