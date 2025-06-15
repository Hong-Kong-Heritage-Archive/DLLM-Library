import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "./firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User as fireUser } from "firebase/auth";
import { User, Item } from "./generated/graphql"; // Adjust the import path as necessary
import Map from "./components/Map";
import { createRouter } from "./Router";
import { RouterProvider } from "react-router";

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
  const meOutput = useQuery<{ me: User }>(ME_QUERY, {
    skip: !user,
  });

  const router = createRouter(user?.email, meOutput?.data?.me);

  return <RouterProvider router={router} />;

  /*
  return (
    <Box p={2}>
      <List>
        {user && (
          <ListItem>
            {meOutput.data && meOutput.data.me ? (
                <>

                  <Typography>Welcome, {meOutput.data.me.nickname}</Typography>
                  <Button onClick={signOut}>Sign Out</Button>
                </>
            ) : (
              <>
                <Typography>TODO: Please add a box to create user</Typography>
                <Button onClick={signOut}>Sign Out</Button>
              </>
            )}
          </ListItem>
        )}
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
  */
};

export default App;
