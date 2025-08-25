import React, { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { User as fireUser } from "firebase/auth";
import { User } from "./generated/graphql"; // Adjust the import path as necessary
import { createRouter } from "./Router";
import { RouterProvider, useNavigate } from "react-router";

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

  // Handle redirect from server-side routing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');

    if (redirectPath) {
      // Remove the redirect parameter from URL and navigate to the intended path
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('redirect');
      window.history.replaceState({}, '', newUrl.toString());

      // Navigate to the intended path
      window.location.href = redirectPath;
    }
  }, []);

  const router = createRouter(user?.email, meOutput?.data?.me);

  return <RouterProvider router={router} />;
};

export default App;
