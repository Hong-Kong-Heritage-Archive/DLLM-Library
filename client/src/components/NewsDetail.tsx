import React, { useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Modal,
  Backdrop,
  Fade,
  Grid,
  Paper,
} from "@mui/material";
import {
  Close,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { useNewsPostQuery, NewsPostQueryVariables } from "../generated/graphql";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import SafeImage from "./SafeImage";
import { useTranslation } from "react-i18next";
import { convertLinksToClickable, hasMarkdownSyntax } from "../utils/helpers";

const DETAIL_NEWS_QUERY = gql`
  query NewsPost($newsPostId: ID!) {
    newsPost(id: $newsPostId) {
      id
      title
      content
      images
      relatedItems {
        id
        name
        category
        status
      }
      createdAt
      updatedAt
      tags
      user {
        id
        nickname
      }
    }
  }
`;

interface NewsDetailProps {
  newsId: string | null;
  open: boolean;
  onClose: () => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId, open, onClose }) => {
  const { t } = useTranslation();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, loading, error } = useNewsPostQuery({
    variables: { newsPostId: newsId! } as NewsPostQueryVariables,
    skip: !newsId,
  });

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  const handlePrevImage = () => {
    const images = data?.newsPost?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    const images = data?.newsPost?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: "80vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>{t("news.newsDetails")}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("news.error")}: {error.message}
            </Alert>
          )}

          {data?.newsPost && (
            <Box>
              <Typography variant="h4" gutterBottom>
                {data.newsPost.title}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("common.by")}{" "}
                  {data.newsPost.user?.nickname || t("common.unknown")} •{" "}
                  {t("common.created")}:{" "}
                  {new Date(data.newsPost.createdAt).toLocaleDateString()} •{" "}
                  {t("common.updated")}:{" "}
                  {new Date(data.newsPost.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              {hasMarkdownSyntax(data.newsPost.content) ? (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: 3,
                    bgcolor: "background.default",
                    "& h1": {
                      fontSize: "2rem",
                      fontWeight: "bold",
                      mt: 3,
                      mb: 2,
                    },
                    "& h2": {
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      mt: 2.5,
                      mb: 1.5,
                    },
                    "& h3": {
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      mt: 2,
                      mb: 1,
                    },
                    "& h4": {
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      mt: 1.5,
                      mb: 1,
                    },
                    "& h5": {
                      fontSize: "1rem",
                      fontWeight: "bold",
                      mt: 1.5,
                      mb: 1,
                    },
                    "& h6": {
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      mt: 1.5,
                      mb: 1,
                    },
                    "& p": { mb: 1.5, lineHeight: 1.7 },
                    "& ul, & ol": { pl: 3, mb: 1.5 },
                    "& li": { mb: 0.5 },
                    "& pre": {
                      bgcolor: "grey.100",
                      p: 2,
                      borderRadius: 1,
                      overflow: "auto",
                      mb: 2,
                      border: 1,
                      borderColor: "divider",
                    },
                    "& code": {
                      bgcolor: "grey.100",
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: "0.875em",
                      fontFamily: "monospace",
                    },
                    "& pre code": {
                      bgcolor: "transparent",
                      px: 0,
                      py: 0,
                    },
                    "& blockquote": {
                      borderLeft: 4,
                      borderColor: "primary.main",
                      pl: 2,
                      ml: 0,
                      my: 2,
                      color: "text.secondary",
                      fontStyle: "italic",
                      bgcolor: "action.hover",
                      py: 1,
                      borderRadius: 0.5,
                    },
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    },
                    "& img": {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 1,
                      my: 2,
                      display: "block",
                    },
                    "& table": {
                      borderCollapse: "collapse",
                      width: "100%",
                      mb: 2,
                      overflow: "auto",
                      display: "block",
                    },
                    "& th, & td": {
                      border: 1,
                      borderColor: "divider",
                      p: 1.5,
                      textAlign: "left",
                    },
                    "& th": {
                      bgcolor: "grey.100",
                      fontWeight: "bold",
                    },
                    "& hr": {
                      my: 3,
                      border: "none",
                      borderTop: 1,
                      borderColor: "divider",
                    },
                    "& strong": {
                      fontWeight: 700,
                    },
                    "& em": {
                      fontStyle: "italic",
                    },
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {data.newsPost.content}
                  </ReactMarkdown>
                </Paper>
              ) : (
                <Typography
                  variant="body1"
                  sx={{ mb: 3, whiteSpace: "pre-wrap" }}
                >
                  {convertLinksToClickable(data.newsPost.content)}
                </Typography>
              )}
              {data.newsPost.images && data.newsPost.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t("common.images")}
                  </Typography>
                  <Grid container spacing={2}>
                    {data.newsPost.images.map((image, index) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "scale(1.05)",
                            },
                          }}
                          onClick={() => handleImageClick(index)}
                        >
                          <SafeImage
                            src={image}
                            alt={`News image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "cover",
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {data.newsPost.relatedItems &&
                data.newsPost.relatedItems.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t("news.relatedItems")}
                    </Typography>
                    {data.newsPost.relatedItems.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 2,
                          border: "1px solid #ddd",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("item.status")}: {item.status} •{" "}
                          {t("item.category")}: {item.category.join(", ")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

              {data.newsPost.tags && data.newsPost.tags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t("common.tags")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {data.newsPost.tags.map((tag, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained">
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Modal - keep existing */}
      <Modal
        open={imageModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={imageModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
              <IconButton onClick={handleCloseModal} color="primary">
                <Close />
              </IconButton>
            </Box>

            {data?.newsPost && (
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {data.newsPost.images && data.newsPost.images.length > 1 && (
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{ position: "absolute", left: -50, zIndex: 1 }}
                    color="primary"
                  >
                    <PrevIcon />
                  </IconButton>
                )}

                <img
                  src={data.newsPost.images?.[selectedImageIndex] || ""}
                  alt={`News - Image ${selectedImageIndex + 1}`}
                  style={{
                    maxWidth: "80vw",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />

                {data.newsPost.images && data.newsPost.images.length > 1 && (
                  <IconButton
                    onClick={handleNextImage}
                    sx={{ position: "absolute", right: -50, zIndex: 1 }}
                    color="primary"
                  >
                    <NextIcon />
                  </IconButton>
                )}
              </Box>
            )}

            {data?.newsPost?.images && data.newsPost.images.length > 1 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedImageIndex + 1} / {data.newsPost.images.length}
              </Typography>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default NewsDetail;
