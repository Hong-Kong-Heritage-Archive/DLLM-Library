import React from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  styled,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface ItemPreviewProps {
  item: {
    id: string;
    name: string;
    description?: string | null;
    condition: string;
    status: string;
    images?: string[] | null;
    publishedYear?: number | null;
    createdAt: string;
    category: string[];
    contentRating?: number | null;
  };
  distance?: number; // Optional distance parameter
  onClick: (itemId: string) => void;
}

// Consistent Dynamic Pastel Color Pool for cards (all with clean dark pastel tones)
const DYNAMIC_COLORS = [
  "#3c3029", // Dark Warm Cocoa / Charcoal
  "#213329", // Deep Forest Slate
  "#202538", // Dark Twilight Navy
  "#3b2b35", // Plum Berry Velvet
  "#2a3b40", // Dark Sage Sea
];

// Simple deterministic hash to select color based on item ID
const getDeterministicColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_COLORS.length;
  return DYNAMIC_COLORS[index];
};

const CustomBadge = styled(Box)({
  borderRadius: "4px",
  padding: "2px 6px",
  fontSize: "11px",
  fontWeight: "bold",
  fontFamily: '"Noto Serif TC", sans-serif',
  display: "inline-block",
});

const ItemPreview: React.FC<ItemPreviewProps> = ({ item, onClick }) => {
  const { t } = useTranslation();
  const cardColor = getDeterministicColor(item.id);

  // Translate short status labels or use defaults
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "可借";
      case "EXCHANGEABLE":
        return "可換";
      case "GIFT":
        return "贈送";
      default:
        return t(`shortStatus.${status}`, status);
    }
  };

  // Condition shorthand translation match
  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case "NEW":
      case "AS_NEW":
        return "全新";
      case "NEAR_NEW":
        return "近全新";
      case "GOOD":
        return "良好";
      case "FAIR":
        return "一般";
      default:
        return t(`item.conditions.${cond}`, cond);
    }
  };

  const hasImage = item.images && item.images.length > 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
        },
        borderRadius: "16px",
        overflow: "hidden",
        border: "none",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <CardActionArea
        onClick={() => onClick(item.id)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
        }}
      >
        {/* UPPER HALF (Dark dyn color background or thumbnail imagery) */}
        <Box
          sx={{
            width: "100%",
            height: "140%", // Increased height to cover around ~70% of standard card height (70% of ~320px)
            position: "relative",
            backgroundColor: cardColor,
            backgroundImage: hasImage
              ? `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.45)), url(${item.images![0]})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Row: Year (Left - visible only if no image), Status Badge (Right) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.65)",
                fontSize: "13px",
                fontFamily: '"Roboto Mono", monospace',
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                visibility: hasImage ? "hidden" : "visible", // Hide year on top layer if thumbnail is present to avoid duplication
              }}
            >
              {item.publishedYear || new Date(item.createdAt).getFullYear()}
            </Typography>
            <CustomBadge
              sx={{
                backgroundColor: hasImage
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: hasImage
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : "1px solid rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(2px)",
              }}
            >
              {getStatusLabel(item.status)}
            </CustomBadge>
          </Box>

          {/* Bottom Row: Title (Hidden if image is present to prevent duplication) & Condition Overlay */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              width: "100%",
              paddingTop: "120%",
            }}
          >
            {!hasImage && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "900",
                  fontSize: "12px",
                  lineHeight: "1.3",
                  color: "#ffffff",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  fontFamily: '"Noto Serif TC", "Playfair Display", serif',
                  letterSpacing: "-0.2px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}
              >
                {item.name}
              </Typography>
            )}
            <Box>
              <CustomBadge
                sx={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "7px",
                }}
              >
                {getConditionLabel(item.condition)}
              </CustomBadge>
            </Box>
          </Box>
        </Box>

        {/* BOTTOM HALF (White background with detailed information and tags) */}
        <CardContent
          sx={{
            p: 1.5,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Book Title & year summary */}
          <Box sx={{ mb: 1 }}>
            {hasImage && (
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "9px",
                  lineHeight: "1.3",
                  color: "#1e1e1e",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: '"Noto Serif TC", "Playfair Display", serif',
                  display: "inline-block",
                }}
              >
                {item.name}
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: "8px",
                color: "#666666",
                mt: 0.5,
                fontFamily: '"Roboto Mono", monospace',
              }}
            >
              {item.publishedYear || new Date(item.createdAt).getFullYear()}
            </Typography>
          </Box>

          {/* Dynamic Badges / Category Tags matching bottom design */}
          {item.category && item.category.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "#f5eedc",
                  color: "#1e1e1e",
                  borderRadius: "4px",
                  px: "6px",
                  py: "2px",
                  fontSize: "8px",
                  fontFamily: '"Noto Serif TC", sans-serif',
                }}
              >
                {item.category[0].includes(" ")
                  ? item.category[0].split(" ")[0] + "..."
                  : item.category[0]}
              </Box>
              {item.category.length > 1 && (
                <Box
                  sx={{
                    backgroundColor: "#f5eedc",
                    color: "#1e1e1e",
                    borderRadius: "4px",
                    px: "6px",
                    py: "2px",
                    fontSize: "6px",
                    fontFamily: '"Noto Serif TC", sans-serif',
                  }}
                >
                  +{item.category.length - 1}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ItemPreview;
