import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Grid,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Typography,
} from "@mui/material";
import {
  Delete,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Item } from "../generated/graphql";
import { batchProcessImages, ProcessedImage } from "../utils/ImageProcessor";
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
      id
      title
      content
      images
      createdAt
      updatedAt
      relatedItems {
        id
        name
        thumbnails
        images
      }
    }
  }
`;

const UPDATE_NEWS_MUTATION = gql`
  mutation UpdateNewsPost(
    $id: ID!
    $title: String
    $content: String
    $images: [String!]
    $relatedItemIds: [ID!]
    $tags: [String!]
  ) {
    updateNewsPost(
      id: $id
      title: $title
      content: $content
      images: $images
      relatedItemIds: $relatedItemIds
      tags: $tags
    ) {
      id
      title
      content
      images
      isVisible
      updatedAt
      relatedItems {
        id
        name
        thumbnails
        images
      }
    }
  }
`;

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
  isExisting?: boolean;
}

interface NewsFormProps {
  open: boolean;
  onClose: () => void;
  relatedItem?: Item | null; // Pre-populate with an item
  newsPost?: any; // For edit mode
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const NewsForm: React.FC<NewsFormProps> = ({
  open,
  onClose,
  relatedItem,
  newsPost,
  onSuccess,
  onError,
}) => {
  const apolloClient = useApolloClient();
  const { t } = useTranslation();
  const isEditMode = !!newsPost;

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Image menu states
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Processing states
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Store original values for edit mode comparison
  const [originalValues, setOriginalValues] = useState<{
    title: string;
    content: string;
    images: string[];
    relatedItemIds: string[];
  } | null>(null);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  // Initialize form with relatedItem or newsPost
  useEffect(() => {
    if (open) {
      if (newsPost) {
        // Edit mode
        setTitle(newsPost.title || "");
        setContent(newsPost.content || "");
        setRelatedItems(newsPost.relatedItems || []);

        const existingImages: ImagePreview[] = (newsPost.images || []).map(
          (url: string, index: number) => ({
            url,
            file: new File([], `existing-${index}`),
            originalFile: new File([], `existing-${index}`),
            width: 0,
            height: 0,
            size: 0,
            compressionApplied: false,
            finalQuality: 1,
            isExisting: true,
            gsUrl: url,
          })
        );
        setImageFiles(existingImages);

        setOriginalValues({
          title: newsPost.title || "",
          content: newsPost.content || "",
          images: newsPost.images || [],
          relatedItemIds: (newsPost.relatedItems || []).map(
            (item: Item) => item.id
          ),
        });
      } else if (relatedItem) {
        // Create mode with pre-populated item
        setTitle(
          t("news.newsAboutItem", "News about {{itemName}}", {
            itemName: relatedItem.name,
          })
        );
        setRelatedItems([relatedItem]);
      }
    }
  }, [open, newsPost, relatedItem, t]);

  const [createNews, { loading: createLoading }] = useMutation(
    CREATE_NEWS_MUTATION,
    {
      onCompleted: () => {
        setShowSuccessSnackbar(true);
        onSuccess?.();
        handleClose();
      },
      onError: (error) => {
        setFormError(error.message);
        onError?.(error.message);
      },
    }
  );

  const [updateNews, { loading: updateLoading }] = useMutation(
    UPDATE_NEWS_MUTATION,
    {
      onCompleted: () => {
        setShowSuccessSnackbar(true);
        onSuccess?.();
        handleClose();
      },
      onError: (error) => {
        setFormError(error.message);
        onError?.(error.message);
      },
    }
  );

  const loading = createLoading || updateLoading;

  const handleClose = () => {
    onClose();

    // Cleanup object URLs for new images only
    imageFiles.forEach((image) => {
      if (!image.isExisting) {
        URL.revokeObjectURL(image.url);
      }
    });

    // Reset form state
    setTitle("");
    setContent("");
    setImageFiles([]);
    setRelatedItems([]);
    setTags("");
    setFormError(null);
    setIsProcessingImages(false);
    setProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setImageMenuAnchor(null);
    setOriginalValues(null);
  };

  const handleRemoveRelatedItem = (itemId: string) => {
    setRelatedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Image menu handlers
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

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setFormError(null);
    setIsProcessingImages(true);
    setProcessingProgress(0);

    try {
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setFormError(
            t("news.fileNotImage", "{{fileName}} is not an image file", {
              fileName: file.name,
            })
          );
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          setFormError(
            t("news.fileTooLarge", "{{fileName}} is too large (max 50MB)", {
              fileName: file.name,
            })
          );
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setIsProcessingImages(false);
        return;
      }

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

      const newImagePreviews: ImagePreview[] = processedImages.map((img) => ({
        ...img,
        uploadProgress: 0,
        isUploading: false,
        isExisting: false,
      }));

      setImageFiles((prev) => [...prev, ...newImagePreviews]);
    } catch (error) {
      console.error("Image processing error:", error);
      setFormError(
        t("news.imageProcessingError", "Image processing error: {{error}}", {
          error: String(error),
        })
      );
    } finally {
      setIsProcessingImages(false);
      setProcessingProgress(0);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await processFiles(files);
    event.target.value = "";
  };

  const handleCameraCapture = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await processFiles(files);
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const newFiles = [...prev];
      const removedImage = newFiles[index];

      if (!removedImage.isExisting) {
        URL.revokeObjectURL(removedImage.url);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadImages = async (
    imagesToUpload: ImagePreview[]
  ): Promise<string[]> => {
    const gcsService = new GCSUploadService(apolloClient);
    const totalFiles = imagesToUpload.length;

    try {
      const filesToUpload = imagesToUpload.map((img) => img.file);

      const gsUrls = await gcsService.batchUploadToGCS(
        filesToUpload,
        "news",
        (fileIndex: number, progress: UploadProgress) => {
          setImageFiles((prev) =>
            prev.map((img, idx) => {
              const uploadStartIndex = prev.findIndex((p) => !p.isExisting);
              const actualIndex = uploadStartIndex + fileIndex;

              return idx === actualIndex
                ? {
                    ...img,
                    isUploading: true,
                    uploadProgress: progress.percentage,
                  }
                : img;
            })
          );

          const overallProgress = Math.round(
            ((fileIndex + progress.percentage / 100) / totalFiles) * 100
          );
          setUploadProgress(overallProgress);
        },
        (fileIndex: number, gsUrl: string) => {
          setImageFiles((prev) =>
            prev.map((img, idx) => {
              const uploadStartIndex = prev.findIndex((p) => !p.isExisting);
              const actualIndex = uploadStartIndex + fileIndex;

              return idx === actualIndex
                ? {
                    ...img,
                    isUploading: false,
                    uploadProgress: 100,
                    gsUrl: gsUrl,
                  }
                : img;
            })
          );
        }
      );

      return gsUrls;
    } catch (error) {
      console.error("Batch upload error:", error);

      setImageFiles((prev) =>
        prev.map((img) =>
          !img.isExisting && !img.gsUrl
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setFormError(t("news.titleRequired", "Title is required"));
      return;
    }

    if (!content.trim()) {
      setFormError(t("news.contentRequired", "Content is required"));
      return;
    }

    setFormError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const existingImages = imageFiles.filter((img) => img.isExisting);
      const newImages = imageFiles.filter((img) => !img.isExisting);

      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadImages(newImages);
      }

      const allImageUrls = [
        ...existingImages.map((img) => img.gsUrl || img.url),
        ...newImageUrls,
      ];

      const relatedItemIds = relatedItems.map((item) => item.id);

      if (isEditMode && newsPost) {
        // Update mode
        const variables: any = {
          id: newsPost.id,
        };

        if (originalValues) {
          if (title.trim() !== originalValues.title) {
            variables.title = title.trim();
          }

          if (content.trim() !== originalValues.content) {
            variables.content = content.trim();
          }

          const hasImageChanges =
            newImages.length > 0 ||
            allImageUrls.length !== originalValues.images.length ||
            JSON.stringify(allImageUrls) !==
              JSON.stringify(originalValues.images);

          if (hasImageChanges) {
            variables.images = allImageUrls;
          }

          const hasRelatedItemsChanges =
            JSON.stringify(relatedItemIds.sort()) !==
            JSON.stringify(originalValues.relatedItemIds.sort());

          if (hasRelatedItemsChanges) {
            variables.relatedItemIds = relatedItemIds;
          }

          const hasChanges = Object.keys(variables).length > 1;

          if (!hasChanges) {
            setFormError(t("news.noChangesDetected", "No changes detected"));
            setIsUploading(false);
            return;
          }
        }

        await updateNews({ variables });
      } else {
        // Create mode
        const variables: any = {
          title: title.trim(),
          content: content.trim(),
        };

        if (allImageUrls.length > 0) {
          variables.images = allImageUrls;
        }

        if (relatedItemIds.length > 0) {
          variables.relatedItemIds = relatedItemIds;
        }
        const tagsArray = [
          ...tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          ...content
            .split("#")
            .slice(1)
            .map((c) => c.split(/\s/)[0].trim())
            .filter(Boolean),
        ];

        if (tagsArray.length > 0) {
          variables.tags = tagsArray;
        }

        await createNews({ variables });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(
        isEditMode
          ? t("news.updateError", "Error updating news")
          : t("news.createError", "Error creating news")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isCameraAvailable = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ArticleIcon />
          {isEditMode
            ? t("news.editNews", "Edit News")
            : t("news.createNews", "Create News")}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            {/* Related Items Display */}
            {relatedItems.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  {t("news.relatedItems", "Related Items")}:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {relatedItems.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.name}
                      onDelete={() => handleRemoveRelatedItem(item.id)}
                      avatar={
                        item.thumbnails?.[0] || item.images?.[0] ? (
                          <img
                            src={item.thumbnails?.[0] || item.images?.[0]}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : undefined
                      }
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <TextField
              label={t("news.title", "Title")}
              fullWidth
              margin="normal"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <TextField
              label={t("news.content", "Content")}
              fullWidth
              margin="normal"
              required
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Image Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleImageMenuClick}
                startIcon={<PhotoCamera />}
                endIcon={<ArrowDropDownIcon />}
                disabled={isProcessingImages || isUploading}
                sx={{ mb: 2 }}
              >
                {t("news.addImages", "Add Images")}
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
                multiple
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

              {isProcessingImages && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={processingProgress}
                  />
                  <Box sx={{ textAlign: "center", mt: 1 }}>
                    {t("common.processingImages", "Processing images...")}{" "}
                    {processingProgress}%
                  </Box>
                </Box>
              )}

              {isUploading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                  <Box sx={{ textAlign: "center", mt: 1 }}>
                    {t("news.uploadingImages", "Uploading images...")}{" "}
                    {uploadProgress}%
                  </Box>
                </Box>
              )}

              {imageFiles.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {imageFiles.map((image, index) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="120"
                          image={image.url}
                          alt={`Preview ${index + 1}`}
                        />
                        <Box sx={{ p: 1, textAlign: "center" }}>
                          {image.isExisting && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t("news.existing", "Existing")}
                            </Typography>
                          )}
                          {image.isUploading && (
                            <LinearProgress
                              variant="determinate"
                              value={image.uploadProgress || 0}
                              sx={{ mb: 1 }}
                            />
                          )}
                          {image.uploadError && (
                            <Alert
                              severity="error"
                              sx={{ mb: 1, fontSize: "0.75rem" }}
                            >
                              {image.uploadError}
                            </Alert>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            disabled={image.isUploading}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
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

          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isProcessingImages || isUploading || loading}
            >
              {isProcessingImages
                ? t("common.processingImages", "Processing...")
                : isUploading
                ? t("common.uploading", "Uploading...")
                : loading
                ? isEditMode
                  ? t("common.updating", "Updating...")
                  : t("common.creating", "Creating...")
                : isEditMode
                ? t("common.save", "Save")
                : t("news.publish", "Publish")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {isEditMode
            ? t("news.updateSuccess", "News updated successfully!")
            : t("news.createSuccess", "News created successfully!")}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NewsForm;
