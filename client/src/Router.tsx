import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./routes/Home";
import NewsPage from "./routes/News";
import NewsDetailPage from "./routes/News.$id";
import AllNewsPage from "./routes/News.all";
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
      ],
    },
  ]);
