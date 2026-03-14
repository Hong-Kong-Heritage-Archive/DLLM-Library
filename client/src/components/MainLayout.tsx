import React, { useState } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Home as HomeIcon,
  Newspaper as NewsIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Article as ArticleIcon,
  SwapHoriz as LoanIcon,
  Label as ClassificationIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, gql } from "@apollo/client";
import { User, Role, HostConfig } from "../generated/graphql";
import { AuthDialog } from "./Auth";
import LanguageSwitcher from "./LanguageSwitcher";
import NewsForm from "./NewsForm";
import ClassificationAssignment from "./ClassificationAssignment";
import OnboardingTour from "./OnboardingTour";

const GET_USER_OPEN_TRANSACTIONS_FOR_COUNT = gql`
  query GetUserOpenTransactionsForCount($userId: ID!) {
    openTransactionsByUser(userId: $userId) {
      id
      status
      createdAt
      item {
        id
        name
      }
    }
  }
`;

interface MainLayoutProps {
  email?: string | null;
  emailVerified?: boolean | null;
  user?: User;
  hostConfig?: HostConfig;
  onSignOut?: () => Promise<void>;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  email,
  emailVerified,
  user,
  hostConfig,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showClassificationAssignment, setShowClassificationAssignment] =
    useState(false);

  // Query for user's open transactions
  const { data: transactionsData } = useQuery(
    GET_USER_OPEN_TRANSACTIONS_FOR_COUNT,
    {
      variables: { userId: user?.id! },
      skip: !user?.id,
      pollInterval: 30000, // Poll every 30 seconds
    }
  );

  const notificationCount =
    transactionsData?.openTransactionsByUser?.length || 0;

  // Determine active bottom nav tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return 0;
    if (path.startsWith("/news")) return 1;
    if (path.startsWith("/exchange-points")) return 2;
    if (path.startsWith("/loan-items")) return 3;
    if (path.startsWith("/profile") || path.startsWith("/user/")) return 4;
    return 0; // Default to home
  };

  const [bottomNavValue, setBottomNavValue] = useState(getActiveTab());

  // Update bottom nav when route changes
  React.useEffect(() => {
    setBottomNavValue(getActiveTab());
  }, [location.pathname]);

  // Handlers
  const handleBottomNavigation = (
    _: React.SyntheticEvent,
    newValue: number
  ) => {
    setBottomNavValue(newValue);

    switch (newValue) {
      case 0:
        navigate("/");
        break;
      case 1:
        navigate("/news");
        break;
      case 2:
        navigate("/exchange-points");
        break;
      case 3:
        // Loan Items - only accessible when logged in
        if (user?.isVerified) {
          navigate("/loan-items?tab=borrowed");
        } else {
          setAuthDialogOpen(true);
        }
        break;
      case 4:
        if (user?.isVerified) {
          navigate("/profile");
        } else {
          setAuthDialogOpen(true);
        }
        break;
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    setTimeout(() => {
      navigate("/profile");
    }, 500);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddNews = () => {
    setShowNewsForm(true);
    handleMenuClose();
  };

  const handleClassificationAssignment = () => {
    setShowClassificationAssignment(true);
    handleMenuClose();
  };

  const handleNotificationsClick = () => {
    navigate("/transactions");
  };

  const handleNewsCreated = () => {
    setShowNewsForm(false);
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top AppBar */}
      <AppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            {t("app.title", "DLLM Library")}
          </Typography>

          <LanguageSwitcher />

          {/* Notification Bell - only show for authenticated users */}
          {user && (
            <IconButton
              color="inherit"
              onClick={handleNotificationsClick}
              sx={{ mr: 1 }}
              title={t("transactions.viewTransactions", "View Transactions")}
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}

          {/* Menu Button - only show for Admin users */}
          {user && user?.role === Role.Admin && (
            <>
              <IconButton
                color="inherit"
                onClick={handleMenuClick}
                title={t("common.menu", "Menu")}
              >
                <MenuIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem onClick={handleAddNews}>
                  <ListItemIcon>
                    <ArticleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("news.create", "Add News")}</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleClassificationAssignment}>
                  <ListItemIcon>
                    <ClassificationIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {t(
                      "classification.assignClassifications",
                      "Assign Classifications"
                    )}
                  </ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: 7, // Space for bottom navigation
          overflow: "auto",
        }}
      >
        <Outlet
          context={{ email, emailVerified, user, hostConfig, onSignOut }}
        />
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavigation}
          showLabels
        >
          <BottomNavigationAction
            label={t("navigation.home", "Home")}
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            label={t("navigation.news", "News")}
            icon={<NewsIcon />}
            data-tour="news-nav"
          />
          <BottomNavigationAction
            label={t("navigation.exchangePoints", "Exchange Points")}
            icon={<LocationIcon />}
          />
          {/* Loan Items - Only show when user is logged in */}
          {user?.isVerified && (
            <BottomNavigationAction
              label={t("navigation.loanItems", "Loans")}
              icon={<LoanIcon />}
            />
          )}
          <BottomNavigationAction
            label={t("navigation.profile", "Profile")}
            icon={<PersonIcon />}
            data-tour="profile-nav"
          />
        </BottomNavigation>
      </Paper>

      {/* Dialogs */}
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultIsSignUp={false}
      />

      {showNewsForm && (
        <NewsForm
          open={showNewsForm}
          onClose={() => setShowNewsForm(false)}
          onSuccess={handleNewsCreated}
        />
      )}

      <ClassificationAssignment
        open={showClassificationAssignment}
        onClose={() => setShowClassificationAssignment(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour isLoggedIn={!!user} isVerified={user?.isVerified} />
    </Box>
  );
};

export default MainLayout;
