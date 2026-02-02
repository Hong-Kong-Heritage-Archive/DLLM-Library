import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  Menu,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  MenuItem,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Done as DoneIcon,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
} from "@mui/icons-material";
import { batchProcessImages } from "../utils/ImageProcessor";
import { uploadImages, ImagePreview } from "../utils/imageUpload";
import { useApolloClient } from "@apollo/client";
import { useTranslation } from "react-i18next";

interface ReceiptImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (images: string[]) => void;
  loading: boolean;
}

const ReceiptImageUploadDialog: React.FC<ReceiptImageUploadDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();

  // Refs for file inputs
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [imageMenuAnchor, setImageMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image processing settings
  const maxImageSize = 1920;
  const imageQuality = 0.5;

  // Check if camera is available
  const isCameraAvailable = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
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

    setUploadError(null);
    setIsProcessingImages(true);
    setProcessingProgress(0);

    try {
      // Validate files first
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setUploadError(
            t("transactions.fileNotImage", { fileName: file.name })
          );
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          setUploadError(
            t("transactions.fileTooLarge", { fileName: file.name })
          );
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

      setImages((prev) => [...prev, ...newImagePreviews]);
    } catch (error) {
      console.error("Image processing error:", error);
      setUploadError(
        t("transactions.imageProcessingError", { error: String(error) })
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
    setImages((prev) => {
      const newFiles = [...prev];
      const removedImage = newFiles[index];
      URL.revokeObjectURL(removedImage.url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleConfirm = async () => {
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload images if any
      let uploadedImageUrls: string[] = [];

      if (images.length > 0) {
        uploadedImageUrls = await uploadImages(apolloClient, images, {
          folder: "receipts",
          onFileProgress: (fileIndex, progress) => {
            setImages((prev) =>
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
          },
          onFileComplete: (fileIndex, gsUrl) => {
            setImages((prev) =>
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
          },
          onOverallProgress: (percentage) => {
            setUploadProgress(percentage);
          },
          onError: (fileIndex, error) => {
            setImages((prev) =>
              prev.map((img, idx) =>
                idx === fileIndex
                  ? {
                      ...img,
                      isUploading: false,
                      uploadError: error,
                    }
                  : img
              )
            );
          },
        });
      }

      onConfirm(uploadedImageUrls);

      // Cleanup
      images.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
      setImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploadError(
        t("transactions.imageUploadError", "Failed to upload images")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!loading && !isUploading) {
      // Cleanup
      images.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
      setImages([]);
      setUploadError(null);
      setImageMenuAnchor(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "60vh" },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ImageIcon sx={{ mr: 1 }} />
          {t(
            "transactions.uploadReceiptImages",
            "Upload Item Condition Images"
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            {t(
              "transactions.receiptImagesInstructions",
              "Please upload photos of the item's condition upon receipt. These will serve as a record for the transaction."
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t(
              "transactions.receiptImagesOptional",
              "This step is optional, but recommended for documentation."
            )}
          </Typography>
        </Alert>

        {/* Upload Error */}
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}

        {/* Add Images Button */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleImageMenuClick}
            startIcon={<PhotoCamera />}
            endIcon={<ArrowDropDownIcon />}
            disabled={isProcessingImages || isUploading || loading}
            fullWidth
            size="large"
          >
            {t("transactions.addImages", "Add Images")}
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
                {t("transactions.selectFromGallery", "Select from Gallery")}
              </ListItemText>
            </MenuItem>

            {isCameraAvailable() && (
              <MenuItem onClick={handleTakePhoto}>
                <ListItemIcon>
                  <CameraAlt fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {t("transactions.takePhoto", "Take Photo")}
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
            capture="environment"
            onChange={handleCameraCapture}
          />
        </Box>

        {/* Processing Progress */}
        {isProcessingImages && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={processingProgress} />
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("transactions.processingImages", "Processing images...")}{" "}
                {processingProgress}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("transactions.uploadingImages", "Uploading images...")}{" "}
                {uploadProgress}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Image Preview Grid */}
        {images.length > 0 ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t("transactions.uploadedImages", "Uploaded Images")} (
              {images.length})
            </Typography>
            <Grid container spacing={2}>
              {images.map((image, index) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="120"
                      image={image.url}
                      alt={t("transactions.receiptImageAlt", {
                        index: index + 1,
                      })}
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
                        disabled={image.isUploading || isUploading || loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box
            sx={{
              border: 2,
              borderColor: "divider",
              borderStyle: "dashed",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: "background.default",
            }}
          >
            <ImageIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t(
                "transactions.noImagesYet",
                "No images uploaded yet. Click the button above to select images."
              )}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading || isUploading}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || isUploading || isProcessingImages}
          startIcon={
            loading || isUploading ? (
              <CircularProgress size={20} />
            ) : (
              <DoneIcon />
            )
          }
        >
          {isProcessingImages
            ? t("transactions.processingImages", "Processing...")
            : isUploading
            ? t("transactions.uploadingImages", "Uploading...")
            : loading
            ? t("transactions.confirming", "Confirming...")
            : images.length > 0
            ? t(
                "transactions.confirmWithImages",
                "Confirm with {{count}} image(s)",
                { count: images.length }
              )
            : t("transactions.confirmWithoutImages", "Confirm without images")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptImageUploadDialog;
