import React from "react";
import { gql } from "@apollo/client";
import { Box, Typography, List, ListItem } from "@mui/material";
import {
  NewsPost,
  useNewsRecentPostsQuery,
  NewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
} from "./generated/graphql";
import NewsForm from "./components/NewsForm"; // Adjust path as needed
import { CreateNewsPostMutation } from "./generated/graphql";

const NEWS_RECENT_QUERY = gql`
  query NewsRecentPosts($tags: [String!]) {
    newsRecentPosts(tags: $tags) {
      id
      title
      content
      images
      relatedItems {
        name
      }
      createdAt
      tags
      user {
        isVerified
        nickname
      }
    }
  }
`;

const News: React.FC = () => {
  const recentNewsOutput = useNewsRecentPostsQuery({
    variables: { tags: ["Testing"] } as NewsRecentPostsQueryVariables,
  });

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
    // You could add logic here to refresh a list of news posts, show a success message, etc.
  };

  return (
    <>
      <Box p={4}>
        <NewsForm onNewsCreated={handleNewsCreated} />
        {recentNewsOutput.data && (
          <Box mt={2}>
            <Typography variant="h6">News</Typography>
            <List>
              {recentNewsOutput.data.newsRecentPosts.map((news) => (
                <ListItem key={news.id}>
                  {news.createdAt} {news.title}, {news.content}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
      <Box mt={2}>
        {recentNewsOutput.loading && <Typography>Loading...</Typography>}
        {recentNewsOutput.error && (
          <Typography>Error: {recentNewsOutput.error.message}</Typography>
        )}
      </Box>
    </>
  );
};

export default News;
