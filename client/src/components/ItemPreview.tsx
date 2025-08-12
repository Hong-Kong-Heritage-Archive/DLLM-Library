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

  // Calculate image height based on portrait mode - more image-centric
  const imageHeight = isPortrait
    ? hasImage
      ? "80%" // 80% for image when available (vertical)
      : "60%" // 60% for name display area when no image (horizontal assumption)
    : hasImage
    ? "75%" // 75% for image when available
    : "60%"; // 60% for name display area when no image

  const contentHeight = isPortrait
    ? hasImage
      ? "20%" // Only 20% for info when image exists (vertical)
      : "40%" // 40% for description when no image
    : hasImage
    ? "25%" // 25% for info when image exists
    : "40%"; // 40% for description when no image

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

        {/* Placeholder for no image - Display name in image area */}
        {showImage && !item.images?.length && (
          <Box
            sx={{
              height: imageHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "grey.100",
              color: "text.primary",
              flexShrink: 0,
              position: "relative",
              p: 2,
            }}
          >
            {/* Display item name prominently in the image area */}
            <Typography
              variant={isPortrait ? "h6" : "h5"}
              sx={{
                fontWeight: "bold",
                textAlign: "center",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.2,
              }}
            >
              {item.name}
            </Typography>

            {/* Status Badge */}
            <Chip
              label={item.status}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor:
                  item.status === "AVAILABLE" ? "success.main" : "warning.main",
                color: "white",
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Box>
        )}

        {/* Content */}
        <CardContent
          sx={{
            height: contentHeight,
            p: hasImage ? (isPortrait ? 0.5 : 1) : isPortrait ? 1 : 2, // Less padding when image exists
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {/* For items with images - show minimal info */}
            {hasImage ? (
              <>
                <Typography
                  variant={isPortrait ? "caption" : "subtitle2"}
                  sx={{
                    fontWeight: "bold",
                    fontSize: isPortrait ? "0.75rem" : "0.9rem",
                    lineHeight: 1.1,
                    mb: 0.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 1, // Single line only for items with images
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {truncateText(item.name, isPortrait ? 25 : 35)}
                </Typography>

                {/* Minimal info for items with images */}
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <Chip
                    label={item.condition}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: isPortrait ? "0.5rem" : "0.6rem",
                      height: isPortrait ? 14 : 16,
                    }}
                  />
                  {item.publishedYear && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: isPortrait ? "0.5rem" : "0.6rem" }}
                    >
                      {item.publishedYear}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              /* For items without images - show description as name field */
              <>
                <Typography
                  variant={isPortrait ? "subtitle2" : "subtitle1"}
                  sx={{
                    fontWeight: "medium",
                    fontSize: isPortrait ? "0.85rem" : "1rem",
                    lineHeight: 1.2,
                    mb: 1,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 1, // Single line only
                    WebkitBoxOrient: "vertical",
                    color: "text.secondary",
                  }}
                >
                  {item.description
                    ? truncateText(item.description, isPortrait ? 40 : 60)
                    : t("item.noDescription", "No description available")}
                </Typography>

                {/* Additional info for items without images */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    mb: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
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

                {/* Categories for items without images */}
                {item.category && item.category.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      flexWrap: "wrap",
                      mb: 1,
                    }}
                  >
                    {item.category
                      .slice(0, isPortrait ? 2 : 3)
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
                        label={`+${
                          item.category.length - (isPortrait ? 2 : 3)
                        }`}
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
              </>
            )}
          </Box>

          {/* View More Link - smaller for image-centric design */}
          {hasImage && (
            <Typography
              variant="caption"
              color="primary"
              sx={{
                fontWeight: "medium",
                fontSize: isPortrait ? "0.6rem" : "0.7rem",
                alignSelf: "flex-start",
              }}
            >
              {t("item.viewDetails", "View Details")} →
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ItemPreview;
