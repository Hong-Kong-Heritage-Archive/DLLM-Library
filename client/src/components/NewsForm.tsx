import React, { useState, useEffect } from "react";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  LinearProgress,
  Chip,
} from "@mui/material";
import { CloudUpload, Delete, PhotoCamera, Info } from "@mui/icons-material";
import {
  CreateNewsPostMutation,
  CreateNewsPostMutationVariables,
} from "../generated/graphql";
import { useTranslation } from "react-i18next";
import {
  processImage,
  batchProcessImages,
  ProcessedImage,
} from "../utils/ImageProcessor";
import { GCSUploadService, UploadProgress } from "../services/UploadService";

const CREATE_NEWS_MUTATION = gql`
  mutation CreateNewsPost(
    $title: String!
    $content: String!
    $images: [String!]
    $relatedItemIds: [ID!]
    $tags: [String!]
  ) {
    createNewsPost(
      title: $title
      content: $content
      images: $images
      relatedItemIds: $relatedItemIds
      tags: $tags
    ) {
      content
      createdAt
      id
      images
      isVisible
      relatedItems {
        id
        description
        name
        ownerId
      }
      tags
      title
    }
  }
`;

interface NewsFormProps {
  onNewsCreated?: (data: CreateNewsPostMutation) => void;
  maxImageSize?: number;
  imageQuality?: number;
}

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
}

const NewsForm: React.FC<NewsFormProps> = ({
  onNewsCreated,
  maxImageSize = 2000,
  imageQuality = 0.5,
}) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [relatedItemIds, setRelatedItemIds] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize GCS service with Apollo Client
  const gcsService = new GCSUploadService(apolloClient);

  const [createNewsPost, { data, loading, error: mutationError }] = useMutation<
    CreateNewsPostMutation,
    CreateNewsPostMutationVariables
  >(CREATE_NEWS_MUTATION);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Cleanup object URLs
    imageFiles.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });
    // Reset form
    setTitle("");
    setContent("");
    setImageFiles([]);
    setRelatedItemIds("");
    setTags("");
    setFormError(null);
    setIsProcessingImages(false);
    setProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setFormError(null);
    setIsProcessingImages(true);
    setProcessingProgress(0);

    try {
      // Validate files first
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setFormError(`File ${file.name} is not an image`);
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit before processing
          setFormError(`File ${file.name} is too large. Maximum size is 50MB`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setIsProcessingImages(false);
        return;
      }

      // Process images
      const processedImages = await batchProcessImages(
        validFiles,
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

      // Add to preview list
      const newImagePreviews: ImagePreview[] = processedImages.map((img) => ({
        ...img,
        uploadProgress: 0,
        isUploading: false,
      }));

      setImageFiles((prev) => [...prev, ...newImagePreviews]);
    } catch (error) {
      console.error("Image processing error:", error);
      setFormError(`Failed to process images: ${error}`);
    } finally {
      setIsProcessingImages(false);
      setProcessingProgress(0);
    }

    // Clear input
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const newFiles = [...prev];
      const removedImage = newFiles[index];

      // Cleanup object URLs
      URL.revokeObjectURL(removedImage.url);

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadImages = async (images: ImagePreview[]): Promise<string[]> => {
    const totalFiles = images.length;
    const uploadedGsUrls: string[] = [];

    try {
      const filesToUpload = images.map((img) => img.file);

      const gsUrls = await gcsService.batchUploadToGCS(
        filesToUpload,
        "news",
        (fileIndex: number, progress: UploadProgress) => {
          // Update individual file progress
          setImageFiles((prev) =>
            prev.map((img, idx) =>
              idx === fileIndex
                ? {
                  ...img,
                  isUploading: true,
                  uploadProgress: progress.percentage,
                }
                : img
            )
          );

          // Update overall progress
          const overallProgress = Math.round(
            ((fileIndex + progress.percentage / 100) / totalFiles) * 100
          );
          setUploadProgress(overallProgress);
        },
        (fileIndex: number, gsUrl: string) => {
          // Mark file as completed
          setImageFiles((prev) =>
            prev.map((img, idx) =>
              idx === fileIndex
                ? {
                  ...img,
                  isUploading: false,
                  uploadProgress: 100,
                  gsUrl: gsUrl,
                }
                : img
            )
          );

          uploadedGsUrls[fileIndex] = gsUrl;
          console.log(`File ${fileIndex + 1}/${totalFiles} uploaded: ${gsUrl}`);
        }
      );

      return gsUrls;
    } catch (error) {
      console.error("Batch upload error:", error);

      // Mark failed uploads
      setImageFiles((prev) =>
        prev.map((img, _) =>
          !img.gsUrl
            ? {
              ...img,
              isUploading: false,
              uploadError: `Upload failed: ${error}`,
            }
            : img
        )
      );

      throw error;
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setFormError(t("news.titleRequired"));
      return false;
    }
    if (!content.trim()) {
      setFormError(t("news.contentRequired"));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload images to GCS and get GS URLs
      let gsUrls: string[] = [];
      if (imageFiles.length > 0) {
        gsUrls = await uploadImages(imageFiles);
        console.log("All images uploaded to GCS:", gsUrls);
      }

      const relatedItemIdsArray = relatedItemIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      const tagsArray = [
        ...tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        ...content
          .split("#")
          .slice(1)
          .map((c) => c.split(/\s/)[0].trim())
          .filter(Boolean)
      ];

      // Create news post with GS URLs
      const result = await createNewsPost({
        variables: {
          title,
          content,
          images: gsUrls,
          relatedItemIds: relatedItemIdsArray,
          tags: tagsArray,
        },
      });

      if (result.data && onNewsCreated) {
        onNewsCreated(result.data);
      }
      handleClose();
    } catch (e) {
      console.error("Submission error:", e);
      setFormError(`Failed to create news post: ${e}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    if (mutationError) {
      setFormError(`Error creating post: ${mutationError.message}`);
    }
  }, [mutationError]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        {t("news.create")}
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{t("news.createPost")}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              id="title"
              label={t("news.title")}
              type="text"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isProcessingImages || isUploading}
            />

            <TextField
              margin="dense"
              id="content"
              label={t("news.content")}
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isProcessingImages || isUploading}
            />

            {/* Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t("common.images")}
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info fontSize="small" />
                </IconButton>
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                {t("news.imageUploadInfo", { maxImageSize })}
              </Alert>

              {/* Image Processing Progress */}
              {isProcessingImages && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {t("common.processingImages")}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={processingProgress}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {t("news.progressComplete", { progress: processingProgress })}
                  </Typography>
                </Box>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {t("news.uploadingToGCS")}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {t("news.progressComplete", { progress: uploadProgress })}
                  </Typography>
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{ mb: 2 }}
                disabled={isProcessingImages || isUploading}
              >
                {t("common.addImages")}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Button>

              {/* Image Previews */}
              {imageFiles.length > 0 && (
                <Grid container spacing={2}>
                  {imageFiles.map((image, index) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                      <Box sx={{ position: "relative" }}>
                        <img
                          src={image.url}
                          alt={t("news.imagePreview", { index: index + 1 })}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />

                        {/* Upload Status Indicators */}
                        {image.isUploading && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "rgba(25, 118, 210, 0.9)",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "0 0 8px 8px",
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={image.uploadProgress || 0}
                              sx={{
                                mb: 0.5,
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: "white",
                                },
                              }}
                            />
                            <Typography variant="caption">
                              {t("news.uploadingProgress", { progress: image.uploadProgress || 0 })}
                            </Typography>
                          </Box>
                        )}

                        {/* Success Indicator */}
                        {image.gsUrl && !image.isUploading && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "rgba(76, 175, 80, 0.9)",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "0 0 8px 8px",
                            }}
                          >
                            <Typography variant="caption">
                              {t("news.uploadedToGCS")}
                            </Typography>
                          </Box>
                        )}

                        {/* Error Overlay */}
                        {image.uploadError && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "rgba(244, 67, 54, 0.9)",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "0 0 8px 8px",
                            }}
                          >
                            <Typography variant="caption">
                              {t("news.uploadFailed")}
                            </Typography>
                          </Box>
                        )}

                        {/* Delete Button */}
                        <IconButton
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                            },
                          }}
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isProcessingImages || isUploading}
                        >
                          <Delete fontSize="small" />
                        </IconButton>

                        {/* Image Info */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Chip
                            label={`${image.width}×${image.height}`}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              fontSize: "0.6rem",
                              height: 16,
                            }}
                          />
                          <Chip
                            label={formatFileSize(image.size)}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              fontSize: "0.6rem",
                              height: 16,
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <TextField
              margin="dense"
              id="relatedItemIds"
              label={t("news.relatedItemIds")}
              type="text"
              fullWidth
              variant="outlined"
              value={relatedItemIds}
              onChange={(e) => setRelatedItemIds(e.target.value)}
              helperText={t("news.relatedItemIdsHelper")}
              disabled={isProcessingImages || isUploading}
            />

            <TextField
              margin="dense"
              id="tags"
              label={t("common.tags")}
              type="text"
              fullWidth
              variant="outlined"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              helperText={t("news.tagsHelper")}
              disabled={isProcessingImages || isUploading}
            />
          </DialogContent>

          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button
              onClick={handleClose}
              color="secondary"
              disabled={isProcessingImages || isUploading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                isProcessingImages ||
                isUploading ||
                !title.trim() ||
                !content.trim()
              }
            >
              {loading || isProcessingImages || isUploading ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {isProcessingImages
                    ? t("common.processingImages")
                    : isUploading
                      ? t("common.uploading")
                      : t("common.creating")}
                </Box>
              ) : (
                t("news.createPost")
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NewsForm;
