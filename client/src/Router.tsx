import { createBrowserRouter } from "react-router-dom";
import { User, HostConfig } from "./generated/graphql";
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

import OnLoanItemsView from "./routes/OnLoanItemsView";
import BorrowedItemsView from "./routes/BorrowedItemsView";
import MainLayout from "./components/MainLayout";
import ExchangePointsPage from "./routes/ExchangePoints";
import ProfilePage from "./routes/Profile";
import BinderDetail from "./components/BinderDetail";
import GoodReadsImportPage from "./routes/GoodReadsImport";

export const createRouter = (
  email?: string | null,
  emailVerified?: boolean | null,
  user?: User,
  hostConfig?: HostConfig,
  onSignOut?: () => Promise<void>,
) => {
  return createBrowserRouter([
    {
      path: "/",
      element: (
        <MainLayout
          email={email}
          emailVerified={emailVerified}
          user={user}
          hostConfig={hostConfig}
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
        {
          path: "/binder/:binderId",
          element: <BinderDetail currentUser={user} />,
        },
        {
          path: "import/goodreads",
          element: <GoodReadsImportPage />,
        },
      ],
    },
  ]);
};
