import React, { useEffect, useState, useRef } from "react";
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
  onSignOut: () => Promise<void>;
}

const App: React.FC<AppProps> = ({ user, onSignOut }) => {
  const meOutput = useQuery<{ me: User }>(ME_QUERY, {
    skip: !user,
    fetchPolicy: "cache-first", // Use cache first, refetch manually when needed
  });
  const [initialPath, setInitialPath] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  // Refetch ME_QUERY when user changes
  useEffect(() => {
    const currentUserId = user?.uid || null;
    const previousUserId = previousUserIdRef.current;

    // Check if user changed from null to having a value, or if user ID changed
    if (currentUserId && currentUserId !== previousUserId) {
      console.log("User changed, refetching ME_QUERY", {
        previous: previousUserId,
        current: currentUserId,
      });

      // Small delay to ensure Firebase auth token is ready
      const timeoutId = setTimeout(() => {
        meOutput.refetch().catch((error) => {
          console.error("Error refetching ME_QUERY:", error);
        });
      }, 100);

      // Cleanup timeout if component unmounts
      return () => clearTimeout(timeoutId);
    } else if (!currentUserId && previousUserId) {
      // User logged out
      console.log("User logged out");
    }

    // Update the ref with current user ID
    previousUserIdRef.current = currentUserId;
  }, [user?.uid, meOutput]);

  // Handle sessionStorage redirects on component mount
  useEffect(() => {
    const viewItemId = sessionStorage.getItem("viewItemId");
    const viewUserId = sessionStorage.getItem("viewUserId");
    const viewTransactionId = sessionStorage.getItem("viewTransactionId");
    const redirectPath = sessionStorage.getItem("redirectPath");

    if (viewItemId) {
      setInitialPath(`/item/${viewItemId}`);
      sessionStorage.removeItem("viewItemId");
    } else if (viewUserId) {
      setInitialPath(`/user/${viewUserId}`);
      sessionStorage.removeItem("viewUserId");
    } else if (viewTransactionId) {
      setInitialPath(`/transaction/${viewTransactionId}`);
      sessionStorage.removeItem("viewTransactionId");
    } else if (redirectPath) {
      setInitialPath(redirectPath);
      sessionStorage.removeItem("redirectPath");
    }
  }, []);

  const router = createRouter(
    user?.email,
    user?.emailVerified,
    meOutput?.data?.me,
    onSignOut
    //    initialPath
  );

  return <RouterProvider router={router} />;
};

export default App;
