import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import { Button, Box, Typography, List, ListItem } from "@mui/material";
import { User as fireUser } from "firebase/auth";
import { User, Item } from "../generated/graphql";
import Map from "../components/Map";
import { Link } from "react-router";
import { useOutletContext } from 'react-router-dom';
import CreateUser from "../components/UserProfile";


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

interface OutletContext {
  user?: User;
}

const HomePage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
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

  const [userFormOpen, setUserFormOpen] = useState(false);


  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <Box p={2}>
      <List>
        {/* {user && ( */}
          <ListItem>
            {user ? (
              <>
                <Typography>Welcome, {user.nickname}</Typography>
                <Button onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setUserFormOpen(!userFormOpen)}>
                  Create User
                </Button>
                {userFormOpen && <CreateUser onUserCreated={() => { }} />}
                <Button onClick={signOut}>Sign Out</Button>
              </>
            )}
          </ListItem>
        {/* )} */}
        <ListItem>
          <Button component={Link} to="/news" variant="outlined">
            View News
          </Button>
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
      </List>
    </Box>
  );
};

export default HomePage;