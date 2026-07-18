import React from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  styled,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../styles/semanticTokens";

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
  ...semanticTokens.dynamicCardPalette,
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
  fontSize: "12px",
  fontWeight: "bold",
  fontFamily: "var(--font-family-body)",
  display: "inline-block",
});

const cardRootSx = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: semanticTokens.shadow.cardHover,
  },
  borderRadius: "16px",
  overflow: "hidden",
  border: "none",
  backgroundColor: "var(--color-bg-surface)",
  boxShadow: semanticTokens.shadow.cardSoft,
};

const cardActionAreaSx = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
};

const topRowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
};

const titleStackSx = {
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  width: "100%",
  paddingTop: "120%",
};

const cardContentSx = {
  p: 1.5,
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  backgroundColor: "var(--color-bg-surface)",
};

const categoryTagSx = {
  backgroundColor: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  borderRadius: "4px",
  px: "6px",
  py: "2px",
  fontSize: "12px",
  fontFamily: "var(--font-family-body)",
};

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

  const heroSx = {
    width: "100%",
    height: "140%",
    position: "relative",
    backgroundColor: cardColor,
    backgroundImage: hasImage
      ? `linear-gradient(${alpha(semanticTokens.color.textPrimary, 0.15)}, ${alpha(semanticTokens.color.textPrimary, 0.45)}), url(${item.images![0]})`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    p: 1.5,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const yearSx = {
    color: alpha(semanticTokens.color.textInverse, 0.65),
    fontSize: "13px",
    fontFamily: "var(--font-family-mono)",
    textShadow: `0 1px 3px ${alpha(semanticTokens.color.textPrimary, 0.5)}`,
    visibility: hasImage ? "hidden" : "visible",
  };

  const statusBadgeSx = {
    backgroundColor: hasImage
      ? alpha(semanticTokens.color.bgElevated, 0.5)
      : alpha(semanticTokens.color.bgElevated, 0.15),
    color: "var(--color-text-inverse)",
    border: hasImage
      ? `1px solid ${alpha(semanticTokens.color.textInverse, 0.2)}`
      : `1px solid ${alpha(semanticTokens.color.textInverse, 0.4)}`,
    backdropFilter: "blur(2px)",
  };

  const overlayTitleSx = {
    fontWeight: "900",
    fontSize: "12px",
    lineHeight: "1.3",
    color: "var(--color-text-inverse)",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    fontFamily: "var(--font-family-display)",
    letterSpacing: "-0.2px",
    textShadow: `0 1px 4px ${alpha(semanticTokens.color.textPrimary, 0.8)}`,
  };

  const conditionBadgeSx = {
    backgroundColor: alpha(semanticTokens.color.textPrimary, 0.45),
    color: alpha(semanticTokens.color.textInverse, 0.9),
    fontSize: "12px",
  };

  return (
    <Card
      sx={cardRootSx}
    >
      <CardActionArea
        onClick={() => onClick(item.id)}
        sx={cardActionAreaSx}
      >
        {/* UPPER HALF (Dark dyn color background or thumbnail imagery) */}
        <Box sx={heroSx}>
          {/* Top Row: Year (Left - visible only if no image), Status Badge (Right) */}
          <Box sx={topRowSx}>
            <Typography sx={yearSx}>
              {item.publishedYear || new Date(item.createdAt).getFullYear()}
            </Typography>
            <CustomBadge sx={statusBadgeSx}>
              {getStatusLabel(item.status)}
            </CustomBadge>
          </Box>

          {/* Bottom Row: Title (Hidden if image is present to prevent duplication) & Condition Overlay */}
          <Box sx={titleStackSx}>
            {!hasImage && (
              <Typography variant="h6" sx={overlayTitleSx}>
                {item.name}
              </Typography>
            )}
            <Box>
              <CustomBadge sx={conditionBadgeSx}>
                {getConditionLabel(item.condition)}
              </CustomBadge>
            </Box>
          </Box>
        </Box>

        {/* BOTTOM HALF (White background with detailed information and tags) */}
        <CardContent sx={cardContentSx}>
          {/* Book Title & year summary */}
          <Box sx={{ mb: 1 }}>
            {hasImage && (
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  lineHeight: "1.3",
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "var(--font-family-display)",
                  display: "inline-block",
                }}
              >
                {item.name}
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: "12px",
                color: "var(--color-text-tertiary)",
                mt: 0.5,
                fontFamily: "var(--font-family-mono)",
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
                sx={categoryTagSx}
              >
                {item.category[0].includes(" ")
                  ? item.category[0].split(" ")[0] + "..."
                  : item.category[0]}
              </Box>
              {item.category.length > 1 && (
                <Box
                  sx={categoryTagSx}
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
