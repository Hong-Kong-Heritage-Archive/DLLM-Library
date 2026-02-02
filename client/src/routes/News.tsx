import React, { useState, useRef } from "react";
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Chat as ChatIcon,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  Delete,
  ExpandMore as ArrowDropDownIcon,
} from "@mui/icons-material";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User, HostConfig, CreateNewsPostMutation } from "../generated/graphql";
import TransactionFlowDiagrams from "../components/TransactionFlowDiagrams";
import RecentNewsBanner from "../components/RecentNewsBanner";
import { batchProcessImages } from "../utils/ImageProcessor";
import { uploadImages, ImagePreview } from "../utils/imageUpload";

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
  hostConfig?: HostConfig;
}

const GET_HOST_CONFIG = gql`
  query GetHostConfig {
    hostConfig {
      chatLink
      aboutUsText
      splashScreenImageUrl
      splashScreenText
    }
  }
`;

const UPDATE_HOST_CONFIG = gql`
  mutation UpdateHostConfig($input: HostConfigInput!) {
    updateHostConfig(input: $input) {
      chatLink
      aboutUsText
      splashScreenImageUrl
      splashScreenText
    }
  }
`;

const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const { user } = useOutletContext<OutletContext>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [chatLink, setChatLink] = useState("");
  const [aboutUsText, setAboutUsText] = useState("");
  const [splashScreenText, setSplashScreenText] = useState("");
  const [splashScreenImage, setSplashScreenImage] =
    useState<ImagePreview | null>(null);
  const [originalSplashImageUrl, setOriginalSplashImageUrl] = useState<
    string | null
  >(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const maxImageSize = 1920;
  const imageQuality = 0.5;
  const isAdmin = user?.role === "ADMIN";

  // Query host config
  const { data, loading, error, refetch } = useQuery(GET_HOST_CONFIG, {
    onCompleted: (data) => {
      if (data?.hostConfig) {
        setChatLink(data.hostConfig.chatLink || "");
        setAboutUsText(data.hostConfig.aboutUsText || "");
        setSplashScreenText(data.hostConfig.splashScreenText || "");
        const imageUrl = data.hostConfig.splashScreenImageUrl;
        setOriginalSplashImageUrl(imageUrl);
        if (imageUrl) {
          setSplashScreenImage({
            url: imageUrl,
            file: new File([], "existing"),
            originalFile: new File([], "existing"),
            width: 0,
            height: 0,
            size: 0,
            compressionApplied: false,
            finalQuality: 1,
            isExisting: true,
            gsUrl: imageUrl,
          });
        }
      }
    },
  });

  // Update mutation
  const [updateHostConfig, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_HOST_CONFIG, {
      onCompleted: () => {
        setIsEditing(false);
        setHasChanges(false);
        setShowSuccess(true);
        refetch();
      },
    });

  const handleChatLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatLink(e.target.value);
    setHasChanges(true);
  };

  const handleAboutUsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutUsText(e.target.value);
    setHasChanges(true);
  };

  const handleSplashScreenTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSplashScreenText(e.target.value);
    setHasChanges(true);
  };

  const handleImageMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setImageMenuAnchor(event.currentTarget);
  };

  const handleImageMenuClose = () => {
    setImageMenuAnchor(null);
  };

  const handleSelectFromGallery = () => {
    handleImageMenuClose();
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    handleImageMenuClose();
    cameraInputRef.current?.click();
  };

  const processFile = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    setIsProcessingImage(true);
    setProcessingProgress(0);

    try {
      const processedImages = await batchProcessImages(
        [file],
        {
          maxSize: maxImageSize,
          maxFileSizeKB: 500,
          initialQuality: imageQuality,
          minQuality: 0.3,
          preferJPEG: true,
        },
        (processed, total) => {
          setProcessingProgress(Math.round((processed / total) * 100));
        }
      );

      if (processedImages.length > 0) {
        const newImage: ImagePreview = {
          ...processedImages[0],
          uploadProgress: 0,
          isUploading: false,
          isExisting: false,
        };
        setSplashScreenImage(newImage);
        setHasChanges(true);
      }
    } catch (error) {
      console.error("Image processing error:", error);
    } finally {
      setIsProcessingImage(false);
      setProcessingProgress(0);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    await processFile(file || null);
    event.target.value = "";
  };

  const handleCameraCapture = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    await processFile(file || null);
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    if (splashScreenImage && !splashScreenImage.isExisting) {
      URL.revokeObjectURL(splashScreenImage.url);
    }
    setSplashScreenImage(null);
    setHasChanges(true);
  };

  const isCameraAvailable = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const handleSave = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const input: any = {
        chatLink: chatLink.trim(),
        aboutUsText: aboutUsText.trim(),
        splashScreenText: splashScreenText.trim(),
      };

      // Only upload and update image if there's a new image (not existing)
      if (splashScreenImage && !splashScreenImage.isExisting) {
        const uploadedUrls = await uploadImages(
          apolloClient,
          [splashScreenImage],
          {
            folder: "splash-screen",
            onFileProgress: (_, progress) => {
              setSplashScreenImage((prev) =>
                prev
                  ? {
                      ...prev,
                      isUploading: true,
                      uploadProgress: progress.percentage,
                    }
                  : null
              );
            },
            onFileComplete: (_, gsUrl) => {
              setSplashScreenImage((prev) =>
                prev
                  ? {
                      ...prev,
                      isUploading: false,
                      uploadProgress: 100,
                      gsUrl: gsUrl,
                    }
                  : null
              );
            },
            onOverallProgress: (percentage) => {
              setUploadProgress(percentage);
            },
            onError: (_, error) => {
              setSplashScreenImage((prev) =>
                prev
                  ? {
                      ...prev,
                      isUploading: false,
                      uploadError: error,
                    }
                  : null
              );
            },
          }
        );

        if (uploadedUrls.length > 0) {
          input.splashScreenImageUrl = uploadedUrls[0];
        }
      } else if (!splashScreenImage && originalSplashImageUrl) {
        // User removed the image, clear it
        input.splashScreenImageUrl = null;
      }
      // If image exists and is the same, don't include it in the update (merge will preserve it)

      await updateHostConfig({
        variables: {
          input,
        },
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (data?.hostConfig) {
      setChatLink(data.hostConfig.chatLink || "");
      setAboutUsText(data.hostConfig.aboutUsText || "");
      setSplashScreenText(data.hostConfig.splashScreenText || "");
      const imageUrl = data.hostConfig.splashScreenImageUrl;
      if (imageUrl) {
        setSplashScreenImage({
          url: imageUrl,
          file: new File([], "existing"),
          originalFile: new File([], "existing"),
          width: 0,
          height: 0,
          size: 0,
          compressionApplied: false,
          finalQuality: 1,
          isExisting: true,
          gsUrl: imageUrl,
        });
      } else {
        setSplashScreenImage(null);
      }
    }
    // Clean up object URLs for non-existing images
    if (splashScreenImage && !splashScreenImage.isExisting) {
      URL.revokeObjectURL(splashScreenImage.url);
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {t("news.errorLoading", "Error loading configuration")}:{" "}
          {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <RecentNewsBanner user={user} />
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          {t("news.aboutUs", "About Us")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin
            ? t(
                "news.adminDescription",
                "Manage community information and chat links"
              )
            : t(
                "news.userDescription",
                "Learn more about our community library"
              )}
        </Typography>
      </Box>

      {/* Admin Edit Controls */}
      {isAdmin && !isEditing && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "flex-end",
            position: "sticky",
            top: 70,
            zIndex: 10,
            backgroundColor: "background.default",
            py: 2,
            borderRadius: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: 3,
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            {t("common.edit", "Edit")}
          </Button>
        </Box>
      )}

      {/* Update Error */}
      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("news.errorUpdating", "Error updating configuration")}:{" "}
          {updateError.message}
        </Alert>
      )}

      {/* Save Success Indicator */}
      {showSuccess && (
        <Alert
          severity="success"
          sx={{ mt: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          {t("news.changesSaved", "All changes saved successfully")}
        </Alert>
      )}

      {/* Chat Link Section - Visible to all users */}
      {(chatLink || isAdmin) && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: 2,
            border: "2px solid",
            borderColor: "secondary.main",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {t("news.communityChat", "Community Chat")}
            </Typography>

            {isEditing && isAdmin ? (
              <TextField
                fullWidth
                label={t("news.chatLink", "Chat Link")}
                placeholder={t(
                  "news.chatLinkPlaceholder",
                  "e.g., https://t.me/your-group"
                )}
                value={chatLink}
                onChange={handleChatLinkChange}
                helperText={t(
                  "news.chatLinkHelper",
                  "Enter the link to your community chat (Telegram, Discord, etc.)"
                )}
                disabled={updateLoading}
              />
            ) : (
              <Box>
                {chatLink ? (
                  <Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.6,
                      }}
                    >
                      {t(
                        "news.joinOurChat",
                        "Join our community chat to connect with other members, share ideas, and stay updated!"
                      )}
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      href={chatLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="large"
                      startIcon={<ChatIcon />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        fontSize: "1rem",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: 2,
                        "&:hover": {
                          boxShadow: 4,
                        },
                      }}
                    >
                      {t("news.joinChat", "Join Community Chat")}
                    </Button>
                  </Box>
                ) : isAdmin ? (
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "news.noChatLink",
                      "No community chat link configured yet."
                    )}
                  </Typography>
                ) : null}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Splash Screen Section */}
      {(isAdmin || splashScreenText || splashScreenImage) && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {t("news.splashScreen", "Splash Screen")}
            </Typography>

            {isEditing ? (
              <Box>
                {/* Image Upload Section */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleImageMenuClick}
                    startIcon={<PhotoCamera />}
                    endIcon={<ArrowDropDownIcon />}
                    disabled={isProcessingImage || isUploading}
                    sx={{ mb: 2 }}
                  >
                    {splashScreenImage
                      ? t("news.changeImage", "Change Image")
                      : t("news.addImage", "Add Image")}
                  </Button>

                  <Menu
                    anchorEl={imageMenuAnchor}
                    open={Boolean(imageMenuAnchor)}
                    onClose={handleImageMenuClose}
                  >
                    <MenuItem onClick={handleSelectFromGallery}>
                      <ListItemIcon>
                        <PhotoLibrary fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>
                        {t("news.selectFromGallery", "Select from Gallery")}
                      </ListItemText>
                    </MenuItem>
                    {isCameraAvailable() && (
                      <MenuItem onClick={handleTakePhoto}>
                        <ListItemIcon>
                          <CameraAlt fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>
                          {t("news.takePhoto", "Take Photo")}
                        </ListItemText>
                      </MenuItem>
                    )}
                  </Menu>

                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileSelect}
                  />

                  <input
                    ref={cameraInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                  />

                  {isProcessingImage && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={processingProgress}
                      />
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {t("common.processingImages")} {processingProgress}%
                      </Typography>
                    </Box>
                  )}

                  {splashScreenImage && (
                    <Card sx={{ maxWidth: 400, mt: 2 }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={splashScreenImage.url}
                        alt={t("news.splashScreenImage", "Splash Screen")}
                      />
                      <Box sx={{ p: 1, textAlign: "center" }}>
                        {splashScreenImage.isUploading && (
                          <LinearProgress
                            variant="determinate"
                            value={splashScreenImage.uploadProgress || 0}
                            sx={{ mb: 1 }}
                          />
                        )}
                        {splashScreenImage.uploadError && (
                          <Alert
                            severity="error"
                            sx={{ mb: 1, fontSize: "0.75rem" }}
                          >
                            {splashScreenImage.uploadError}
                          </Alert>
                        )}
                        <IconButton
                          size="small"
                          onClick={handleRemoveImage}
                          disabled={splashScreenImage.isUploading}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Card>
                  )}
                </Box>

                {/* Text Field */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t("news.splashScreenText", "Splash Screen Text")}
                  placeholder={t(
                    "news.splashScreenTextPlaceholder",
                    "Enter text to display on splash screen..."
                  )}
                  value={splashScreenText}
                  onChange={handleSplashScreenTextChange}
                  helperText={t(
                    "news.splashScreenTextHelper",
                    "This text will appear when users first open the app"
                  )}
                  disabled={isUploading}
                />

                {isUploading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                    />
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      {t("common.uploading")} {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                {splashScreenImage && (
                  <CardMedia
                    component="img"
                    sx={{ maxWidth: 400, borderRadius: 1, mb: 2 }}
                    image={splashScreenImage.url}
                    alt={t("news.splashScreenImage", "Splash Screen")}
                  />
                )}
                {splashScreenText ? (
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                    }}
                  >
                    {splashScreenText}
                  </Typography>
                ) : isAdmin ? (
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "news.noSplashScreenText",
                      "No splash screen text configured yet."
                    )}
                  </Typography>
                ) : null}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* About Us Section */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            {t("news.aboutUs", "About Us")}
          </Typography>

          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={10}
              label={t("news.aboutUsText", "About Us Text")}
              placeholder={t(
                "news.aboutUsPlaceholder",
                "Tell your community about your library, mission, and values..."
              )}
              value={aboutUsText}
              onChange={handleAboutUsChange}
              helperText={t(
                "news.aboutUsHelper",
                "Describe your community library, its purpose, and how it works"
              )}
              disabled={updateLoading}
            />
          ) : (
            <Box>
              {aboutUsText ? (
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                  }}
                >
                  {aboutUsText}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "news.noAboutUsText",
                    "No information available yet. Please check back later."
                  )}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transaction Flow Diagrams Section - Add after About Us */}
      {!isEditing && (
        <Box sx={{ mt: 4 }}>
          <TransactionFlowDiagrams />
        </Box>
      )}

      {/* Edit Action Buttons */}
      {isEditing && (
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={
              updateLoading || isUploading ? (
                <CircularProgress size={20} />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={updateLoading || isUploading || !hasChanges}
          >
            {updateLoading
              ? t("common.saving", "Saving...")
              : t("common.save", "Save Changes")}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={updateLoading || isUploading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default NewsPage;
