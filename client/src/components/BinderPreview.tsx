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
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Binder } from "../generated/graphql";

interface BinderPreviewProps {
  binder: Binder;
  onClick: (binderId: string) => void;
}

const BinderPreview: React.FC<BinderPreviewProps> = ({ binder, onClick }) => {
  const { t } = useTranslation();

  const thumbnails =
    binder.thumbnails && binder.thumbnails.length > 0
      ? binder.thumbnails
      : null;
  const images =
    binder.images && binder.images.length > 0 ? binder.images : null;
  const displayImage = thumbnails ? thumbnails[0] : images ? images[0] : null;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
        borderRadius: 2,
        overflow: "hidden",
        border: 3,
        borderColor: "primary.main",
        position: "relative",
        // Distinctive styling for binder
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <CardActionArea
        onClick={() => onClick(binder.id)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
        }}
      >
        {/* Binder Icon Badge - Top Left */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "50%",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: 2,
          }}
        >
          <FolderIcon
            sx={{
              color: "primary.main",
              fontSize: 32,
            }}
          />
        </Box>

        {/* Binder Cover / Image Area */}
        <Box
          sx={{
            width: "100%",
            paddingTop: "140%", // 5:7 aspect ratio
            position: "relative",
            backgroundColor: displayImage
              ? "transparent"
              : "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          {displayImage ? (
            <Box
              component="img"
              src={displayImage}
              alt={binder.name}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.9,
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
                p: 2,
              }}
            >
              <FolderOpenIcon
                sx={{
                  fontSize: 80,
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              />
            </Box>
          )}

          {/* Binded Count Badge - Bottom Right */}
          {binder.bindedCount > 0 && (
            <Chip
              icon={<FolderIcon sx={{ color: "white !important" }} />}
              label={binder.bindedCount}
              size="small"
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                backgroundColor: "rgba(255, 152, 0, 0.95)",
                color: "white",
                fontSize: "0.75rem",
                height: 24,
                fontWeight: "bold",
                "& .MuiChip-label": {
                  px: 1,
                },
                "& .MuiChip-icon": {
                  fontSize: 16,
                },
              }}
            />
          )}

          {/* Items Count Badge - Bottom Left */}
          {binder.binds && binder.binds.length > 0 && (
            <Chip
              label={t("binder.itemCount", "{{count}} items", {
                count: binder.binds.length,
              })}
              size="small"
              variant="filled"
              sx={{
                position: "absolute",
                bottom: 8,
                left: 8,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "white",
                fontSize: "0.65rem",
                height: 20,
                fontWeight: "medium",
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />
          )}
        </Box>

        {/* Binder Info */}
        <CardContent
          sx={{
            p: 2,
            pb: 2,
            "&:last-child": {
              pb: 2,
            },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {/* Binder Type Badge */}
          <Chip
            icon={<FolderIcon />}
            label={t("binder.rootBinder", "Root Binder")}
            size="small"
            color="primary"
            sx={{
              mb: 1,
              fontSize: "0.65rem",
              height: 20,
              fontWeight: "bold",
            }}
          />

          {/* Title */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              fontSize: "0.9rem",
              lineHeight: 1.3,
              mb: 0.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2.6em",
              color: "text.primary",
            }}
          >
            {binder.name}
          </Typography>

          {/* Description */}
          {binder.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "0.7rem",
                lineHeight: 1.2,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                mb: 1,
              }}
            >
              {binder.description}
            </Typography>
          )}

          {/* Stats */}
          <Box
            sx={{
              mt: "auto",
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={t("binder.updated", "Updated")}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.6rem",
                height: 18,
                "& .MuiChip-label": {
                  px: 0.75,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.6rem", alignSelf: "center" }}
            >
              {new Date(binder.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BinderPreview;
