import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./routes/Home";
import NewsPage from "./routes/News";
import NewsDetailPage from "./routes/News.$id";
import AllNewsPage from "./routes/News.all";
import ItemDetailPage from "./routes/Item.$id";
import ItemRecentPage from "./routes/Item.recent";
import ItemAllPage from "./routes/Item.all";
import UserDetailPage from "./routes/User.$id";
import { User } from "./generated/graphql";

/*
 user={meOutput?.data?.me}
 */

export const createRouter = (email?: string | undefined | null, user?: User) =>
  createBrowserRouter([
    {
      path: "/",
      element: <Layout email={email} user={user} />,
      children: [
        {
          index: true,
          element: <HomePage />,
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
      ],
    },
  ]);
