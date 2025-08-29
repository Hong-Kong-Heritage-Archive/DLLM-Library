import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { CloudUpload, Delete, PhotoCamera } from "@mui/icons-material";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import {
  Item,
  ItemCondition,
  ItemStatus,
  Language,
  UpdateItemMutation,
  UpdateItemMutationVariables,
} from "../generated/graphql";
import {
  processImage,
  batchProcessImages,
  ProcessedImage,
} from "../utils/ImageProcessor";
import { GCSUploadService, UploadProgress } from "../services/UploadService";
import { useTranslation } from "react-i18next";

const EDIT_ITEM_MUTATION = gql`
  mutation UpdateItem(
    $id: ID!
    $name: String
    $category: [String!]
    $condition: ItemCondition
    $description: String
    $images: [String!]
    $language: Language
    $publishedYear: Int
    $status: ItemStatus
  ) {
    updateItem(
      id: $id
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
interface EditItemFormProps {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onItemUpdated?: (data: UpdateItemMutation) => void;
  onError: (message: string) => void;
}

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
  isExisting?: boolean; // Flag for existing images
}

const EditItemForm: React.FC<EditItemFormProps> = ({
  open,
  item,
  onClose,
  onItemUpdated,
  onError,
}) => {
  const apolloClient = useApolloClient();
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.Good);
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [publishedYear, setPublishedYear] = useState<number | "">("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.Available);
  const [formError, setFormError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(Language.En);

  // Store original values for comparison
  const [originalValues, setOriginalValues] = useState<{
    name: string;
    category: string;
    condition: ItemCondition;
    description: string;
    publishedYear: number | "";
    status: ItemStatus;
    language: Language;
    images: string[];
  } | null>(null);

  // Image processing states
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  // Edit item mutation
  const [updateItem, { loading: updateLoading }] = useMutation<
    UpdateItemMutation,
    UpdateItemMutationVariables
  >(EDIT_ITEM_MUTATION, {
    onCompleted: (data) => {
      if (onItemUpdated) onItemUpdated(data);
      handleClose();
    },
    onError: (error) => {
      onError(error.message);
    },
  });

  // Populate form when item changes
  useEffect(() => {
    if (item && open) {
      const itemName = item.name || "";
      const itemCategory = item.category?.join(", ") || "";
      const itemCondition = item.condition || ItemCondition.Good;
      const itemDescription = item.description || "";
      const itemPublishedYear = item.publishedYear ?? "";
      const itemStatus = item.status || ItemStatus.Available;
      const itemLanguage = item.language || Language.En;
      const itemImages = item.images || [];

      setName(itemName);
      setCategory(itemCategory);
      setCondition(itemCondition);
      setDescription(itemDescription);
      setPublishedYear(itemPublishedYear);
      setStatus(itemStatus);
      setLanguage(itemLanguage);

      // Store original values for comparison
      setOriginalValues({
        name: itemName,
        category: itemCategory,
        condition: itemCondition,
        description: itemDescription,
        publishedYear: itemPublishedYear,
        status: itemStatus,
        language: itemLanguage,
        images: itemImages,
      });

      // Convert existing images to ImagePreview format
      const existingImages: ImagePreview[] = itemImages.map((url, index) => ({
        url,
        file: new File([], `existing-${index}`), // Dummy file for existing images
        originalFile: new File([], `existing-${index}`),
        width: 0,
        height: 0,
        size: 0,
        compressionApplied: false,
        finalQuality: 1,
        isExisting: true,
        gsUrl: url,
      }));
      setImageFiles(existingImages);
    }
  }, [item, open]);

  const handleClose = () => {
    // Cleanup object URLs for new images only
    imageFiles.forEach((image) => {
      if (!image.isExisting) {
        URL.revokeObjectURL(image.url);
      }
    });

    setName("");
    setCategory("");
    setCondition(ItemCondition.Good);
    setDescription("");
    setImageFiles([]);
    setPublishedYear("");
    setStatus(ItemStatus.Available);
    setFormError(null);
    setIsProcessingImages(false);
    setProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setLanguage(Language.En);
    onClose();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setFormError(null);
    setIsProcessingImages(true);
    setProcessingProgress(0);

    try {
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
        isExisting: false,
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

  // Add handleRemoveImage function back
  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const newFiles = [...prev];
      const removedImage = newFiles[index];

      // Cleanup object URLs for new images only
      if (!removedImage.isExisting) {
        URL.revokeObjectURL(removedImage.url);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadNewImages = async (newImages: ImagePreview[]): Promise<string[]> => {
    const gcsService = new GCSUploadService(apolloClient);
    const totalFiles = newImages.length;

    try {
      const filesToUpload = newImages.map((img) => img.file);

      const gsUrls = await gcsService.batchUploadToGCS(
        filesToUpload,
        "items",
        (fileIndex: number, progress: UploadProgress) => {
          // Update individual file progress
          setImageFiles((prev) =>
            prev.map((img, idx) => {
              // Find the index of this new image in the full array
              const newImageStartIndex = prev.findIndex(p => !p.isExisting);
              const actualIndex = newImageStartIndex + fileIndex;

              return idx === actualIndex
                ? {
                  ...img,
                  isUploading: true,
                  uploadProgress: progress.percentage,
                }
                : img;
            })
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
            prev.map((img, idx) => {
              const newImageStartIndex = prev.findIndex(p => !p.isExisting);
              const actualIndex = newImageStartIndex + fileIndex;

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

          console.log(`File ${fileIndex + 1}/${totalFiles} uploaded: ${gsUrl}`);
        }
      );

      return gsUrls;
    } catch (error) {
      console.error("Batch upload error:", error);

      // Mark failed uploads
      setImageFiles((prev) =>
        prev.map((img, _) =>
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

    if (!item?.id || !originalValues) return;

    if (!name.trim() || !category.trim()) {
      setFormError(t("item.nameAndCategoryRequired"));
      return;
    }

    setFormError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Separate existing and new images
      const existingImages = imageFiles.filter(img => img.isExisting);
      const newImages = imageFiles.filter(img => !img.isExisting);

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadNewImages(newImages);
      }

      // Combine existing and new image URLs
      const allImageUrls = [
        ...existingImages.map(img => img.gsUrl || img.url),
        ...newImageUrls
      ];

      // Build variables object with only changed fields
      const variables: UpdateItemMutationVariables = {
        id: item.id,
      };

      // Only include fields that have changed
      if (name.trim() !== originalValues.name) {
        variables.name = name;
      }

      const currentCategory = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const originalCategoryArray = originalValues.category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      if (JSON.stringify(currentCategory) !== JSON.stringify(originalCategoryArray)) {
        variables.category = currentCategory;
      }

      if (condition !== originalValues.condition) {
        variables.condition = condition;
      }

      if (status !== originalValues.status) {
        variables.status = status;
      }

      if (language !== originalValues.language) {
        variables.language = language;
      }

      const currentDescription = description?.trim() || null;
      const originalDescription = originalValues.description?.trim() || null;
      if (currentDescription !== originalDescription) {
        variables.description = currentDescription;
      }

      const currentPublishedYear = publishedYear === "" ? null : Number(publishedYear);
      const originalPublishedYearValue = originalValues.publishedYear === "" ? null : Number(originalValues.publishedYear);
      if (currentPublishedYear !== originalPublishedYearValue) {
        variables.publishedYear = currentPublishedYear;
      }

      // Check if images have changed (new images added or existing images removed)
      const hasImageChanges =
        newImages.length > 0 || // New images added
        allImageUrls.length !== originalValues.images.length || // Images removed/added
        JSON.stringify(allImageUrls) !== JSON.stringify(originalValues.images); // Images reordered or different

      if (hasImageChanges) {
        variables.images = allImageUrls;
      }

      // Only proceed if there are actually changes to send
      const hasChanges = Object.keys(variables).length > 1; // More than just 'id'

      if (!hasChanges) {
        setFormError(t("item.noChangesDetected", "No changes detected"));
        setIsUploading(false);
        return;
      }

      console.log("Sending only changed variables:", variables);

      await updateItem({ variables });
    } catch (err) {
      console.error("Update item error:", err);
      setFormError(t("item.updateItemError"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("item.editItem", "Edit Item")}
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
                        {image.isExisting && (
                          <Typography variant="caption" color="text.secondary">
                            Existing
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
                        {!image.isExisting && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            disabled={image.isUploading}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={updateLoading || isProcessingImages || isUploading}
          >
            {isProcessingImages
              ? t("common.processingImages")
              : isUploading
                ? t("common.uploading")
                : updateLoading
                  ? t("common.updating")
                  : t("common.save")}
          </Button>

          <Button
            onClick={handleClose}
            fullWidth
            sx={{ mt: 1 }}
            disabled={updateLoading || isProcessingImages || isUploading}
          >
            {t("common.cancel")}
          </Button>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EditItemForm;