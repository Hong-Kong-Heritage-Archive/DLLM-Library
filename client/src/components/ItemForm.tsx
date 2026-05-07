import React, { useState, useRef, useEffect } from "react";
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
  Typography,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import ClassificationEditor from "./ClassificationEditor";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  UpdateItemMutation,
  UpdateItemMutationVariables,
  ItemCondition,
  ItemStatus,
  Language,
  Item,
  User,
} from "../generated/graphql";
import { batchProcessImages, ProcessedImage } from "../utils/ImageProcessor";
import {
  uploadImages,
  ImagePreview,
  separateExistingAndNewImages,
  combineImageUrls,
} from "../utils/imageUpload";
import { useTranslation } from "react-i18next";
import BookCoverSearchDialog from "./BookCoverSearchDialog";
import {
  DEFAULT_CONTENT_RATING,
  CONTENT_RATING_OPTIONS,
  CONTENT_RATING_CENSOR_THRESHOLD,
} from "../utils/contentRating";

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
    $contentRating: Int
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
      contentRating: $contentRating
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
      contentRating
      contentRatingChecked
    }
  }
`;

const UPDATE_ITEM_MUTATION = gql`
  mutation UpdateItem(
    $id: ID!
    $name: String
    $category: [String!]
    $classifications: [String!]
    $condition: ItemCondition
    $description: String
    $images: [String!]
    $language: Language
    $publishedYear: Int
    $status: ItemStatus
    $deposit: Int
    $contentRating: Int
    $contentRatingChecked: Boolean
    $shadowBanned: Boolean
  ) {
    updateItem(
      id: $id
      name: $name
      category: $category
      classifications: $classifications
      condition: $condition
      description: $description
      images: $images
      language: $language
      publishedYear: $publishedYear
      status: $status
      deposit: $deposit
      contentRating: $contentRating
      contentRatingChecked: $contentRatingChecked
      shadowBanned: $shadowBanned
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
      contentRating
      contentRatingChecked
      shadowBanned
    }
  }
`;

interface ItemFormProps {
  onItemCreated?: (data: CreateItemMutation) => void;
  onItemUpdated?: (data: UpdateItemMutation) => void;
  open: boolean;
  user: User;
  onClose?: () => void;
  item?: Item | null; // If provided, edit mode; otherwise, create mode
  onError?: (message: string) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({
  open,
  user,
  onItemCreated,
  onItemUpdated,
  onClose,
  item = null,
  onError,
}) => {
  const apolloClient = useApolloClient();
  const { t, i18n } = useTranslation();

  const isEditMode = !!item;

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(open);
  const [name, setName] = useState("");
  const [isbn, setIsbn] = useState("");
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.New);
  const [description, setDescription] = useState("");
  const [deposit, setDeposit] = useState<number>(0);
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [language, setLanguage] = useState<Language>(
    i18n.language.toLowerCase().startsWith("zh") ? Language.ZhHk : Language.En,
  );
  const [publishedYear, setPublishedYear] = useState<number | "">("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.Available);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [contentRating, setContentRating] = useState<number>(DEFAULT_CONTENT_RATING);

  const isAdmin = user.role === "ADMIN";

  // Store original values for edit mode comparison
  const [originalValues, setOriginalValues] = useState<{
    name: string;
    isbn: string;
    condition: ItemCondition;
    description: string;
    publishedYear: number | "";
    status: ItemStatus;
    language: Language;
    images: string[];
    deposit: number;
    classifications: string[];
    contentRating: number;
  } | null>(null);

  // Image menu states
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  // Book cover search dialog state
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);

  // Image processing states
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  // Populate form when item changes (edit mode)
  useEffect(() => {
    if (item && open) {
      const itemName = item.name || "";
      const itemCondition = item.condition || ItemCondition.Good;
      const itemDescription =
        item.description?.replace(/#Uncategorized\b/gi, "") || "";
      const itemPublishedYear = item.publishedYear ?? "";
      const itemStatus = item.status || ItemStatus.Available;
      const itemLanguage =
        item.language ||
        (i18n.language.toLowerCase().startsWith("zh")
          ? Language.ZhHk
          : Language.En);
      const itemImages = item.images || [];
      const itemDeposit = item.deposit || 0;
      const itemClassifications = item.clssfctns || [];
      console.log(`${item.name} isbn: ${item.isbn}`);

      setName(itemName);
      setIsbn(item.isbn || "");
      setCondition(itemCondition);
      setDescription(itemDescription);
      setPublishedYear(itemPublishedYear);
      setStatus(itemStatus);
      setLanguage(itemLanguage);
      const itemContentRating = (item as any).contentRating ?? DEFAULT_CONTENT_RATING;
      setDeposit(itemDeposit);
      setClassifications(itemClassifications);
      setContentRating(itemContentRating);

      // Store original values for comparison
      setOriginalValues({
        name: itemName,
        condition: itemCondition,
        description: itemDescription,
        publishedYear: itemPublishedYear,
        status: itemStatus,
        language: itemLanguage,
        images: itemImages,
        deposit: itemDeposit,
        classifications: itemClassifications,
        contentRating: (item as any).contentRating ?? DEFAULT_CONTENT_RATING,
        isbn: item.isbn || "",
      });

      // Convert existing images to ImagePreview format
      const existingImages: ImagePreview[] = itemImages.map((url, index) => ({
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
      }));
      setImageFiles(existingImages);
    }
  }, [item, open, i18n.language]);

  const [createItem, { loading: createLoading }] = useMutation<
    CreateItemMutation,
    CreateItemMutationVariables
  >(CREATE_ITEM_MUTATION, {
    onCompleted: (data) => {
      setShowSuccessSnackbar(true);
      if (onItemCreated) onItemCreated(data);
      handleClose();
    },
    onError: (error) => {
      setFormError(error.message);
      if (onError) onError(error.message);
    },
  });

  const [updateItem, { loading: updateLoading }] = useMutation<
    UpdateItemMutation,
    UpdateItemMutationVariables
  >(UPDATE_ITEM_MUTATION, {
    onCompleted: (data) => {
      setShowSuccessSnackbar(true);
      if (onItemUpdated) onItemUpdated(data);
      handleClose();
    },
    onError: (error) => {
      setFormError(error.message);
      if (onError) onError(error.message);
    },
  });

  const loading = createLoading || updateLoading;

  const handleClose = () => {
    onClose?.();
    setDialogOpen(false);

    // Cleanup object URLs for new images only
    imageFiles.forEach((image) => {
      if (!image.isExisting) {
        URL.revokeObjectURL(image.url);
      }
    });

    // Reset form state
    setName("");
    setCondition(ItemCondition.New);
    setDescription("");
    setImageFiles([]);
    setLanguage(
      i18n.language.toLowerCase().startsWith("zh")
        ? Language.ZhHk
        : Language.En,
    );
    setPublishedYear("");
    setStatus(ItemStatus.Available);
    setFormError(null);
    setIsProcessingImages(false);
    setProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setDeposit(0);
    setImageMenuAnchor(null);
    setOriginalValues(null);
    setClassifications([]);
    setContentRating(DEFAULT_CONTENT_RATING);
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

  const handleSearchBookCover = () => {
    handleImageMenuClose();
    setCoverSearchOpen(true);
  };

  const handleCoverSelected = (image: ImagePreview) => {
    setImageFiles((prev) => [...prev, image]);
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
        },
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
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    await processFiles(files);
    event.target.value = "";
  };

  const handleCameraCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    await processFiles(files);
    event.target.value = "";
  };

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
      // Separate existing and new images
      const { existing: existingImages, new: newImages } =
        separateExistingAndNewImages(imageFiles);

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        const uploadStartIndex = imageFiles.findIndex((p) => !p.isExisting);
        newImageUrls = await uploadImages(apolloClient, newImages, {
          folder: "items",
          onFileProgress: (fileIndex, progress) => {
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
                  ? {
                    ...img,
                    isUploading: true,
                    uploadProgress: progress.percentage,
                  }
                  : img,
              ),
            );
          },
          onFileComplete: (fileIndex, gsUrl) => {
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
                  ? {
                    ...img,
                    isUploading: false,
                    uploadProgress: 100,
                    gsUrl: gsUrl,
                  }
                  : img,
              ),
            );
          },
          onOverallProgress: (percentage) => {
            setUploadProgress(percentage);
          },
          onError: (fileIndex, error) => {
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
                  ? {
                    ...img,
                    isUploading: false,
                    uploadError: error,
                  }
                  : img,
              ),
            );
          },
        });
      }

      // Combine existing and new image URLs
      const allImageUrls = combineImageUrls(existingImages, newImageUrls);

      // Extract hashtags from description
      const hashtags = description
        .split("#")
        .slice(1)
        .map((c) => c.split(/\s/)[0].trim())
        .filter(Boolean);

      const categories = hashtags.length > 0 ? hashtags : ["Uncategorized"];

      if (isEditMode && item) {
        // Update mode
        const variables: UpdateItemMutationVariables = {
          id: item.id,
        };

        // Only include changed fields
        if (originalValues) {
          if (name.trim() !== originalValues.name) {
            variables.name = name;
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

          if (deposit !== originalValues.deposit) {
            variables.deposit = deposit;
          }

          const currentDescription = description?.trim() || null;
          const originalDescription =
            originalValues.description?.trim() || null;
          if (currentDescription !== originalDescription) {
            variables.description = currentDescription;
            variables.category = categories;
          }

          const currentPublishedYear =
            publishedYear === "" ? null : Number(publishedYear);
          const originalPublishedYearValue =
            originalValues.publishedYear === ""
              ? null
              : Number(originalValues.publishedYear);
          if (currentPublishedYear !== originalPublishedYearValue) {
            variables.publishedYear = currentPublishedYear;
          }

          // Check if images have changed
          const hasImageChanges =
            newImages.length > 0 ||
            allImageUrls.length !== originalValues.images.length ||
            JSON.stringify(allImageUrls) !==
            JSON.stringify(originalValues.images);

          if (hasImageChanges) {
            variables.images = allImageUrls;
          }

          // Check if classifications have changed
          const hasClassificationChanges =
            JSON.stringify(classifications.sort()) !==
            JSON.stringify((originalValues?.classifications || []).sort());

          if (hasClassificationChanges) {
            variables.classifications = classifications;
          }

          if (contentRating !== (originalValues?.contentRating ?? DEFAULT_CONTENT_RATING)) {
            variables.contentRating = contentRating;
          }

          // Only proceed if there are actually changes
          const hasChanges = Object.keys(variables).length > 1;

          if (!hasChanges) {
            setFormError(t("item.noChangesDetected", "No changes detected"));
            setIsUploading(false);
            return;
          }
        }

        console.log("Updating item with variables:", variables);
        await updateItem({ variables });
      } else {
        // Create mode
        const variables: CreateItemMutationVariables = {
          name,
          category: categories,
          condition,
          language,
          status,
          deposit,
          contentRating,
        };

        if (description?.trim()) {
          variables.description = description.trim();
        }

        if (allImageUrls.length > 0) {
          variables.images = allImageUrls;
        }

        if (publishedYear !== "") {
          variables.publishedYear = Number(publishedYear);
        }

        console.log("Creating item with variables:", variables);
        await createItem({ variables });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(
        isEditMode ? t("item.updateItemError") : t("item.createItemError"),
      );
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
      {!item && (
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          {t("item.create")}
        </Button>
      )}

      {(dialogOpen || open) && (
        <Dialog
          open={dialogOpen || open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: "center" }}>
            {isEditMode
              ? t("item.editItem", "Edit Item")
              : t("item.create", "Create Item")}
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
                SelectProps={{
                  renderValue: (value) => {
                    return t(`item.conditions.${value}`, value as string);
                  },
                }}
                helperText={t(
                  "item.conditionHelper",
                  "Select the option that best describes your item.",
                )}
              >
                {Object.values(ItemCondition).map((cond) => (
                  <MenuItem key={cond} value={cond}>
                    <ListItemText
                      primary={t(`item.conditions.${cond}`, cond)}
                      secondary={t(`item.conditionDescription.${cond}`, cond)}
                      secondaryTypographyProps={{
                        style: {
                          whiteSpace: "normal",
                          maxWidth: "90%",
                        },
                      }}
                    />
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
                onChange={(e) => setDeposit(Number(e.target.value))}
                helperText={t("item.depositHelper")}
              />

              <TextField
                select
                label={t("contentRating.label", "Content Rating")}
                fullWidth
                margin="normal"
                value={contentRating}
                onChange={(e) => setContentRating(Number(e.target.value))}
              >
                {CONTENT_RATING_OPTIONS.filter(
                  (opt) => opt.value <= CONTENT_RATING_CENSOR_THRESHOLD,
                ).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey, opt.labelKey)}
                  </MenuItem>
                ))}
              </TextField>

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
                  {t("common.addImages", "Add Images")}
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

                  <Divider />

                  <MenuItem onClick={handleSearchBookCover}>
                    <ListItemIcon>
                      <SearchIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("item.searchBookCover", "Search Book Cover")}
                    </ListItemText>
                  </MenuItem>
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {t("item.existing", "Existing")}
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
                    {t(`languages.${lang}`, lang)}
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
                    {t(`item.statuses.${stat}`, stat)}
                  </MenuItem>
                ))}
              </TextField>

              {/* Classification Editor - NEW */}

              {isAdmin && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <ClassificationEditor
                    classifications={classifications}
                    onChange={setClassifications}
                    showAddCategoryButton={true}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>{t("common.cancel")}</Button>
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
                      ? isEditMode
                        ? t("common.updating")
                        : t("common.creating")
                      : isEditMode
                        ? t("common.save")
                        : t("item.create")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Book Cover Search Dialog */}
      <BookCoverSearchDialog
        open={coverSearchOpen}
        onClose={() => setCoverSearchOpen(false)}
        onSelect={handleCoverSelected}
        isbn={isbn || undefined}
        itemName={name || undefined}
      />

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
          {isEditMode
            ? t("item.updateSuccess", "Item updated successfully!")
            : t("item.createSuccess")}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemForm;
