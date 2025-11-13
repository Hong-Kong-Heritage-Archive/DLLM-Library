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
import { useTranslation } from "react-i18next";

interface ItemPreview2Props {
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
  onClick: (itemId: string) => void;
}

const ItemPreview2: React.FC<ItemPreview2Props> = ({ item, onClick }) => {
  const { t } = useTranslation();

  const hasImage = item.images && item.images.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "success.main";
      case "EXCHANGEABLE":
        return "info.main";
      case "GIFT":
        return "secondary.main";
      case "RESERVED":
        return "warning.main";
      case "TRANSFERRED":
        return "grey.500";
      default:
        return "grey.500";
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
        borderRadius: 1,
        overflow: "hidden",
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
        {/* Book Cover / Image Area */}
        <Box
          sx={{
            width: "100%",
            paddingTop: "140%", // 5:7 aspect ratio for book covers
            position: "relative",
            backgroundColor: hasImage ? "transparent" : "grey.100",
            overflow: "hidden",
          }}
        >
          {hasImage ? (
            <Box
              component="img"
              src={item.images![0]}
              alt={item.name}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "text.secondary",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  fontSize: "0.7rem",
                  lineHeight: 1.2,
                }}
              >
                {item.name}
              </Typography>
            </Box>
          )}

          {/* Status Badge - Top Right */}
          <Chip
            label={t(`shortStatus.${item.status}`, item.status)}
            size="small"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              backgroundColor: getStatusColor(item.status),
              color: "white",
              fontSize: "0.55rem",
              height: 16,
              fontWeight: "bold",
              "& .MuiChip-label": {
                px: 0.5,
              },
            }}
          />

          {/* Condition Badge - Bottom Left */}
          <Chip
            label={t(
              `item.condition.${item.condition.toLowerCase()}`,
              item.condition
            )}
            size="small"
            variant="filled"
            sx={{
              position: "absolute",
              bottom: 4,
              left: 4,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              fontSize: "0.55rem",
              height: 16,
              fontWeight: "medium",
              "& .MuiChip-label": {
                px: 0.5,
              },
            }}
          />
        </Box>

        {/* Book Info */}
        <CardContent
          sx={{
            p: 1,
            pb: 1,
            "&:last-child": {
              pb: 1,
            },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Title */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: "medium",
              fontSize: "0.7rem",
              lineHeight: 1.2,
              mb: 0.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2em",
            }}
          >
            {item.name}
          </Typography>

          {/* Published Year */}
          {item.publishedYear && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "0.6rem",
                mb: 0.5,
              }}
            >
              {item.publishedYear}
            </Typography>
          )}

          {/* Categories - Show first category only */}
          {item.category && item.category.length > 0 && (
            <Box sx={{ mt: "auto" }}>
              <Chip
                label={item.category[0]}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.55rem",
                  height: 16,
                  maxWidth: "100%",
                  "& .MuiChip-label": {
                    px: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
              {item.category.length > 1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.55rem", ml: 0.5 }}
                >
                  +{item.category.length - 1}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ItemPreview2;
