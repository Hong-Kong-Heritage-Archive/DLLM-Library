import React, { useState } from "react";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { CloudUpload, Delete, PhotoCamera } from "@mui/icons-material";
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
    }
  }
`;

interface ItemFormProps {
  onItemCreated?: (data: CreateItemMutation) => void;
}

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ onItemCreated }) => {
  const apolloClient = useApolloClient();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.New);
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [language, setLanguage] = useState<Language>(Language.En);
  const [publishedYear, setPublishedYear] = useState<number | "">("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.Available);
  const [formError, setFormError] = useState<string | null>(null);

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
      if (onItemCreated) onItemCreated(data);
      handleClose();
    },
  });

  const handleClose = () => {
    setOpen(false);

    // Cleanup object URLs
    imageFiles.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    setName("");
    setCategory("");
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
          setFormError(t("item.fileTooLarge", { fileName: file.name }));
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
      setFormError(t("item.imageProcessingError", { error: String(error) }));
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

    if (!name.trim() || !category.trim()) {
      setFormError(t("item.nameAndCategoryRequired"));
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
        category: category
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        condition,
        language,
        status,
      };

      // Only add optional fields if they have actual values
      if (description?.trim()) {
        variables.description = description.trim();
      }

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

  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(true)}>
        {t("item.create")}
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
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
              label={t("item.categoryCommaSeparated")}
              fullWidth
              margin="normal"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              helperText={t("item.categoryHelper")}
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
              helperText={t("common.optional")}
            />

            {/* Image Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={isProcessingImages || isUploading}
                sx={{ mb: 2 }}
              >
                {t("common.addImages")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
              </Button>

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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading || isProcessingImages || isUploading}
            >
              {isProcessingImages
                ? t("common.processingImages")
                : isUploading
                  ? t("common.uploading")
                  : loading
                    ? t("common.creating")
                    : t("item.create")}
            </Button>

            <Button
              onClick={handleClose}
              fullWidth
              sx={{ mt: 1 }}
              disabled={loading || isProcessingImages || isUploading}
            >
              {t("common.cancel")}
            </Button>
          </DialogContent>
        </form>
      </Dialog>

      {
        data && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t("item.createSuccess")}
          </Alert>
        )
      }
    </Box >
  );
};

export default ItemForm;
