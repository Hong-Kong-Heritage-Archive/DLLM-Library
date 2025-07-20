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
import { ImageNotSupported } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import SafeImage from "./SafeImage";

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
  };
  width: string | number;
  height: string | number;
  showImage?: boolean;
  onClick: (comicId: string) => void;
  isPortrait?: boolean;
}

const ItemPreview: React.FC<ItemPreviewProps> = ({
  item,
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

  const hasImage = showImage && item.images && item.images.length > 0;

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
        onClick={() => onClick(item.id)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {/* Comic Image */}
        {hasImage && (
          <Box
            sx={{ height: imageHeight, position: "relative", flexShrink: 0 }}
          >
            <img
              src={item.images![0]}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Status Badge */}
            <Chip
              label={item.status}
              size="small"
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor:
                  item.status === "AVAILABLE" ? "success.main" : "warning.main",
                color: "white",
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Box>
        )}

        {/* Placeholder for no image */}
        {showImage && !item.images?.length && (
          <Box
            sx={{
              height: imageHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "grey.200",
              color: "grey.500",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <ImageNotSupported fontSize={isPortrait ? "medium" : "large"} />
            {/* Status Badge */}
            <Chip
              label={item.status}
              size="small"
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor:
                  item.status === "AVAILABLE" ? "success.main" : "warning.main",
                color: "white",
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Box>
        )}

        {/* Comic Content */}
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
                WebkitLineClamp: isPortrait ? 2 : 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {truncateText(item.name, isPortrait ? 40 : 50)}
            </Typography>

            {/* Condition and Published Year */}
            <Box
              sx={{ display: "flex", gap: 0.5, mb: 1, alignItems: "center" }}
            >
              <Chip
                label={item.condition}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: isPortrait ? "0.6rem" : "0.7rem",
                  height: isPortrait ? 16 : 20,
                }}
              />
              {item.publishedYear && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: isPortrait ? "0.6rem" : "0.7rem" }}
                >
                  {item.publishedYear}
                </Typography>
              )}
            </Box>

            {/* Date for non-image mode */}
            {!showImage && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                {t("comics.addedOn", "Added")}: {formatDate(item.createdAt)}
              </Typography>
            )}

            {/* Categories */}
            {item.category && item.category.length > 1 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                {item.category
                  .slice(1, isPortrait ? 2 : 3)
                  .map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: isPortrait ? "0.6rem" : "0.7rem",
                        height: isPortrait ? 16 : 20,
                      }}
                    />
                  ))}
                {item.category.length > (isPortrait ? 2 : 3) && (
                  <Chip
                    label={`+${item.category.length - (isPortrait ? 2 : 3)}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: isPortrait ? "0.6rem" : "0.7rem",
                      height: isPortrait ? 16 : 20,
                    }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* View More Link */}
          <Typography
            variant="caption"
            color="primary"
            sx={{
              fontWeight: "medium",
              fontSize: isPortrait ? "0.7rem" : "0.8rem",
              alignSelf: "flex-start",
            }}
          >
            {t("comics.viewDetails", "View Details")} →
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ItemPreview;
