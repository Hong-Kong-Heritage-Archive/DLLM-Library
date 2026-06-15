import React from "react";
import { Box, Typography, ListItem } from "@mui/material";

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
    <ListItem
      sx={{
        borderBottom: "1px solid #eee",
        cursor: "pointer",
        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
      }}
      onClick={() => onClick(news.id)}
    >
      <Box sx={{ width: "100%" }}>
        {/* Date and Title on the same horizontal level */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flexShrink: 0,
              minWidth: "fit-content",
            }}
          >
            {new Date(news.createdAt).toLocaleDateString()}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0, // Important for flex items to shrink properly
            }}
          >
            {news.title}
          </Typography>

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
        </Box>

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
      </Box>
    </ListItem>
  );
};

export default NewsSummary;
