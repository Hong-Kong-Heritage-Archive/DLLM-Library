import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Binder, BindType, Role, User } from "../generated/graphql";
import SafeImage from "./SafeImage";
import BinderForm from "./BinderForm";
import ReactMarkdown from "react-markdown";
import { hasMarkdownSyntax } from "../utils/helpers";
import BindItemDialog from "./BindItemDialog"; // Changed from BindBinderDialog
import { AuthDialog } from "./Auth";

const BINDER_DETAIL_QUERY = gql`
  query BinderDetail($binderId: ID!) {
    binder(id: $binderId) {
      id
      name
      description
      images
      thumbnails
      binds {
        type
        id
        name
      }
      bindedCount
      updatedAt
      owner {
        id
        nickname
        email
      }
    }
  }
`;

interface BinderDetailProps {
  currentUser?: User | null;
}

const BinderDetail: React.FC<BinderDetailProps> = ({ currentUser }) => {
  const { binderId } = useParams<{ binderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultSignUp, setAuthDefaultSignUp] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data, loading, error, refetch } = useQuery<{ binder: Binder }>(
    BINDER_DETAIL_QUERY,
    {
      variables: { binderId: binderId! },
      skip: !binderId,
    },
  );

  const handleBack = () => {
    navigate(-1);
  };

  const handleBindClick = (bind: {
    type: BindType;
    id: string;
    name: string;
  }) => {
    if (bind.type === BindType.Item) {
      navigate(`/item/${bind.id}`);
    } else if (bind.type === BindType.Binder) {
      navigate(`/binder/${bind.id}`);
    }
  };

  const handleOwnerClick = () => {
    if (data?.binder?.owner) {
      navigate(`/user/${data.binder.owner.id}`);
    }
  };

  const handleEditSuccess = () => {
    refetch();
    setSuccessSnackbarOpen(true);
  };

  const handleBindToBinderClick = () => {
    if (!currentUser) {
      setAuthDefaultSignUp(false);
      setAuthDialogOpen(true);
      return;
    }

    if (!currentUser.isVerified) {
      setErrorMessage(
        t(
          "binder.verificationRequired",
          "Please verify your email to use binders",
        ),
      );
      setErrorSnackbarOpen(true);
      return;
    }

    setBindDialogOpen(true);
  };

  const handleBindSuccess = () => {
    setSuccessSnackbarOpen(true);
    setBindDialogOpen(false);
    refetch();
  };

  const handleBindError = (message: string) => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    setTimeout(() => {
      setBindDialogOpen(true);
    }, 500);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthDefaultSignUp(!authDefaultSignUp);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbarOpen(false);
    setErrorMessage("");
  };

  const isOwner = currentUser && data?.binder?.owner?.id === currentUser.id;

  if (!binderId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t("binder.noBinderId", "No binder ID provided")}
        </Alert>
      </Container>
    );
  }

  // Check if description should be rendered as Markdown
  const shouldRenderMarkdown =
    data?.binder?.description && hasMarkdownSyntax(data.binder.description);

  const images =
    data?.binder?.images && data.binder.images.length > 0
      ? data.binder.images
      : null;
  const currentImage = images ? images[selectedImageIndex] : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {loading ? t("binder.loading", "Loading Binder...") : ""}
        </Typography>
        {isOwner && data?.binder && (
          <IconButton
            color="primary"
            onClick={() => setEditDialogOpen(true)}
            size="large"
          >
            <EditIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("binder.errorLoading", "Error loading binder")}: {error.message}
        </Alert>
      )}

      {/* Binder Content */}
      {data?.binder && (
        <>
          {/* Book Cover Style Info Card */}
          <Paper
            elevation={4}
            sx={{
              mb: 3,
              overflow: "hidden",
              position: "relative",
              borderRadius: 2,
            }}
          >
            {/* Book Cover Image Section */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                minHeight: 400,
                maxHeight: 600,
                background: images
                  ? "transparent"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* Background Image */}
              {currentImage && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)",
                    },
                  }}
                >
                  <img
                    src={currentImage}
                    alt={data.binder.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}

              {/* Overlay Content - Binder Name */}
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  px: 4,
                  py: 6,
                  maxWidth: "800px",
                }}
              >
                {/* Binder Name */}
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    textShadow: "2px 4px 8px rgba(0,0,0,0.5)",
                    mb: 2,
                    wordBreak: "break-word",
                  }}
                >
                  {data.binder.name}
                </Typography>

                {/* Stats Chips */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    icon={<FileIcon />}
                    label={t("binder.totalBinds", "{{count}} item(s)", {
                      count: data.binder.binds.length,
                    })}
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      backdropFilter: "blur(10px)",
                    }}
                  />
                  {data.binder.bindedCount > 0 && (
                    <Chip
                      icon={<FolderIcon />}
                      label={t(
                        "binder.bindedInOthers",
                        "Binded in {{count}} binder(s)",
                        {
                          count: data.binder.bindedCount,
                        },
                      )}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Image Navigation Dots */}
              {images && images.length > 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 1,
                    zIndex: 2,
                  }}
                >
                  {images.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      sx={{
                        width: selectedImageIndex === index ? 32 : 12,
                        height: 12,
                        borderRadius: 6,
                        bgcolor:
                          selectedImageIndex === index
                            ? "white"
                            : "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: "white",
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Image Thumbnails Strip */}
            {images && images.length > 1 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  p: 2,
                  bgcolor: "background.default",
                  overflowX: "auto",
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                {images.map((image, index) => (
                  <Box
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      minWidth: 80,
                      height: 80,
                      borderRadius: 1,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: 3,
                      borderColor:
                        selectedImageIndex === index
                          ? "primary.main"
                          : "transparent",
                      opacity: selectedImageIndex === index ? 1 : 0.6,
                      transition: "all 0.2s",
                      "&:hover": {
                        opacity: 1,
                        borderColor: "primary.light",
                      },
                    }}
                  >
                    <img
                      src={data.binder.thumbnails?.[index] || image}
                      alt={`${data.binder.name} ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Binder Details Section */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Owner Info */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("binder.owner", "Owner")}
                  </Typography>
                  <Chip
                    label={
                      data.binder.owner.nickname || data.binder.owner.email
                    }
                    onClick={handleOwnerClick}
                    sx={{ cursor: "pointer" }}
                  />
                </Grid>

                {/* Last Updated */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("binder.lastUpdated", "Last updated")}
                  </Typography>
                  <Typography variant="body2">
                    {new Date(data.binder.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>

                {/* Description with Markdown Support */}
                {data.binder.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {t("binder.description", "Description")}
                    </Typography>
                    {shouldRenderMarkdown ? (
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, bgcolor: "background.default", mt: 1 }}
                      >
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => (
                              <Typography
                                variant="h4"
                                gutterBottom
                                {...props}
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <Typography
                                variant="h5"
                                gutterBottom
                                {...props}
                              />
                            ),
                            h3: ({ node, ...props }) => (
                              <Typography
                                variant="h6"
                                gutterBottom
                                {...props}
                              />
                            ),
                            h4: ({ node, ...props }) => (
                              <Typography
                                variant="subtitle1"
                                gutterBottom
                                {...props}
                              />
                            ),
                            p: ({ node, ...props }) => (
                              <Typography
                                variant="body1"
                                paragraph
                                {...props}
                              />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                style={{ color: "#1976d2" }}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            ul: ({ node, ...props }) => (
                              <Box
                                component="ul"
                                sx={{ pl: 2, my: 1 }}
                                {...props}
                              />
                            ),
                            ol: ({ node, ...props }) => (
                              <Box
                                component="ol"
                                sx={{ pl: 2, my: 1 }}
                                {...props}
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <Typography
                                component="li"
                                variant="body1"
                                {...props}
                              />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <Box
                                component="blockquote"
                                sx={{
                                  borderLeft: 4,
                                  borderColor: "primary.main",
                                  pl: 2,
                                  py: 1,
                                  my: 2,
                                  bgcolor: "action.hover",
                                }}
                                {...props}
                              />
                            ),
                            code: ({ node, inline, ...props }: any) =>
                              inline ? (
                                <Box
                                  component="code"
                                  sx={{
                                    bgcolor: "action.hover",
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                    fontFamily: "monospace",
                                  }}
                                  {...props}
                                />
                              ) : (
                                <Box
                                  component="pre"
                                  sx={{
                                    bgcolor: "action.hover",
                                    p: 2,
                                    borderRadius: 1,
                                    overflow: "auto",
                                    my: 1,
                                  }}
                                >
                                  <code {...props} />
                                </Box>
                              ),
                            hr: ({ node, ...props }) => (
                              <Divider sx={{ my: 2 }} {...props} />
                            ),
                          }}
                        >
                          {data.binder.description}
                        </ReactMarkdown>
                      </Paper>
                    ) : (
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {data.binder.description}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>

              {/* Action Buttons */}
              {/* Only show actions if user is verified and is an admin */}
              {currentUser &&
                currentUser.isVerified &&
                currentUser.role === Role.Admin && (
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Bind to Binder Button */}
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={handleBindToBinderClick}
                      startIcon={<FolderIcon />}
                    >
                      {t("binder.bindToBinder", "Bind to Another Binder")}
                    </Button>
                  </Box>
                )}
            </Box>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Binds Section */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <FolderOpenIcon />
              {t("binder.contents", "Binder Contents")}
            </Typography>

            {data.binder.binds.length === 0 ? (
              <Alert severity="info">
                {t("binder.empty", "This binder is empty")}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {data.binder.binds.map((bind, index) => (
                  <Grid
                    key={`${bind.type}-${bind.id}`}
                    size={{ xs: 12, sm: 6, md: 4 }}
                  >
                    <Card
                      sx={{
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                        border: 1,
                        borderColor:
                          bind.type === BindType.Binder
                            ? "primary.main"
                            : "divider",
                      }}
                    >
                      <CardActionArea onClick={() => handleBindClick(bind)}>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {/* Icon */}
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor:
                                  bind.type === BindType.Binder
                                    ? "primary.light"
                                    : "action.hover",
                              }}
                            >
                              {bind.type === BindType.Binder ? (
                                <FolderIcon
                                  sx={{
                                    fontSize: 32,
                                    color: "primary.main",
                                  }}
                                />
                              ) : (
                                <FileIcon
                                  sx={{
                                    fontSize: 32,
                                    color: "text.secondary",
                                  }}
                                />
                              )}
                            </Box>

                            {/* Info */}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Chip
                                label={
                                  bind.type === BindType.Binder
                                    ? t("binder.typeBinder", "Binder")
                                    : t("binder.typeItem", "Item")
                                }
                                size="small"
                                color={
                                  bind.type === BindType.Binder
                                    ? "primary"
                                    : "default"
                                }
                                sx={{ mb: 0.5 }}
                              />
                              <Typography
                                variant="body1"
                                fontWeight="medium"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {bind.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                #{index + 1}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}

      {/* Binder Edit Dialog */}
      {isOwner && data?.binder && (
        <BinderForm
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          binder={data.binder}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Unified Bind Dialog - Works for both items and binders */}
      {currentUser && currentUser.isVerified && data?.binder && (
        <BindItemDialog
          open={bindDialogOpen}
          onClose={() => setBindDialogOpen(false)}
          source={data.binder}
          sourceType="binder"
          user={currentUser}
          onSuccess={handleBindSuccess}
          onError={handleBindError}
        />
      )}

      {/* Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleCloseAuthDialog}
        onSuccess={handleAuthSuccess}
        onForgotPassword={() => {
          alert(
            t(
              "auth.resetPasswordInfo",
              "Please contact support to reset your password.",
            ),
          );
        }}
        defaultIsSignUp={authDefaultSignUp}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("binder.bindSuccess", "Operation successful!")}
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
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BinderDetail;
