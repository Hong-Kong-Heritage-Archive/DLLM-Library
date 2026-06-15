import React, { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  Grid,
  Button,
  Paper,
  Snackbar,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import {
  Close,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  useNewsPostQuery,
  NewsPostQueryVariables,
  User,
  Role,
  NewsStatus,
} from "../generated/graphql";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import SafeImage from "./SafeImage";
import { useTranslation } from "react-i18next";
import { convertLinksToClickable, hasMarkdownSyntax } from "../utils/helpers";
import { useNavigate, useOutletContext } from "react-router-dom";
import ItemPreview from "./ItemPreview";
import BookSpinePreview from "./BookSpinePreview";
import NewsForm from "./NewsForm";

interface OutletContext {
  user?: User;
}

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
        description
        condition
        status
        images
        publishedYear
        createdAt
        category
        contentRating
      }
      createdAt
      updatedAt
      tags
      user {
        id
        nickname
      }
      coEditors {
        id
        nickname
      }
      newsStatus
      newsType
    }
  }
`;

const PUBLISH_NEWS_MUTATION = gql`
  mutation PublishNews($newsPostId: ID!) {
    lockNewsPost(id: $newsPostId)
  }
`;

interface NewsDetailProps {
  newsId: string | null;
  open: boolean;
  onBack?: () => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId, onBack }) => {
  const { t } = useTranslation();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useOutletContext<{ user?: User }>();

  const { data, loading, error, refetch } = useNewsPostQuery({
    variables: { newsPostId: newsId! } as NewsPostQueryVariables,
    skip: !newsId,
  });

  const [lockNewsPost, { loading: updateLoading }] = useMutation(
    PUBLISH_NEWS_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        refetch();
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    },
  );

  const isOwner = user && data?.newsPost?.user?.id === user.id;
  const isAdmin = user && user.role === Role.Admin;

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
        prev === 0 ? images.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    const images = data?.newsPost?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const relatedItemsMap = new Map(
    (data?.newsPost?.relatedItems || []).map((item) => [item.id, item]),
  );

  const handleItemPreviewClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleEditSuccess = () => {
    setSuccessSnackbarOpen(true);
    // Refetch the item data to show updated information
    refetch();
    // window.location.reload(); // Simple refresh, or you could refetch the query
  };

  const handleEditError = (message: string) => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbarOpen(false);
    setErrorMessage("");
  };

  return (
    <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
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
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
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
          {data.newsPost.coEditors && data.newsPost.coEditors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("news.coEditors")}:{" "}
                {data.newsPost.coEditors
                  .map((editor) => editor.nickname)
                  .join(", ")}
              </Typography>
            </Box>
          )}
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
                  BorderRadius: 1,
                  overflow: "auto",
                  mb: 2,
                  border: 1,
                  BorderColor: "divider",
                },
                "& code": {
                  bgcolor: "grey.100",
                  px: 0.75,
                  py: 0.25,
                  BorderRadius: 0.5,
                  FontSize: "0.875em",
                  FontFamily: "monospace",
                },
                "& pre code": {
                  bgcolor: "transparent",
                  px: 0,
                  py: 0,
                },
                "& blockquote": {
                  borderLeft: 4,
                  BorderColor: " primary.main",
                  pl: 2,
                  ml: 0,
                  my: 2,
                  color: "text.secondary",
                  FontStyle: "italic",
                  bgcolor: "action.hover",
                  py: 1,
                  BorderRadius: 0.5,
                },
                "& a": {
                  color: " primary.main",
                  textDecoration: "none",
                  FontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                },
                "& img": {
                  maxWidth: "100%",
                  height: "auto",
                  BorderRadius: 1,
                  my: 2,
                  display: "block",
                },
                "& table": {
                  borderCollapse: " collapse",
                  width: "100%",
                  mb: 2,
                  overflow: "auto",
                  display: "block",
                },
                "& th, & td": {
                  border: 1,
                  BorderColor: "divider",
                  p: 1.5,
                  TextAlign: " left",
                },
                "& th": {
                  bgcolor: "grey.100",
                  FontWeight: "bold",
                },
                "& Hr": {
                  my: 3,
                  border: "none",
                  borderTop: 1,
                  BorderColor: "divider",
                },
                "& strong": {
                  FontWeight: 700,
                },
                "& em": {
                  FontStyle: "italic",
                },
              }}
            >
              {/* Use remark-directive to handle custom directives in markdown, and render them with ItemPreview component */}
              <ReactMarkdown
                remarkPlugins={[remarkDirective, remarkDirectiveRehype]}
                rehypePlugins={[rehypeRaw]}
                components={
                  {
                    item: ({ id }: { id?: string }) => {
                      if (!id) return null;
                      const matchedItem = relatedItemsMap.get(id);
                      if (!matchedItem) return null;

                      return (
                        <Box sx={{ my: 2 }}>
                          <ItemPreview
                            item={{
                              id: matchedItem.id,
                              name: matchedItem.name,
                              description: matchedItem.description,
                              condition: matchedItem.condition,
                              status: matchedItem.status,
                              images: matchedItem.images,
                              publishedYear: matchedItem.publishedYear,
                              createdAt: matchedItem.createdAt,
                              category: matchedItem.category,
                              contentRating: matchedItem.contentRating,
                            }}
                            onClick={handleItemPreviewClick}
                          />
                        </Box>
                      );
                    },
                    itemwithcomment: ({
                      id,
                      comment,
                    }: {
                      id?: string;
                      comment?: string;
                    }) => {
                      if (!id) return null;
                      const matchedItem = relatedItemsMap.get(id);
                      if (!matchedItem) return null;
                      // replace \n in comment with new line
                      if (comment) {
                        comment = comment.replace(/\\n/g, "\n");
                      }

                      return (
                        <Grid
                          container
                          spacing={{ xs: 1, sm: 2 }}
                          sx={{
                            width: "100%",
                          }}
                        >
                          <Grid
                            key={matchedItem.id}
                            size={{ xs: 2.5, sm: 2, md: 1.5 }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <BookSpinePreview
                              item={{
                                id: matchedItem.id,
                                name: matchedItem.name,
                                description: matchedItem.description,
                                condition: matchedItem.condition,
                                status: matchedItem.status,
                                images: matchedItem.images,
                                publishedYear: matchedItem.publishedYear,
                                createdAt: matchedItem.createdAt,
                                category: matchedItem.category,
                                contentRating: matchedItem.contentRating,
                              }}
                              onClick={handleItemPreviewClick}
                            />
                          </Grid>
                          {comment && (
                            <Grid
                              key={matchedItem.id}
                              size={{
                                // For any screen size, comment located on the right side of the item preview, and take the remaining space
                                xs: 9.5,
                                sm: 10,
                                md: 10.5,
                              }}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                border: "1px solid #0d0d0d",
                                borderRadius: 1,
                                p: 2,
                                my: 2,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  flex: 1,
                                  mt: 0.5,
                                  whiteSpace: "pre-line",
                                  wordBreak: "break-word",
                                }}
                              >
                                {comment}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      );
                    },
                  } as any
                }
              >
                {data?.newsPost?.content}
              </ReactMarkdown>
            </Paper>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
              "{convertLinksToClickable(data.newsPost.content)}
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
                        cursor: " pointer",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.05)",
                        },
                      }}
                      onClick={() => handleImageClick(index)}
                    >
                      "
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
                      BorderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("item.status")}: {item.status} • {t("item.category")}:{" "}
                      {item.category.join(", ")}
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
                      bgcolor: " primary.main",
                      color: "white",
                      px: 2,
                      py: 1,
                      BorderRadius: 2,
                    }}
                  >
                    "{tag}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
      {(isOwner || isAdmin) && data?.newsPost && (
        <>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => setEditDialogOpen(true)}
          >
            {t("news.editItem")}
          </Button>
        </>
      )}
      {(isOwner || isAdmin) &&
        data?.newsPost?.newsStatus !== NewsStatus.Published && (
          <>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() =>
                lockNewsPost({ variables: { newsPostId: data?.newsPost?.id } })
              }
            >
              {t("news.publishItem")}
            </Button>
          </>
        )}
      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("item.requestSuccess")}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseErrorSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {t("item.requestError")}: {errorMessage}
        </Alert>
      </Snackbar>
      {/* Edit Item Dialog */}
      {user && (
        <NewsForm
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          user={user}
          newsPost={data?.newsPost || null}
          relatedItem={null}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      )}
    </Container>
  );
};

export default NewsDetail;
