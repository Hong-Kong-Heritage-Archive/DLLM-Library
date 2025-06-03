import React, { useState } from "react";
import { gql } from "@apollo/client";
import { Box, Typography, List, ListItem, Button, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import {
  User,
  NewsPost,
  useNewsRecentPostsQuery,
  NewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  Role,
} from "./generated/graphql";
import NewsForm from "./components/NewsForm"; // Adjust path as needed
import { CreateNewsPostMutation } from "./generated/graphql";

const NEWS_RECENT_QUERY = gql`
  query NewsRecentPosts($tags: [String!], $limit: Int, $offset: Int) {
    newsRecentPosts(tags: $tags, limit: $limit, offset: $offset) {
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

interface NewsProps {
  user: User | undefined;
}

const News: React.FC<NewsProps> = ({user}) => {
  const [showAllNews, setShowAllNews] = useState(false);
  
  // Query for single recent news (limit: 1)
  const singleNewsOutput = useNewsRecentPostsQuery({
    variables: { tags: ["Testing"], limit: 1, offset: 0 } as NewsRecentPostsQueryVariables,
    skip: showAllNews, // Skip this query when showing all news
  });

  // Query for all recent news
  const allNewsOutput = useNewsRecentPostsQuery({
    variables: { tags: ["Testing"], limit: 20, offset: 0 } as NewsRecentPostsQueryVariables,
    skip: !showAllNews, // Skip this query when showing single news
  });

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
    // Refetch the current query
    if (showAllNews) {
      allNewsOutput.refetch();
    } else {
      singleNewsOutput.refetch();
    }
  };

  const handleShowAllNews = () => {
    setShowAllNews(true);
  };

  const handleBackToSingle = () => {
    setShowAllNews(false);
  };

  // Show single news view
  if (!showAllNews) {
    return (
      <>
        {singleNewsOutput.data && singleNewsOutput.data.newsRecentPosts.length > 0 && (
          <List>
            <ListItem sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography 
                variant="h6" 
                sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                onClick={handleShowAllNews}
              >
                News
              </Typography>
              {user?.role === Role.Admin && <NewsForm onNewsCreated={handleNewsCreated} />}
            </ListItem>
            <ListItem key={singleNewsOutput.data.newsRecentPosts[0].id}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {singleNewsOutput.data.newsRecentPosts[0].title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(singleNewsOutput.data.newsRecentPosts[0].createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </ListItem>
          </List>
        )}
        {singleNewsOutput.loading && <Typography>Loading...</Typography>}
        {singleNewsOutput.error && (
          <Typography>Error: {singleNewsOutput.error.message}</Typography>
        )}
      </>
    );
  }

  // Show all news view
  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, p: 2 }}>
        <IconButton onClick={handleBackToSingle} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          All News
        </Typography>
        {user?.role === Role.Admin && <NewsForm onNewsCreated={handleNewsCreated} />}
      </Box>

      {/* All news list */}
      {allNewsOutput.data && (
        <List>
          {allNewsOutput.data.newsRecentPosts.map((news) => (
            <ListItem key={news.id} sx={{ borderBottom: "1px solid #eee" }}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  {news.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  By {news.user.nickname} • {new Date(news.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {news.content}
                </Typography>
                {news.images && news.images.length > 0 && (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                    {news.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image} 
                        alt={`News image ${index + 1}`}
                        style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                      />
                    ))}
                  </Box>
                )}
                {news.tags && news.tags.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {news.tags.map((tag, index) => (
                      <Typography 
                        key={index}
                        variant="caption" 
                        sx={{ 
                          bgcolor: "primary.main", 
                          color: "white", 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1 
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      
      {allNewsOutput.loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <Typography>Loading all news...</Typography>
        </Box>
      )}
      
      {allNewsOutput.error && (
        <Box sx={{ p: 2 }}>
          <Typography color="error">Error: {allNewsOutput.error.message}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default News;