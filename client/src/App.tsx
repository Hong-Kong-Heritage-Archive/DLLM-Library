import React, { useEffect, useState } from "react";
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
  const [initialPath, setInitialPath] = useState<string | null>(null);

  // Handle sessionStorage redirects on component mount
  useEffect(() => {
    const viewItemId = sessionStorage.getItem('viewItemId');
    const viewUserId = sessionStorage.getItem('viewUserId');
    const viewTransactionId = sessionStorage.getItem('viewTransactionId');
    const redirectPath = sessionStorage.getItem('redirectPath');

    if (viewItemId) {
      setInitialPath(`/item/${viewItemId}`);
      sessionStorage.removeItem('viewItemId');
    } else if (viewUserId) {
      setInitialPath(`/user/${viewUserId}`);
      sessionStorage.removeItem('viewUserId');
    } else if (viewTransactionId) {
      setInitialPath(`/transaction/${viewTransactionId}`);
      sessionStorage.removeItem('viewTransactionId');
    } else if (redirectPath) {
      setInitialPath(redirectPath);
      sessionStorage.removeItem('redirectPath');
    }
  }, []);

  const router = createRouter(
    user?.email,
    user?.emailVerified,
    meOutput?.data?.me,
    initialPath
  );

  return <RouterProvider router={router} />;
};

export default App;
