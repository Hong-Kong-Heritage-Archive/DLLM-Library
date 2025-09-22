import React, { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { User as fireUser } from "firebase/auth";
import { User } from "./generated/graphql"; // Adjust the import path as necessary
import { createRouter } from "./Router";
import { RouterProvider, useNavigate, useLocation } from "react-router";

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
      exchangePoints
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

  const router = createRouter(
    user?.email,
    user?.emailVerified,
    meOutput?.data?.me
  );

  return <RouterProvider router={router} />;
};

export default App;
