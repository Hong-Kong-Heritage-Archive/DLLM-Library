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
import LoanItems from "./routes/LoanItems";

import ItemForm from "./components/ItemForm";
import NewsForm from "./components/NewsForm";
import { gql } from "@apollo/client";
import OnLoanItemsView from "./routes/OnLoanItemsView";
import BorrowedItemsView from "./routes/BorrowedItemsView";
import MainLayout from "./components/MainLayout";
import ExchangePointsPage from "./routes/ExchangePoints";
import ProfilePage from "./routes/Profile";

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

export const createRouter = (
  email?: string | null,
  emailVerified?: boolean | null,
  user?: User,
  onSignOut?: () => Promise<void>
) => {
  return createBrowserRouter([
    {
      path: "/",
      element: (
        <MainLayout
          email={email}
          emailVerified={emailVerified}
          user={user}
          onSignOut={onSignOut}
        />
      ),
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "home",
          element: <Home />,
        },
        {
          path: "news",
          element: <NewsPage />,
        },
        {
          path: "news/all",
          element: <AllNewsPage />,
        },
        {
          path: "news/:id",
          element: <NewsDetailPage />,
        },
        {
          path: "exchange-points",
          element: <ExchangePointsPage />,
        },
        {
          path: "profile",
          element: <ProfilePage />,
        },
        {
          path: "item/all",
          element: <ItemAllPage />,
        },
        {
          path: "item/recent",
          element: <ItemRecentPage />,
        },
        {
          path: "item/:id",
          element: <ItemDetailPage />,
        },
        {
          path: "user/:id",
          element: <UserDetailPage />,
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
        {
          path: "items/borrowed-items",
          element: <BorrowedItemsView />,
        },
        {
          path: "loan-items",
          element: <LoanItems />,
        },
      ],
    },
  ]);
};
