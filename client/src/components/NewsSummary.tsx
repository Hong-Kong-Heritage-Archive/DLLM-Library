import React from "react";
import {
  Box,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

export interface SimpleNews {
  id: string;
  title: string;
  createdAt: string;
  images?: string[] | null;
  tags?: string[] | null;
}
interface NewsSummaryProps {
  news: SimpleNews;
  onClick: (newsId: string) => void;
}

const NewsSummary: React.FC<NewsSummaryProps> = ({ news, onClick }) => {
  return (

    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onClick(news.id)}
        sx={{
          borderLeft: 2,
          borderColor: "transparent",
          pl: 2,
          cursor: "pointer",
          "&:hover": {
            bgcolor: "#db036b0f",
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "var(--color-brand-primary)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 1,
            }}
          />
        </ListItemIcon>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flexShrink: 0,
            minWidth: "fit-content",
            mr: 1,
          }}
        >
          {new Date(news.createdAt).toLocaleDateString()}
        </Typography>

        <ListItemText
          primary={news.title}
          primaryTypographyProps={{
            fontSize: "14px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            flexGrow: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0, // Important for flex items to shrink properly
          }}
        />
        {/* Images */}
        {news.images && news.images.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            {news.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`News image ${index + 1}`}
                style={{
                  maxWidth: "100px",
                  maxHeight: "50px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            ))}
          </Box>
        )}

        {/* Tags */}
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
                  borderRadius: 1,
                }}
              >
                {tag}
              </Typography>
            ))}
          </Box>
        )}
      </ListItemButton>
    </ListItem >
  );
};

export default NewsSummary;
