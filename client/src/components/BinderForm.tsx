import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  IconButton,
  LinearProgress,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Card,
  CardMedia,
  List,
  ListItem,
  ListItemText as MuiListItemText,
  Paper,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Delete,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
  Folder as FolderIcon,
  DragIndicator,
  InsertDriveFile as FileIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Binder, Bind, BindType } from "../generated/graphql";
import { batchProcessImages, ProcessedImage } from "../utils/ImageProcessor";
import { GCSUploadService, UploadProgress } from "../services/UploadService";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import ReactMarkdown from "react-markdown";

const UPDATE_BINDER_MUTATION = gql`
  mutation UpdateBinder(
    $id: ID!
    $name: String
    $description: String
    $images: [String!]
    $bindIds: [ID!]
  ) {
    updateBinder(
      id: $id
      name: $name
      description: $description
      images: $images
      bindIds: $bindIds
    ) {
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

interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
  isExisting?: boolean;
}

interface BinderFormProps {
  open: boolean;
  onClose: () => void;
  binder: Binder;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const BinderForm: React.FC<BinderFormProps> = ({
  open,
  onClose,
  binder,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionTab, setDescriptionTab] = useState<"edit" | "preview">(
    "edit"
  );
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [binds, setBinds] = useState<Bind[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  const [updateBinder, { loading }] = useMutation(UPDATE_BINDER_MUTATION, {
    onCompleted: () => {
      setShowSuccessSnackbar(true);
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        handleClose();
      }, 1000);
    },
    onError: (error) => {
      const errorMsg =
        error.message || t("binder.updateError", "Failed to update binder");
      setFormError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    },
  });

  // Initialize form with binder data
  useEffect(() => {
    if (open && binder) {
      setName(binder.name || "");
      setDescription(binder.description || "");
      setBinds([...binder.binds]);

      // Initialize existing images
      const existingImages: ImagePreview[] = [];
      if (binder.images) {
        binder.images.forEach((url, index) => {
          existingImages.push({
            url: url,
            file: new File([], `existing-${index}`),
            originalFile: new File([], `existing-${index}`),
            width: 0,
            height: 0,
            size: 0,
            compressionApplied: false,
            finalQuality: 1,
            isExisting: true,
            gsUrl: binder.images?.[index],
          });
        });
      }
      setImageFiles(existingImages);
      setFormError(null);
      setDescriptionTab("edit");
    }
  }, [open, binder]);

  const handleClose = () => {
    // Cleanup object URLs for new images only
    imageFiles.forEach((image) => {
      if (!image.isExisting && image.url) {
        URL.revokeObjectURL(image.url);
      }
    });

    setName("");
    setDescription("");
    setImageFiles([]);
    setBinds([]);
    setFormError(null);
    setIsProcessingImages(false);
    setIsUploading(false);
    setProcessingProgress(0);
    setUploadProgress(0);
    setDescriptionTab("edit");
    setImageMenuAnchor(null);
    onClose();
  };

  const handleImageMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setImageMenuAnchor(event.currentTarget);
  };

  const handleImageMenuClose = () => {
    setImageMenuAnchor(null);
  };

  const handleSelectFromLibrary = () => {
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

      // Cleanup object URLs for new images only
      if (!removedImage.isExisting && removedImage.url) {
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
    const uploadedGsUrls: string[] = [];

    try {
      const filesToUpload = imagesToUpload.map((img) => img.file);

      const gsUrls = await gcsService.batchUploadToGCS(
        filesToUpload,
        `binders/${binder.id}`,
        (fileIndex: number, progress: UploadProgress) => {
          // Update individual file progress
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

          uploadedGsUrls[fileIndex] = gsUrl;
          console.log(`File ${fileIndex + 1}/${totalFiles} uploaded: ${gsUrl}`);
        }
      );

      return gsUrls;
    } catch (error) {
      console.error("Batch upload error:", error);

      // Mark failed uploads
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(binds);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBinds(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError(t("binder.nameRequired", "Binder name is required"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Separate existing and new images
      const existingImages = imageFiles.filter((img) => img.isExisting);
      const newImages = imageFiles.filter((img) => !img.isExisting);

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadImages(newImages);
      }

      // Combine existing and new image URLs
      const allImageUrls = [
        ...existingImages.map((img) => img.gsUrl || img.url),
        ...newImageUrls,
      ];

      // Get bind IDs in current order
      const bindIds = binds.map((bind) => bind.id);

      // Submit update
      await updateBinder({
        variables: {
          id: binder.id,
          name: name.trim(),
          description: description.trim() || null,
          images: allImageUrls.length > 0 ? allImageUrls : [],
          bindIds: bindIds,
        },
        refetchQueries: ["BinderDetail"],
      });
    } catch (error) {
      console.error("Error updating binder:", error);
      setFormError(
        t("binder.updateError", "Failed to update binder. Please try again.")
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
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderIcon />
          {t("binder.editBinder", "Edit Binder")}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            {/* Name Field */}
            <TextField
              label={t("binder.name", "Binder Name")}
              fullWidth
              margin="normal"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isProcessingImages || isUploading || loading}
            />

            {/* Description Field with Markdown Support */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={descriptionTab}
                  onChange={(_, newValue) => setDescriptionTab(newValue)}
                >
                  <Tab
                    icon={<EditIcon />}
                    iconPosition="start"
                    label={t("common.edit", "Edit")}
                    value="edit"
                  />
                  <Tab
                    icon={<PreviewIcon />}
                    iconPosition="start"
                    label={t("common.preview", "Preview")}
                    value="preview"
                  />
                </Tabs>
              </Box>

              {descriptionTab === "edit" ? (
                <>
                  <TextField
                    label={t("binder.description", "Description")}
                    fullWidth
                    multiline
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isProcessingImages || isUploading || loading}
                    placeholder={t(
                      "binder.descriptionPlaceholder",
                      "You can use Markdown formatting..."
                    )}
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t(
                        "binder.markdownSupported",
                        "Markdown formatting supported"
                      )}
                      : <strong>**bold**</strong>, <em>*italic*</em>, # headers,
                      [links](url), - lists, etc.
                    </Typography>
                  </Box>
                </>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 200,
                    maxHeight: 400,
                    overflow: "auto",
                  }}
                >
                  {description.trim() ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                          <Typography variant="h4" gutterBottom {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <Typography variant="h5" gutterBottom {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <Typography variant="h6" gutterBottom {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <Typography variant="body1" paragraph {...props} />
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
                          <Box component="ul" sx={{ pl: 2 }} {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <Box component="ol" sx={{ pl: 2 }} {...props} />
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
                              }}
                            >
                              <code {...props} />
                            </Box>
                          ),
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      {t("binder.noContent", "No content to preview")}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>

            {/* Image Upload Section */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">
                  {t("binder.images", "Binder Images")}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleImageMenuClick}
                  endIcon={<ArrowDropDownIcon />}
                  disabled={isProcessingImages || isUploading || loading}
                  startIcon={<PhotoCamera />}
                >
                  {t("common.addImage", "Add Image")}
                </Button>
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
                  <MenuItem onClick={handleSelectFromLibrary}>
                    <ListItemIcon>
                      <PhotoLibrary fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("common.chooseFromLibrary", "Choose from Library")}
                    </ListItemText>
                  </MenuItem>

                  {isCameraAvailable() && (
                    <MenuItem onClick={handleTakePhoto}>
                      <ListItemIcon>
                        <CameraAlt fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>
                        {t("common.takePhoto", "Take Photo")}
                      </ListItemText>
                    </MenuItem>
                  )}
                </Menu>
              </Box>

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

            {/* Binds Reordering Section */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {t("binder.reorderBinds", "Reorder Contents")} ({binds.length}{" "}
                {t("binder.items", "items")})
              </Typography>

              {binds.length === 0 ? (
                <Alert severity="info">
                  {t("binder.noBinds", "No items in this binder")}
                </Alert>
              ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "binder.dragToReorder",
                      "Drag and drop to reorder items. To add or remove items, use the Bind feature on item pages."
                    )}
                  </Alert>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="binds">
                      {(provided) => (
                        <List
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {binds.map((bind, index) => (
                            <Draggable
                              key={bind.id}
                              draggableId={bind.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <ListItem
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    mb: 1,
                                    bgcolor: snapshot.isDragging
                                      ? "action.hover"
                                      : "background.paper",
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    "&:hover": {
                                      bgcolor: "action.hover",
                                    },
                                  }}
                                >
                                  <DragIndicator
                                    sx={{ mr: 2, color: "text.secondary" }}
                                  />
                                  {bind.type === BindType.Binder ? (
                                    <FolderIcon
                                      sx={{ mr: 1, color: "primary.main" }}
                                    />
                                  ) : (
                                    <FileIcon
                                      sx={{ mr: 1, color: "text.secondary" }}
                                    />
                                  )}
                                  <MuiListItemText
                                    primary={bind.name}
                                    secondary={`#${index + 1} - ${
                                      bind.type === BindType.Binder
                                        ? t("binder.typeBinder", "Binder")
                                        : t("binder.typeItem", "Item")
                                    }`}
                                  />
                                </ListItem>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </List>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Paper>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={loading || isUploading}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                isProcessingImages || isUploading || loading || !name.trim()
              }
            >
              {isProcessingImages
                ? t("common.processingImages", "Processing...")
                : isUploading
                ? t("common.uploadingImages", "Uploading...")
                : loading
                ? t("common.updating", "Updating...")
                : t("common.save", "Save")}
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
          {t("binder.updateSuccess", "Binder updated successfully!")}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BinderForm;
