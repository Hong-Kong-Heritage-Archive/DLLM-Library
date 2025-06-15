import React, { useState } from "react";
import { Typography, List, ListItem } from "@mui/material";
import { Link } from "react-router";
import {
  useNewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  User,
  Role,
} from "../generated/graphql";
import { CreateNewsPostMutation } from "../generated/graphql";
import NewsForm from "./NewsForm";
import NewsSummary from "./NewsSummary";
import NewsDetail from "./NewsDetail";

interface RecentNewsBannerProps {
  user: User | undefined;
}

const RecentNewsBanner: React.FC<RecentNewsBannerProps> = ({
  user,
}) => {
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useNewsRecentPostsQuery({
    variables: {
      tags: ["Testing"],
      limit: 1,
      offset: 0,
    } as NewsRecentPostsQueryVariables,
  });

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    refetch();
  };

  const handleNewsItemClick = (newsId: string) => {
    setSelectedNewsId(newsId);
  };

  const handleCloseDialog = () => {
    setSelectedNewsId(null);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  return (
    <>
      {data && data.newsRecentPosts.length > 0 && (
        <List>
          <ListItem sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              component={Link}
              to="/news/all"              
              sx={{
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              News
            </Typography>
            {user?.role === Role.Admin && (
              <NewsForm onNewsCreated={handleNewsCreated} />
            )}
          </ListItem>
          <NewsSummary
            news={{
              id: data.newsRecentPosts[0].id,
              title: data.newsRecentPosts[0].title,
              createdAt: data.newsRecentPosts[0].createdAt,
              images: data.newsRecentPosts[0].images,
              tags: data.newsRecentPosts[0].tags,
            }}
            onClick={handleNewsItemClick}
          />
        </List>
      )}

      <NewsDetail
        newsId={selectedNewsId}
        open={!!selectedNewsId}
        onClose={handleCloseDialog}
      />
    </>
  );
};

export default RecentNewsBanner;
