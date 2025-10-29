import React from "react";
import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Article as NewsIcon,
  ExitToApp as LogoutIcon,
  Bookmark as BookmarkIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { User, Role } from "./generated/graphql";
import Home from "./routes/Home";
import NewsPage from "./routes/News";
import NewsDetailPage from "./routes/News.$id";
import AllNewsPage from "./routes/News.all";
import ItemDetailPage from "./routes/Item.$id";
import ItemRecentPage from "./routes/Item.recent";
import ItemAllPage from "./routes/Item.all";
import UserDetailPage from "./routes/User.$id";
import TransactionsPage from "./routes/Transactions";
import TransactionDetailPage from "./components/TransactionDetail";
import LanguageSwitcher from "./components/LanguageSwitcher";

import ItemForm from "./components/ItemForm";
import NewsForm from "./components/NewsForm";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import OnLoanItemsView from "./routes/OnLoanItemsView";

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

interface LayoutProps {
  email?: string | null;
  emailVerified?: boolean | null;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ email, emailVerified, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showItemForm, setShowItemForm] = React.useState(false);
  const [showNewsForm, setShowNewsForm] = React.useState(false);

  // Query for user's open transactions to show notification count
  const { data: transactionsData } = useQuery(
    GET_USER_OPEN_TRANSACTIONS_FOR_COUNT,
    {
      variables: { userId: user?.id! },
      skip: !user?.id,
      pollInterval: 30000, // Poll every 30 seconds for new transactions
    }
  );

  const notificationCount =
    transactionsData?.openTransactionsByUser?.length || 0;

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

  const handleItemCreated = () => {
    setShowItemForm(false);
    // Refresh the home page if needed
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  const handleNewsCreated = () => {
    setShowNewsForm(false);
    // Refresh the home page if needed
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
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

          {/* Menu Button - only show for authenticated users */}

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
                    {t("user.profile", "User Profile")}
                  </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleOnLoanItems}>
                  <ListItemIcon>
                    <BookmarkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {t("item.onLoanItems", "Items On Loan")}
                  </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleAddItem}>
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("item.add", "Add Item")}</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleAddNews}>
                  <ListItemIcon>
                    <NewsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("news.add", "Add News")}</ListItemText>
                </MenuItem>

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

      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <Outlet context={{ email, emailVerified, user }} />
      </Container>

      {/* Item Form Dialog */}
      {showItemForm && (
        <ItemForm
          open={showItemForm}
          onClose={() => setShowItemForm(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      {/* News Form Dialog */}
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

export const createRouter = (
  email?: string | null,
  emailVerified?: boolean | null,
  user?: User,
  initialPath?: string | null
) =>
  createBrowserRouter([
    {
      path: "/",
      element: (
        <Layout email={email} emailVerified={emailVerified} user={user} />
      ),
      children: [
        {
          index: true,
          element: initialPath ? <Navigate to={initialPath} replace /> : <Home />,
        },
        {
          path: "news",
          children: [
            {
              index: true,
              element: <NewsPage />,
            },
            {
              path: "all",
              element: <AllNewsPage />,
            },
            {
              path: ":id",
              element: <NewsDetailPage />,
            },
          ],
        },
        {
          path: "item",
          children: [
            {
              path: "all",
              element: <ItemAllPage />,
            },
            {
              path: "recent",
              element: <ItemRecentPage />,
            },
            {
              path: ":id",
              element: <ItemDetailPage />,
            },
          ],
        },
        {
          path: "user",
          children: [
            {
              path: ":id",
              element: <UserDetailPage />,
            },
          ],
        },
        {
          path: "transactions",
          element: <TransactionsPage />,
        },
        {
          path: "transaction/:transactionId",
          element: <TransactionDetailPage />,
        },
        {
          path: "items/on-loan",
          element: <OnLoanItemsView />,
        },
      ],
    },
  ]);
