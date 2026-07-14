import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ImageNotSupported } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../styles/semanticTokens";

interface NewsPostProps {
  news: {
    id: string;
    title: string;
    createdAt: string;
    images?: string[] | null;
    tags?: string[] | null;
  };
  width: string | number;
  height: string | number;
  showImage?: boolean;
  onClick: (newsId: string) => void;
  isPortrait?: boolean;
}

const NewsPost: React.FC<NewsPostProps> = ({
  news,
  width,
  height,
  showImage = true,
  onClick,
  isPortrait = false,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const hasImage = showImage && news.images && news.images.length > 0;

  const chipSx = {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: alpha(semanticTokens.color.textPrimary, 0.7),
    color: semanticTokens.color.textInverse,
    fontSize: "0.7rem",
    height: 20,
  };

  const tagChipSx = {
    fontSize: isPortrait ? "0.6rem" : "0.7rem",
    height: isPortrait ? 16 : 20,
  };

  const viewMoreSx = {
    fontWeight: "medium",
    fontSize: isPortrait ? "0.7rem" : "0.8rem",
    alignSelf: "flex-start",
  };

  // Calculate image height based on portrait mode
  const imageHeight = isPortrait
    ? `${Math.min(parseFloat(height.toString()) * 0.4, 80)}px`
    : "40%";
  const contentHeight = isPortrait
    ? `calc(100% - ${imageHeight})`
    : hasImage
      ? "60%"
      : "100%";

  return (
    <Card
      sx={{
        width,
        height,
        flexShrink: 0,
        cursor: "pointer",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardActionArea
        onClick={() => onClick(news.id)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {/* News Image */}
        {hasImage && (
          <Box
            sx={{ height: imageHeight, position: "relative", flexShrink: 0 }}
          >
            <CardMedia
              component="img"
              height="100%"
              image={news.images![0]}
              alt={news.title}
              sx={{ objectFit: "cover" }}
            />
            {/* Date Badge */}
            <Chip label={formatDate(news.createdAt)} size="small" sx={chipSx} />
          </Box>
        )}

        {/* Placeholder for no image */}
        {showImage && !news.images?.length && (
          <Chip label={formatDate(news.createdAt)} size="small" sx={chipSx} />
        )}

        {/* News Content */}
        <CardContent
          sx={{
            height: contentHeight,
            p: isPortrait ? 1 : 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isPortrait ? "subtitle2" : "h6"}
              sx={{
                fontWeight: "bold",
                fontSize: isPortrait ? "0.9rem" : "1.1rem",
                lineHeight: 1.2,
                mb: 0.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: isPortrait ? 3 : 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {truncateText(news.title, isPortrait ? 60 : 50)}
            </Typography>

            {/* Date for non-image mode */}
            {!showImage && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                {formatDate(news.createdAt)}
              </Typography>
            )}

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                {news.tags.slice(0, isPortrait ? 1 : 2).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={tagChipSx}
                  />
                ))}
                {news.tags.length > (isPortrait ? 1 : 2) && (
                  <Chip
                    label={`+${news.tags.length - (isPortrait ? 1 : 2)}`}
                    size="small"
                    variant="outlined"
                    sx={tagChipSx}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* View More Link */}
          <Typography variant="caption" color="primary" sx={viewMoreSx}>
            {t("news.readMore")} →
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default NewsPost;
