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
  Alert
} from "@mui/material";
import { CreateNewsPostMutation, CreateNewsPostMutationVariables } from "../generated/graphql"; // Assuming this path is correct

const CREATE_NEWS_MUTATION = gql`
mutation CreateNewsPost($title: String!, $content: String!, $images: [String!], $relatedItemIds: [ID!], $tags: [String!]) {
  createNewsPost(title: $title, content: $content, images: $images, relatedItemIds: $relatedItemIds, tags: $tags) {
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
`

interface NewsFormProps {
  onNewsCreated?: (data: CreateNewsPostMutation) => void; // Optional callback after successful creation
}

const NewsForm: React.FC<NewsFormProps> = ({ onNewsCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState(""); // Comma-separated string for simplicity
  const [relatedItemIds, setRelatedItemIds] = useState(""); // Comma-separated string
  const [tags, setTags] = useState(""); // Comma-separated string
  const [formError, setFormError] = useState<string | null>(null);

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
    setImages("");
    setRelatedItemIds("");
    setTags("");
    setFormError(null);
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

    const imagesArray = images.split(',').map(img => img.trim()).filter(img => img);
    const relatedItemIdsArray = relatedItemIds.split(',').map(id => id.trim()).filter(id => id);
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    try {
      const result = await createNewsPost({
        variables: {
          title,
          content,
          images: imagesArray,
          relatedItemIds: relatedItemIdsArray,
          tags: tagsArray,
        },
      });
      if (result.data && onNewsCreated) {
        onNewsCreated(result.data);
      }
      handleClose(); // Close dialog on success
    } catch (e) {
      // Error is handled by useMutation's error state
      console.error("Submission error:", e);
      setFormError("Failed to create news post. Please try again.");
    }
  };
  
  useEffect(() => {
    if (mutationError) {
      setFormError(`Error creating post: ${mutationError.message}`);
    }
  }, [mutationError]);


  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Create News Post
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Create New News Post</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
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
            <TextField
              margin="dense"
              id="images"
              label="Images (comma-separated URLs)"
              type="text"
              fullWidth
              variant="outlined"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              helperText="e.g., http://example.com/img1.png,http://example.com/img2.png"
            />
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
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button onClick={handleClose} color="secondary">Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? <CircularProgress size={24} /> : "Create Post"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NewsForm;
