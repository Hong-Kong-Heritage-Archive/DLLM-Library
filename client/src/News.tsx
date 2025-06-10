import React, { useState } from "react";
import { gql } from "@apollo/client";
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import {
  User,
  NewsPost,
  useNewsRecentPostsQuery,
  useNewsPostQuery,
  NewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  NewsPostQuery,
  NewsPostQueryVariables,
  Role,
} from "./generated/graphql";
import NewsForm from "./components/NewsForm"; 
import { CreateNewsPostMutation } from "./generated/graphql";

const NEWS_RECENT_QUERY = gql`
  query NewsRecentPosts($limit: Int, $offset: Int) {
    newsRecentPosts(limit: $limit, offset: $offset) {
      id
      title
      images
      createdAt
      tags
    }
  }
`;

const DETAIL_NEWS_QUERY = gql`
  query NewsPost($newsPostId: ID!) {
    newsPost(id: $newsPostId) {
      id
      title
      content
      images
      relatedItems {
        id
        name
        category
        status
      }
      createdAt
      updatedAt
      tags
      user {
        id
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
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  
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

  // Query for detailed news when dialog is open
  const detailNewsOutput = useNewsPostQuery({
    variables: { newsPostId: selectedNewsId! } as NewsPostQueryVariables,
    skip: !selectedNewsId, // Skip this query when no news is selected
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

  const handleNewsItemClick = (newsId: string) => {
    setSelectedNewsId(newsId);
  };

  const handleCloseDialog = () => {
    setSelectedNewsId(null);
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
           <ListItem 
              key={news.id} 
              sx={{ 
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" }
              }}
              onClick={() => handleNewsItemClick(news.id)}
            >              <Box sx={{ width: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  {news.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(news.createdAt).toLocaleDateString()}
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

      {/* News Detail Dialog */}
      <Dialog 
        open={!!selectedNewsId} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5">News Details</Typography>
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {detailNewsOutput.loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {detailNewsOutput.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading news details: {detailNewsOutput.error.message}
            </Alert>
          )}
          
          {detailNewsOutput.data?.newsPost && (
            <Box>
              <Typography variant="h4" gutterBottom>
                {detailNewsOutput.data.newsPost.title}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  By {detailNewsOutput.data.newsPost.user?.nickname || 'Unknown'} • 
                  Created: {new Date(detailNewsOutput.data.newsPost.createdAt).toLocaleDateString()} • 
                  Updated: {new Date(detailNewsOutput.data.newsPost.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
                {detailNewsOutput.data.newsPost.content}
              </Typography>

              {detailNewsOutput.data.newsPost.images && detailNewsOutput.data.newsPost.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Images</Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {detailNewsOutput.data.newsPost.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image} 
                        alt={`News image ${index + 1}`}
                        style={{ 
                          maxWidth: "200px", 
                          maxHeight: "200px", 
                          objectFit: "cover",
                          borderRadius: "8px"
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {detailNewsOutput.data.newsPost.relatedItems && detailNewsOutput.data.newsPost.relatedItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Related Items</Typography>
                  {detailNewsOutput.data.newsPost.relatedItems.map((item) => (
                    <Box key={item.id} sx={{ p: 2, border: "1px solid #ddd", borderRadius: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {item.status} • Categories: {item.category.join(", ")}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {detailNewsOutput.data.newsPost.tags && detailNewsOutput.data.newsPost.tags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Tags</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {detailNewsOutput.data.newsPost.tags.map((tag, index) => (
                      <Typography 
                        key={index}
                        variant="body2" 
                        sx={{ 
                          bgcolor: "primary.main", 
                          color: "white", 
                          px: 2, 
                          py: 1, 
                          borderRadius: 2 
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>      
    </Box>
  );
};

export default News;