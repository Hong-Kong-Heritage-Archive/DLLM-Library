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
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  Delete,
  PhotoCamera,
  PhotoLibrary,
  CameraAlt,
  ExpandMore as ArrowDropDownIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Visibility,
} from "@mui/icons-material";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Item } from "../generated/graphql";
import { batchProcessImages, ProcessedImage } from "../utils/ImageProcessor";
import {
  uploadImages,
  ImagePreview,
  separateExistingAndNewImages,
  combineImageUrls,
} from "../utils/imageUpload";

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

interface NewsFormProps {
  open: boolean;
  onClose: () => void;
  relatedItem?: Item | null;
  newsPost?: any;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
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
  const [contentTab, setContentTab] = useState(0); // 0 = Edit, 1 = Preview
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
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
      const { existing: existingImages, new: newImages } =
        separateExistingAndNewImages(imageFiles);

      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        const uploadStartIndex = imageFiles.findIndex((p) => !p.isExisting);
        newImageUrls = await uploadImages(apolloClient, newImages, {
          folder: "news",
          onFileProgress: (fileIndex, progress) => {
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
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
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
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
            setImageFiles((prev) =>
              prev.map((img, idx) =>
                idx === uploadStartIndex + fileIndex
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

      const allImageUrls = combineImageUrls(existingImages, newImageUrls);

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

  const handleContentTabChange = (
    _: React.SyntheticEvent,
    newValue: number
  ) => {
    setContentTab(newValue);
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
              disabled={isProcessingImages || isUploading}
            />

            {/* Content with Markdown Support */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={contentTab} onChange={handleContentTabChange}>
                  <Tab
                    icon={<EditIcon />}
                    iconPosition="start"
                    label={t("news.edit", "Edit")}
                  />
                  <Tab
                    icon={<Visibility />}
                    iconPosition="start"
                    label={t("news.preview", "Preview")}
                  />
                </Tabs>
              </Box>

              <TabPanel value={contentTab} index={0}>
                <TextField
                  label={t("news.content", "Content")}
                  placeholder={t(
                    "news.markdownSupported",
                    "Markdown is supported. Use **bold**, *italic*, [links](url), # headers, etc."
                  )}
                  fullWidth
                  multiline
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  disabled={isProcessingImages || isUploading}
                  helperText={t(
                    "news.markdownHelp",
                    "Supports Markdown formatting"
                  )}
                />

                {/* Markdown Quick Reference */}
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="caption" component="div">
                    <strong>
                      {t("news.markdownQuickRef", "Markdown Quick Reference")}:
                    </strong>
                    <br />
                    **{t("news.bold", "bold")}** | *{t("news.italic", "italic")}
                    * | # {t("news.heading", "Heading")} | [
                    {t("news.link", "link")}](url) | - {t("news.list", "list")}{" "}
                    | `{t("news.code", "code")}`
                  </Typography>
                </Alert>
              </TabPanel>

              <TabPanel value={contentTab} index={1}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    minHeight: 300,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    "& h1": {
                      fontSize: "2rem",
                      fontWeight: "bold",
                      mt: 3,
                      mb: 2,
                    },
                    "& h2": {
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      mt: 2.5,
                      mb: 1.5,
                    },
                    "& h3": {
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      mt: 2,
                      mb: 1,
                    },
                    "& h4": {
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      mt: 1.5,
                      mb: 1,
                    },
                    "& p": { mb: 1.5, lineHeight: 1.7 },
                    "& ul, & ol": { pl: 3, mb: 1.5 },
                    "& li": { mb: 0.5 },
                    "& pre": {
                      bgcolor: "grey.100",
                      p: 2,
                      borderRadius: 1,
                      overflow: "auto",
                      mb: 2,
                      border: 1,
                      borderColor: "divider",
                    },
                    "& code": {
                      bgcolor: "grey.100",
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: "0.875em",
                      fontFamily: "monospace",
                    },
                    "& pre code": {
                      bgcolor: "transparent",
                      px: 0,
                      py: 0,
                    },
                    "& blockquote": {
                      borderLeft: 4,
                      borderColor: "primary.main",
                      pl: 2,
                      ml: 0,
                      my: 2,
                      color: "text.secondary",
                      fontStyle: "italic",
                      bgcolor: "action.hover",
                      py: 1,
                      borderRadius: 0.5,
                    },
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    },
                    "& img": {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 1,
                      my: 2,
                    },
                    "& table": {
                      borderCollapse: "collapse",
                      width: "100%",
                      mb: 2,
                    },
                    "& th, & td": {
                      border: 1,
                      borderColor: "divider",
                      p: 1.5,
                      textAlign: "left",
                    },
                    "& th": {
                      bgcolor: "grey.100",
                      fontWeight: "bold",
                    },
                    "& hr": {
                      my: 3,
                      border: "none",
                      borderTop: 1,
                      borderColor: "divider",
                    },
                  }}
                >
                  {content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">
                      {t(
                        "news.previewEmpty",
                        "Preview will appear here as you type..."
                      )}
                    </Typography>
                  )}
                </Paper>
              </TabPanel>
            </Box>

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
