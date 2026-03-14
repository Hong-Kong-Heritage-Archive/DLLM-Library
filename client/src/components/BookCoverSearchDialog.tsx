import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  CircularProgress,
  Typography,
  Alert,
  Box,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ImagePreview } from "../utils/imageUpload";

interface BookCoverResult {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string;
  publishedDate?: string;
}

interface BookCoverSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: ImagePreview) => void;
  isbn?: string;
  itemName?: string;
}

const MAX_RESULTS = 5;

/**
 * Pick the best available cover image URL from Google Books imageLinks.
 * Prefer larger images; fall back to thumbnail.
 */
function pickBestImageUrl(
  imageLinks: Record<string, string> | undefined,
): string | null {
  if (!imageLinks) return null;
  const preferred = [
    "extraLarge",
    "large",
    "medium",
    "small",
    "thumbnail",
    "smallThumbnail",
  ];
  for (const key of preferred) {
    if (imageLinks[key]) {
      // Always upgrade to HTTPS
      return imageLinks[key].replace(/^http:/, "https:");
    }
  }
  return null;
}

const BookCoverSearchDialog: React.FC<BookCoverSearchDialogProps> = ({
  open,
  onClose,
  onSelect,
  isbn,
  itemName,
}) => {
  const { t } = useTranslation();

  // Build initial search query: prefer ISBN, fall back to name
  const initialQuery = isbn ? `isbn:${isbn}` : itemName || "";
  console.log("Initial book cover search query:", initialQuery);
  console.log("ISBN:", isbn);
  console.log("Item Name:", itemName);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<BookCoverResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      if (initialQuery.length > 0) {
        setSearchQuery(initialQuery);
      }
      return;
    }
    setSearching(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      console.log("Performing book cover search with query:", searchQuery);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${MAX_RESULTS}&printType=books`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        setResults([]);
        setSearching(false);
        return;
      }

      const covers: BookCoverResult[] = [];
      for (const item of data.items) {
        const imageUrl = pickBestImageUrl(item.volumeInfo?.imageLinks);
        if (imageUrl) {
          covers.push({
            id: item.id,
            title: item.volumeInfo?.title || "",
            authors: item.volumeInfo?.authors || [],
            thumbnail: imageUrl,
            publishedDate: item.volumeInfo?.publishedDate,
          });
        }
        if (covers.length >= MAX_RESULTS) break;
      }

      setResults(covers);
    } catch (err) {
      console.error("Book cover search error:", err);
      setError(
        t("item.bookCoverSearchError", "Failed to search for book covers"),
      );
    } finally {
      setSearching(false);
    }
  }, [searchQuery, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  useEffect(() => {
    if (open) {
      setSearchQuery(initialQuery);
      setResults([]);
      setError(null);
      setHasSearched(false);
    }
  }, [open, initialQuery]);

  const handleSelectCover = (cover: BookCoverResult) => {
    // Use the Google Books URL directly as an external image.
    // No fetch needed – avoids CORS issues entirely.
    const imagePreview: ImagePreview = {
      url: cover.thumbnail,
      file: new File([], `book-cover-${cover.id}`),
      originalFile: new File([], `book-cover-${cover.id}`),
      width: 0,
      height: 0,
      size: 0,
      compressionApplied: false,
      finalQuality: 1,
      isExisting: true,
      gsUrl: cover.thumbnail,
    };
    onSelect(imagePreview);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("item.searchBookCover", "Search Book Cover")}
      </DialogTitle>
      <DialogContent>
        {/* Search input */}
        <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(
              "item.bookCoverSearchPlaceholder",
              "Enter ISBN or book title",
            )}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            disabled={searching}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            sx={{ minWidth: 80 }}
          >
            {searching ? (
              <CircularProgress size={24} />
            ) : (
              t("common.search", "Search")
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {hasSearched && results.length === 0 && !searching && (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 3 }}
          >
            {t("item.noCoverFound", "No book covers found")}
          </Typography>
        )}

        {results.length > 0 && (
          <Grid container spacing={2}>
            {results.map((cover) => (
              <Grid size={{ xs: 6, sm: 4 }} key={cover.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectCover(cover)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={cover.thumbnail}
                      alt={cover.title}
                      sx={{ objectFit: "contain", pt: 1 }}
                    />
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="caption"
                        component="div"
                        noWrap
                        title={cover.title}
                        sx={{ fontWeight: "bold" }}
                      >
                        {cover.title}
                      </Typography>
                      {cover.authors.length > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          component="div"
                          title={cover.authors.join(", ")}
                        >
                          {cover.authors.join(", ")}
                        </Typography>
                      )}
                      {cover.publishedDate && (
                        <Chip
                          label={cover.publishedDate}
                          size="small"
                          sx={{ mt: 0.5, fontSize: "0.65rem", height: 20 }}
                        />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookCoverSearchDialog;
