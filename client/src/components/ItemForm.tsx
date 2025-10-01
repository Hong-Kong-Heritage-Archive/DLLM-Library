import React, { useState, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
} from "@mui/icons-material";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  ItemCondition,
  ItemStatus,
  Language,
} from "../generated/graphql";
import {
  processImage,
  batchProcessImages,
  ProcessedImage,
} from "../utils/ImageProcessor";
import { GCSUploadService, UploadProgress } from "../services/UploadService";
import { useTranslation } from "react-i18next";

const CREATE_ITEM_MUTATION = gql`
  mutation CreateItem(
    $name: String!
    $category: [String!]!
    $condition: ItemCondition!
    $description: String
    $images: [String!]
    $language: Language!
    $publishedYear: Int
    $status: ItemStatus!
    $deposit: Int
  ) {
    createItem(
      name: $name
      category: $category
      condition: $condition
      description: $description
      images: $images
      language: $language
      publishedYear: $publishedYear
      status: $status
      deposit: $deposit
    ) {
      id
      name
      description
      condition
      category
      status
      images
      publishedYear
      language
      createdAt
      ownerId
      updatedAt
      deposit
    }
  }
`;

interface ItemFormProps {
  onItemCreated?: (data: CreateItemMutation) => void;
  open: boolean;
  onClose?: () => void;
}

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({
  open,
  onItemCreated,
  onClose,
}) => {
  const apolloClient = useApolloClient();
  const { t } = useTranslation();

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(open);
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.New);
  const [description, setDescription] = useState("");
  const [deposit, setdeposit] = useState<number>(0);
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [language, setLanguage] = useState<Language>(Language.En);
  const [publishedYear, setPublishedYear] = useState<number | "">("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.Available);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Image menu states
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Image processing states
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  const [createItem, { data, loading, error }] = useMutation<
    CreateItemMutation,
    CreateItemMutationVariables
  >(CREATE_ITEM_MUTATION, {
    onCompleted: (data) => {
      setShowSuccessSnackbar(true);
      if (onItemCreated) onItemCreated(data);
      handleClose();
    },
  });

  const handleClose = () => {
    onClose?.();
    setDialogOpen(false);

    // Cleanup object URLs
    imageFiles.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    // Reset form state
    setName("");
    setCondition(ItemCondition.New);
    setDescription("");
    setImageFiles([]);
    setLanguage(Language.En);
    setPublishedYear("");
    setStatus(ItemStatus.Available);
    setFormError(null);
    setIsProcessingImages(false);
    setProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setdeposit(0);
    setImageMenuAnchor(null);
  };

  const handleCloseSuccessSnackbar = () => {
    setShowSuccessSnackbar(false);
  };

  // Handle image menu
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
      // Validate files first
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setFormError(t("item.fileNotImage", { fileName: file.name }));
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit before processing
          setFormError(t("item.fileTooLarge", { fileName: file.name }));
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
      setFormError(t("item.imageProcessingError", { error: String(error) }));
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
    // Clear input
    event.target.value = "";
  };

  const handleCameraCapture = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await processFiles(files);
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
    const gcsService = new GCSUploadService(apolloClient);
    const totalFiles = images.length;
    const uploadedGsUrls: string[] = [];

    try {
      const filesToUpload = images.map((img) => img.file);

      const gsUrls = await gcsService.batchUploadToGCS(
        filesToUpload,
        "items", // Use "items" folder instead of "news"
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setFormError(t("item.nameRequired"));
      return;
    }

    setFormError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload images first if any
      let uploadedImageUrls: string[] = [];

      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages(imageFiles);
      }

      // Build variables object with required fields
      const variables: CreateItemMutationVariables = {
        name,
        category: [],
        condition,
        language,
        status,
        deposit,
      };

      // Only add optional fields if they have actual values
      if (description?.trim()) {
        variables.description = description.trim();
        const hashtags = description
          .split("#")
          .slice(1) // Remove the first element (text before first #)
          .map((c) => c.split(/\s/)[0].trim()) // Get only the hashtag part (before any space)
          .filter(Boolean); // Remove empty strings

        if (hashtags.length > 0) {
          variables.category = [...variables.category, ...hashtags];
        }
      }

      if (!variables.category || variables.category.length === 0)
        variables.category = ["Uncategorized"];

      if (uploadedImageUrls.length > 0) {
        variables.images = uploadedImageUrls;
      }

      if (publishedYear !== "") {
        variables.publishedYear = Number(publishedYear);
      }

      console.log("Sending variables:", variables);

      await createItem({ variables });
    } catch (err) {
      console.error("Create item error:", err);
      setFormError(t("item.createItemError"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Check if camera is available
  const isCameraAvailable = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  return (
    <Box>
      {dialogOpen ? (
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle sx={{ textAlign: "center" }}>
            {t("item.create")}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <TextField
                label={t("common.name")}
                fullWidth
                margin="normal"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <TextField
                select
                label={t("item.condition")}
                fullWidth
                margin="normal"
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
              >
                {Object.values(ItemCondition).map((cond) => (
                  <MenuItem key={cond} value={cond}>
                    {cond}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={t("item.description")}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helperText={t("item.descriptionHelper")}
              />

              <TextField
                label={t("item.deposit")}
                fullWidth
                margin="normal"
                required
                type="number"
                value={deposit}
                onChange={(e) => setdeposit(Number(e.target.value))}
                helperText={t("item.depositHelper")}
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
                  {t("item.addImages", "Add Images")}
                </Button>

                {/* Image Source Menu */}
                <Menu
                  anchorEl={imageMenuAnchor}
                  open={Boolean(imageMenuAnchor)}
                  onClose={handleImageMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <MenuItem onClick={handleSelectFromGallery}>
                    <ListItemIcon>
                      <PhotoLibrary fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("item.selectFromGallery", "Select from Gallery")}
                    </ListItemText>
                  </MenuItem>

                  {isCameraAvailable() && (
                    <MenuItem onClick={handleTakePhoto}>
                      <ListItemIcon>
                        <CameraAlt fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>
                        {t("item.takePhoto", "Take Photo")}
                      </ListItemText>
                    </MenuItem>
                  )}
                </Menu>

                {/* Hidden file inputs */}
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
                  capture="environment" // Use rear camera by default
                  onChange={handleCameraCapture}
                />

                {isProcessingImages && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={processingProgress}
                    />
                    <Box sx={{ textAlign: "center", mt: 1 }}>
                      {t("common.processingImages")} {processingProgress}%
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
                      {t("item.uploadingImages", { progress: uploadProgress })}
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
                            alt={t("item.previewAlt", { index: index + 1 })}
                          />
                          <Box sx={{ p: 1, textAlign: "center" }}>
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
                select
                label={t("common.language")}
                fullWidth
                margin="normal"
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {Object.values(Language).map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={t("item.publishedYear")}
                type="number"
                fullWidth
                margin="normal"
                value={publishedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setPublishedYear(val === "" ? "" : Number(val));
                }}
                inputProps={{ min: 1000, max: 9999 }}
                helperText={t("item.publishedYearHelper")}
              />

              <TextField
                select
                label={t("item.status")}
                fullWidth
                margin="normal"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
              >
                {Object.values(ItemStatus).map((stat) => (
                  <MenuItem key={stat} value={stat}>
                    {stat}
                  </MenuItem>
                ))}
              </TextField>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error.message}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>{t("common.cancel")}</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isProcessingImages || isUploading || loading}
              >
                {isProcessingImages
                  ? t("common.processingImages")
                  : isUploading
                  ? t("common.uploading")
                  : loading
                  ? t("common.creating")
                  : t("item.create")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      ) : (
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          {t("item.create")}
        </Button>
      )}

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("item.createSuccess")}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemForm;
