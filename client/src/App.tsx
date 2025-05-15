import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Button, Box, Typography, List, ListItem } from '@mui/material';
import { User as fireUser , createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';


const ITEMS_QUERY = gql`
  query ItemsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!) {
    itemsByLocation(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
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
}

interface AppProps {
  user: fireUser | null;
}

const App: React.FC<AppProps> = ({user}) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => console.error(err)
    );
  };

  const itemsByLocationOutput = useQuery<{ itemsByLocation: Item[] }>(ITEMS_QUERY, {
    variables: location ? { ...location, radiusKm: 10 } : undefined,
    skip: !location,
  });

  
  const meOutput = useQuery<{ me: User }>(ME_QUERY, {
    skip: !user,
  });

  return (
    <Box p={4}>
        {meOutput.loading && <Typography>Loading...</Typography>}
        {meOutput.error && <Typography>Error: {meOutput.error.message}</Typography>}
        {meOutput.data &&  
            <>
                <Button onClick={getLocation}>Use My Location</Button>
            {location && (
            <Box mt={2}>
            <Typography variant="h6">Items within 10km</Typography>
            {itemsByLocationOutput.loading && <Typography>Loading...</Typography>}
            {itemsByLocationOutput.error && <Typography>Error: {itemsByLocationOutput.error.message}</Typography>}
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
        )}</>
        }
    </Box>
  );
};

/*
  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      {user ? ((meOutput === undefined || meOutput.data) ? (
        <>
          <Typography>Welcome, {(meOutput !== undefined) ? "me " : user.email }</Typography>
          <Button onClick={signOut}>Sign Out</Button>
          <Button onClick={getLocation}>Use My Location</Button>
          {location && (
            <Box mt={2}>
              <Typography variant="h6">Items within 10km</Typography>
              {itemsByLocationOutput.loading && <Typography>Loading...</Typography>}
              {itemsByLocationOutput.error && <Typography>Error: {itemsByLocationOutput.error.message}</Typography>}
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
      ):(
        <Box mt={2}>
            {meOutput.loading && <Typography>Loading...</Typography>}
            {meOutput.error && <Typography>Error: {meOutput.error.message}</Typography>}
        </Box>
      )) : (
        <>
        <Button onClick={signUp}>Sign up with Email</Button>
        <Button onClick={signIn}>Sign In</Button>
        </>
      )}
    </Box>
  );
};
*/
export default App;