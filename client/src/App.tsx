import React from "react";
import { useQuery, gql } from "@apollo/client";
import { User as fireUser } from "firebase/auth";
import { User } from "./generated/graphql"; // Adjust the import path as necessary
import { createRouter } from "./Router";
import { RouterProvider } from "react-router";

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
};

export default App;
