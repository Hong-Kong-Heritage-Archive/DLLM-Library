import React from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { useNewsPostQuery, NewsPostQueryVariables } from "../generated/graphql";
import SafeImage from "./SafeImage";

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
interface NewsDetailProps {
  newsId: string | null;
  open: boolean;
  onClose: () => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId, open, onClose }) => {
  const { data, loading, error } = useNewsPostQuery({
    variables: { newsPostId: newsId! } as NewsPostQueryVariables,
    skip: !newsId,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: "80vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography>News Details</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading news details: {error.message}
          </Alert>
        )}

        {data?.newsPost && (
          <Box>
            <Typography variant="h4" gutterBottom>
              {data.newsPost.title}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                By {data.newsPost.user?.nickname || "Unknown"} • Created:{" "}
                {new Date(data.newsPost.createdAt).toLocaleDateString()} •
                Updated:{" "}
                {new Date(data.newsPost.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
              {data.newsPost.content}
            </Typography>

            {data.newsPost.images && data.newsPost.images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Images
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {data.newsPost.images.map((image, index) => (
                    <SafeImage
                      key={index}
                      src={image}
                      alt={`News image ${index + 1}`}
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {data.newsPost.relatedItems &&
              data.newsPost.relatedItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Related Items
                  </Typography>
                  {data.newsPost.relatedItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 2,
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {item.status} • Categories:{" "}
                        {item.category.join(", ")}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

            {data.newsPost.tags && data.newsPost.tags.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {data.newsPost.tags.map((tag, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        px: 2,
                        py: 1,
                        borderRadius: 2,
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
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewsDetail;
