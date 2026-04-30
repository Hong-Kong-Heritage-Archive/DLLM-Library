import React, { useEffect, useState, useRef } from "react";
import { useQuery, gql } from "@apollo/client";
import { User as fireUser } from "firebase/auth";
import { User, HostConfig } from "./generated/graphql";
import { createRouter } from "./Router";
import { RouterProvider } from "react-router";
import SplashScreen from "./components/SplashScreen";
import { CircularProgress, Box } from "@mui/material";
import { getCookie, setCookie } from "./utils/cookies";

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
      visibleContentRating
      location {
        latitude
        longitude
      }
    }
  }
`;

const HostConfigQuery = gql`
  query HostConfig {
    hostConfig {
      aboutUsText
      chatLink
      splashScreenImageUrl
      splashScreenText
      itemShareMessageTemplates
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
    fetchPolicy: "cache-first",
  });
  const hostConfigOutput = useQuery<{ hostConfig: HostConfig }>(
    HostConfigQuery,
    {
      fetchPolicy: "cache-first",
    },
  );
  const [initialPath, setInitialPath] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const [showSplash, setShowSplash] = useState(false); // Changed to false by default
  const [splashCompleted, setSplashCompleted] = useState(false);

  // Check if splash screen should be shown based on cookie
  useEffect(() => {
    const splashCookie = getCookie("dllm_splash_shown");
    console.log("Splash cookie:", splashCookie);
    const shouldShowSplash = !splashCookie;
    setShowSplash(shouldShowSplash);
  }, []);

  // Refetch ME_QUERY when user changes
  useEffect(() => {
    const currentUserId = user?.uid || null;
    const previousUserId = previousUserIdRef.current;

    if (currentUserId && currentUserId !== previousUserId) {
      console.log("User changed, refetching ME_QUERY", {
        previous: previousUserId,
        current: currentUserId,
      });

      const timeoutId = setTimeout(() => {
        meOutput.refetch().catch((error) => {
          console.error("Error refetching ME_QUERY:", error);
        });
        hostConfigOutput.refetch().catch((error) => {
          console.error("Error refetching HostConfigQuery:", error);
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (!currentUserId && previousUserId) {
      console.log("User logged out");
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.uid, meOutput, hostConfigOutput]);

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

  const handleSplashComplete = () => {
    setSplashCompleted(true);
    setShowSplash(false);
    // Set cookie to expire in 14 days (2 weeks)
    setCookie("book_guide_splash_shown", "true", {
      expires: 14,
      path: "/",
      sameSite: "Lax",
    });
  };

  const router = createRouter(
    user?.email,
    user?.emailVerified,
    meOutput?.data?.me,
    hostConfigOutput?.data?.hostConfig,
    onSignOut,
  );

  // Show splash screen until HostConfig is loaded and minimum time has passed
  if (
    showSplash &&
    !splashCompleted &&
    !hostConfigOutput.loading &&
    hostConfigOutput.data?.hostConfig
  ) {
    return (
      <SplashScreen
        text={hostConfigOutput.data.hostConfig.splashScreenText}
        image={hostConfigOutput.data.hostConfig.splashScreenImageUrl}
        onComplete={handleSplashComplete}
        minDisplayTime={10000} // 10 seconds
      />
    );
  }

  // Show loading spinner while waiting for initial data
  if (hostConfigOutput.loading || (user && meOutput.loading)) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "white" }} />
      </Box>
    );
  }

  return <RouterProvider router={router} />;
};

export default App;
