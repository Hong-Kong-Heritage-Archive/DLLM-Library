// src/components/SearchBar.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface SearchBarProps {
  loading?: boolean;
  error?: Error | null;
}

const TitleCacheKey = "itemIndexJsonUrl";

const SearchBar: React.FC<SearchBarProps> = ({
  loading = false,
  error = null,
}) => {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, string[]>>(
    {},
  );
  const [showSearchHints, setShowSearchHints] = useState(false);
  const navigate = useNavigate();

  // Close search hints when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        // Handle click outside logic here if needed
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function containsChinese(str: string): boolean {
    const chineseRegex = /\p{Script=Han}/u;
    return chineseRegex.test(str);
  }

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    let filtered: string[] = [];
    let itemsMap: Record<string, string[]> = {};
    value = value.trim();
    // either start to search when the user types more than 2 characters or
    // value with chinese characters
    if (value.length > 2 || containsChinese(value)) {
      // Get items from localStorage
      const cachedItems = localStorage.getItem(TitleCacheKey);
      if (cachedItems) {
        try {
          itemsMap = JSON.parse(cachedItems).index;
          const keys = Object.keys(itemsMap);
          // Filter items by title
          value = value.trim();
          if (keys.length > 0) {
            filtered = keys.filter((key) => {
              return (
                key.toLowerCase().includes(value.toLowerCase()) ||
                key.includes(value)
              );
            });
          }
        } catch (error) {
          console.error("Error parsing items from localStorage:", error);
          setSearchResults({});
        }
      }
    }
    if (filtered.length > 0) {
      let results: Record<string, string[]> = {};
      for (const result of filtered) {
        results[result] = itemsMap[result] || [];
      }
      setSearchResults(results); // Limit to top 5 results
      setShowSearchHints(true);
    } else {
      setSearchResults({});
      setShowSearchHints(false);
    }
  };

  // Handle search result selection
  const handleSelectSearchResult = (title: string, itemsId: string[]) => {
    setSearchQuery(title);
    setShowSearchHints(false);
    // Navigate to item details or search results page
    navigate(`/item/${itemsId[0]}`);
  };

  return (
    <Box ref={searchRef} sx={{ width: "100%", position: "relative" }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={t("home.searchPlaceholder", "Search items by title...")}
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        sx={{ mb: 1 }}
      />

      {loading && (
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid #ccc",
            borderRadius: 1,
            zIndex: 1000,
            mt: 0.5,
            p: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid #ccc",
            borderRadius: 1,
            zIndex: 1000,
            mt: 0.5,
          }}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {t("home.searchError", "Search error occurred")}
          </Alert>
        </Box>
      )}

      {showSearchHints && Object.keys(searchResults).length > 0 && (
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid #ccc",
            borderRadius: 1,
            zIndex: 1000,
            mt: 0.5,
          }}
        >
          {Object.keys(searchResults).map((key, index) => (
            <Box
              key={index}
              sx={{
                p: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => handleSelectSearchResult(key, searchResults[key])}
            >
              {key}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;
