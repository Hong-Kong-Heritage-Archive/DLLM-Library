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
  Container,
} from "@mui/material";
import {
  Home as HomeIcon,
  Newspaper as NewsIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Article as ArticleIcon,
  ExitToApp as LogoutIcon,
  Bookmark as BookmarkIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, gql } from "@apollo/client";
import { auth } from "../firebase";
import { User, Role } from "../generated/graphql";
import { AuthDialog } from "./Auth";
import LanguageSwitcher from "./LanguageSwitcher";
import ItemForm from "./ItemForm";
import NewsForm from "./NewsForm";

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
}

const MainLayout: React.FC<MainLayoutProps> = ({
  email,
  emailVerified,
  user,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);

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
    if (path.startsWith("/profile") || path.startsWith("/user/")) return 3;
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

  const handleUserProfile = () => {
    if (user?.id) {
      navigate(`/user/${user.id}`);
    }
    handleMenuClose();
  };

  const handleAddItem = () => {
    setShowItemForm(true);
    handleMenuClose();
  };

  const handleAddNews = () => {
    setShowNewsForm(true);
    handleMenuClose();
  };

  const handleLogout = async () => {
    await auth.signOut();
    handleMenuClose();
  };

  const handleNotificationsClick = () => {
    navigate("/transactions");
  };

  const handleOnLoanItems = () => {
    navigate("/items/on-loan");
    handleMenuClose();
  };

  const handleBorrowedItems = () => {
    navigate("/items/borrowed-items");
    handleMenuClose();
  };
  const handleItemCreated = () => {
    setShowItemForm(false);
    if (window.location.pathname === "/") {
      window.location.reload();
    }
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

          {/* Menu Button - only show for active users */}
          {user && user.isActive && (
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
                <MenuItem onClick={handleUserProfile}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {t("home.profile", "User Profile")}
                  </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleOnLoanItems}>
                  <ListItemIcon>
                    <BookmarkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {t("home.onLoanItems", "Items On Loan")}
                  </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleBorrowedItems}>
                  <ListItemIcon>
                    <BookmarkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {t("home.onBorrowItems", "Items I've Borrowed")}
                  </ListItemText>
                </MenuItem>

                {user?.isVerified && (
                  <MenuItem onClick={handleAddItem}>
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t("item.create", "Add Item")}</ListItemText>
                  </MenuItem>
                )}

                {user?.role === Role.Admin && (
                  <MenuItem onClick={handleAddNews}>
                    <ListItemIcon>
                      <ArticleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t("news.create", "Add News")}</ListItemText>
                  </MenuItem>
                )}

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("auth.signOut", "Sign Out")}</ListItemText>
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
        <Outlet context={{ email, emailVerified, user }} />
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
          />
          <BottomNavigationAction
            label={t("navigation.exchangePoints", "Exchange Points")}
            icon={<LocationIcon />}
          />
          <BottomNavigationAction
            label={t("navigation.profile", "Profile")}
            icon={<PersonIcon />}
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

      {showItemForm && (
        <ItemForm
          open={showItemForm}
          onClose={() => setShowItemForm(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      {showNewsForm && (
        <NewsForm
          open={showNewsForm}
          onClose={() => setShowNewsForm(false)}
          onNewsCreated={handleNewsCreated}
        />
      )}
    </Box>
  );
};

export default MainLayout;
