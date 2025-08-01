import React from "react";
import { Box, Typography, ListItem } from "@mui/material";

interface ItemSummaryProps {
  item: {
    id: string;
    name: string;
    distance: number;
    status: string;
    images?: string[] | null;
    tags?: string[] | null;
  };
  onClick: (newsId: string) => void;
}

const ItemSummary: React.FC<ItemSummaryProps> = ({ item, onClick }) => {
  return (

    <ListItem
      sx={{
        borderBottom: "1px solid #eee",
        cursor: "pointer",
        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
      }}
      onClick={() => onClick(item.id)}
    >
      <Box sx={{ width: "100%" }}>
        {/* Distance and Title */}
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
            {item.distance.toFixed(2)} km
          </Typography>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {item.name}
          </Typography>
        </Box>

        {/* Images */}
        {item.images && item.images.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            {item.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Item image ${index + 1}`}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            ))}
          </Box>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
            {item.tags.map((tag, index) => (
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

export default ItemSummary;
