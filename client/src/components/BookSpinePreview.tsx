import React, { useState } from "react";
import {
  Card,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Modal,
  Backdrop,
  Fade,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import {
  getContentRatingOption,
  DEFAULT_CONTENT_RATING,
} from "../utils/contentRating";

interface BookSpinePreviewProps {
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
    clssfctns?: string[] | null;
    contentRating?: number | null;
  };
  distance?: number; // Optional distance parameter
  onClick: (itemId: string) => void;
}

// Helper function to detect if text contains CJK characters
const containsCJK = (text: string): boolean => {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);
};

// Helper function to generate pastel color from string using hash
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate pastel colors (high lightness, medium saturation)
  const h = hash % 360;
  const s = 45 + (hash % 25); // 45-70% saturation
  const l = 65 + (hash % 20); // 65-85% lightness

  return `hsl(${h}, ${s}%, ${l}%)`;
};

const BookSpinePreview: React.FC<BookSpinePreviewProps> = ({
  item,
  distance,
  onClick,
}) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const hasImage = item.images && item.images.length > 0;
  const isCJK = containsCJK(item.name);

  // Generate background color
  const backgroundColor = hasImage
    ? "transparent"
    : stringToColor(item.category[0] || "default");

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

  const handleSpineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalOpen(true);
  };

  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalOpen(false);
    onClick(item.id);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const getClassificationLabel = () => {
    if (!item.clssfctns || item.clssfctns.length === 0) return null;
    const firstPath = item.clssfctns[0];
    const segments = firstPath.split("/").filter((s) => s.trim());
    return segments[segments.length - 1] || null;
  };

  return (
    <>
      {/* Book Spine */}
      <Card
        sx={{
          width: "100%",
          height: "200px",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          },
          boxShadow: "2px 4px 8px rgba(0,0,0,0.2)",
          borderRadius: 1,
          overflow: "hidden",
        }}
        onClick={handleSpineClick}
      >
        <CardActionArea
          sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
            position: "relative",
            background: hasImage
              ? `url(${item.images![0]}) center/cover`
              : backgroundColor,
            "&::before": hasImage
              ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
                }
              : {},
          }}
        >
          {/* Category at top */}
          {item.category && item.category.length > 0 && (
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                zIndex: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: hasImage ? "white" : "text.primary",
                  fontWeight: "bold",
                  fontSize: "0.65rem",
                  textShadow: hasImage ? "0 1px 2px rgba(0,0,0,0.8)" : "none",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.category[0]}
              </Typography>
            </Box>
          )}

          {/* Title in center */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: hasImage ? "white" : "text.primary",
                fontWeight: "bold",
                fontSize: "0.75rem",
                lineHeight: 1.3,
                textAlign: "center",
                textShadow: hasImage ? "0 1px 3px rgba(0,0,0,0.9)" : "none",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: isCJK ? "hidden" : "visible",
                textOverflow: "ellipsis",
                writingMode: isCJK ? "vertical-rl" : "horizontal-tb",
                transform: isCJK ? "none" : "rotate(90deg)",
                transformOrigin: "center",
                maxWidth: isCJK ? "100%" : "200px",
                maxHeight: isCJK ? "180px" : "180px",
                px: 0.5,
              }}
            >
              {item.name}
            </Typography>
          </Box>

          {/* Classification at bottom */}
          {getClassificationLabel() && (
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                zIndex: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: hasImage ? "white" : "text.secondary",
                  fontSize: "0.6rem",
                  textShadow: hasImage ? "0 1px 2px rgba(0,0,0,0.8)" : "none",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getClassificationLabel()}
              </Typography>
            </Box>
          )}
        </CardActionArea>
      </Card>

      {/* Modal Overlay - Book Cover View */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.85)" },
          },
        }}
      >
        <Fade in={modalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              outline: "none",
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={handleModalClose}
              sx={{
                position: "absolute",
                top: -40,
                right: -40,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Book Cover */}
            <Card
              onClick={handleCoverClick}
              sx={{
                cursor: "pointer",
                maxWidth: 400,
                maxHeight: "85vh",
                animation: "pullOut 0.3s ease-out",
                "@keyframes pullOut": {
                  from: {
                    transform: "scale(0.3) rotateY(-90deg)",
                    opacity: 0,
                  },
                  to: {
                    transform: "scale(1) rotateY(0deg)",
                    opacity: 1,
                  },
                },
                "&:hover": {
                  boxShadow: 8,
                },
              }}
            >
              <Box sx={{ position: "relative" }}>
                {/* Cover Image */}
                <Box
                  sx={{
                    width: "100%",
                    paddingTop: "140%", // 5:7 aspect ratio
                    position: "relative",
                    backgroundColor: hasImage ? "transparent" : backgroundColor,
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
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "text.primary",
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Status Badge */}
                  <Chip
                    label={t(`shortStatus.${item.status}`, item.status)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: getStatusColor(item.status),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />

                  {/* Condition Badge */}
                  <Chip
                    label={t(
                      `item.conditions.${item.condition}`,
                      item.condition,
                    )}
                    size="small"
                    variant="filled"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                    }}
                  />

                  {/* Distance Badge */}
                  {distance !== undefined && (
                    <Chip
                      label={`${distance.toFixed(1)} km`}
                      size="small"
                      variant="filled"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(25, 118, 210, 0.9)",
                        color: "white",
                      }}
                    />
                  )}

                  {/* Content Rating Badge */}
                  {item.contentRating != null &&
                    item.contentRating >= DEFAULT_CONTENT_RATING &&
                    (() => {
                      const opt = getContentRatingOption(item.contentRating!);
                      return opt ? (
                        <Chip
                          label={t(opt.labelKey, opt.labelKey)}
                          size="small"
                          color={opt.color as any}
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                          }}
                        />
                      ) : null;
                    })()}
                </Box>

                {/* Category and Classification Info */}
                <Box sx={{ p: 2, backgroundColor: "background.paper" }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    {item.name}
                  </Typography>

                  {/* Categories */}
                  {item.category && item.category.length > 0 && (
                    <Box
                      sx={{
                        mb: 1,
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      {item.category.map((cat, idx) => (
                        <Chip
                          key={idx}
                          label={cat}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}

                  {/* Classifications */}
                  {item.clssfctns && item.clssfctns.length > 0 && (
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {item.clssfctns.map((cls, idx) => {
                        const segments = cls.split("/").filter((s) => s.trim());
                        const label = segments[segments.length - 1];
                        return (
                          <Chip
                            key={idx}
                            label={label}
                            size="small"
                            variant="filled"
                            color="info"
                          />
                        );
                      })}
                    </Box>
                  )}

                  {item.publishedYear && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {item.publishedYear}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default BookSpinePreview;
