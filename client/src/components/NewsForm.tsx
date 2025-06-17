import React, { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
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
} from "@mui/material";
import { CloudUpload, Delete, PhotoCamera } from "@mui/icons-material";
import {
  CreateNewsPostMutation,
  CreateNewsPostMutationVariables,
} from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

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
}

interface ImagePreview {
  file: File;
  url: string;
  base64: string;
}

const NewsForm: React.FC<NewsFormProps> = ({ onNewsCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [relatedItemIds, setRelatedItemIds] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [createNewsPost, { data, loading, error: mutationError }] = useMutation<
    CreateNewsPostMutation,
    CreateNewsPostMutationVariables
  >(CREATE_NEWS_MUTATION);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form fields and errors on close
    setTitle("");
    setContent("");
    setImageFiles([]);
    setRelatedItemIds("");
    setTags("");
    setFormError(null);
    setUploadProgress(false);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file selection
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormError(`File ${file.name} is not an image`);
        continue;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setFormError(`File ${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);

        newImages.push({
          file,
          url,
          base64,
        });
      } catch (error) {
        setFormError(`Error processing file ${file.name}`);
      }
    }

    setImageFiles((prev) => [...prev, ...newImages]);
    // Clear the input value so the same file can be selected again
    event.target.value = "";
  };

  // Remove image from preview
  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const newFiles = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Upload images to your server/cloud storage
  const uploadImages = async (images: ImagePreview[]): Promise<string[]> => {
    // This is a placeholder function. You'll need to implement actual upload logic
    // depending on your backend (e.g., upload to AWS S3, Firebase Storage, etc.)
    // TODO: Implement your upload logic here

    const uploadedUrls: string[] = [];

    for (const image of images) {
      try {
        // Example: Upload to your backend
        const formData = new FormData();
        formData.append("image", image.file);

        // Replace this with your actual upload endpoint
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        uploadedUrls.push(result.url);

        // Alternative: For demo purposes, you could use the base64 data
        // uploadedUrls.push(image.base64);
      } catch (error) {
        console.error("Upload error:", error);
        throw new Error(`Failed to upload ${image.file.name}`);
      }
    }

    return uploadedUrls;
  };

  const validateForm = () => {
    if (!title.trim()) {
      setFormError("Title is required.");
      return false;
    }
    if (!content.trim()) {
      setFormError("Content is required.");
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
      setUploadProgress(true);

      // Upload images and get URLs
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
      }

      const relatedItemIdsArray = relatedItemIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const result = await createNewsPost({
        variables: {
          title,
          content,
          images: imageUrls,
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
      setFormError("Failed to create news post. Please try again.");
    } finally {
      setUploadProgress(false);
    }
  };

  useEffect(() => {
    if (mutationError) {
      setFormError(`Error creating post: ${mutationError.message}`);
    }
  }, [mutationError]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imageFiles.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        {t("news.create")}
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Create New News Post</DialogTitle>
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
              label="Title"
              type="text"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              error={formError?.includes("Title")}
            />

            <TextField
              margin="dense"
              id="content"
              label="Content"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              error={formError?.includes("Content")}
            />

            {/* Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Images
              </Typography>

              {/* Upload Button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{ mb: 2 }}
              >
                Add Images
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
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />
                        <IconButton
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                            },
                            size: "small",
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            left: 4,
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                          }}
                        >
                          {image.file.name.length > 15
                            ? `${image.file.name.substring(0, 12)}...`
                            : image.file.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <TextField
              margin="dense"
              id="relatedItemIds"
              label="Related Item IDs (comma-separated)"
              type="text"
              fullWidth
              variant="outlined"
              value={relatedItemIds}
              onChange={(e) => setRelatedItemIds(e.target.value)}
              helperText="e.g., itemID1,itemID2"
            />

            <TextField
              margin="dense"
              id="tags"
              label="Tags (comma-separated)"
              type="text"
              fullWidth
              variant="outlined"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              helperText="e.g., announcement,update"
            />
          </DialogContent>

          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading || uploadProgress || !title.trim() || !content.trim()
              }
            >
              {loading || uploadProgress ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {uploadProgress ? "Uploading..." : "Creating..."}
                </Box>
              ) : (
                "Create Post"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NewsForm;
