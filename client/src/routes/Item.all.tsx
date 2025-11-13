import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Container,
  SelectChangeEvent,
  IconButton,
  TextField,
  Grid,
  Chip,
  FormHelperText
} from "@mui/material";
import {
  ArrowBack,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { User, Item } from "../generated/graphql";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ItemSummary from "../components/ItemSummary";
import { calculateDistance } from "../utils/geoProcessor";
import { useNavigate } from "react-router";
import PaginationControls from "../components/PaginationControls";

const ITEMS_QUERY = gql`
  query ItemsByLocation(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Float!
    $category: [String!]
    $keyword: String
    $limit: Int
    $offset: Int
  ) {
    itemsByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
      category: $category
      keyword: $keyword
      limit: $limit
      offset: $offset
    ) {
      id
      name
      description
      condition
      status
      location {
        latitude
        longitude
      }
      images
      thumbnails
      category
      publishedYear
      language
    }
  }
`;

const ITEMS_COUNT_QUERY = gql`
  query TotalItemsCountByLocation(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Float!
    $category: [String!]
    $keyword: String
  ) {
    totalItemsCountByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
      category: $category
      keyword: $keyword
    )
  }
`;

const HotCategoriesQuery = gql`
  query HotCategories($limit: Int!) {
    hotCategories(limit: $limit)
  }
`;

const DefaultCategoriesQuery = gql`
  query DefaultCategories {
    defaultCategories
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

const ITEMS_PER_PAGE = 10;
const SEARCH_RADIUS_KM = 30; // Increased radius for better search results

const ItemAllPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Query for hot categories
  const { data: hotCategoriesData, loading: categoriesLoading } = useQuery<{
    hotCategories: string[];
  }>(HotCategoriesQuery, {
    variables: { limit: 15 },
  });

  // Query for default categories as fallback
  const { data: defaultCategoriesData } = useQuery<{
    defaultCategories: string[];
  }>(DefaultCategoriesQuery);

  // Combine categories from both queries
  const availableCategories = [
    ...(hotCategoriesData?.hotCategories || []),
    ...(defaultCategoriesData?.defaultCategories || []),
  ].filter((category, index, self) => self.indexOf(category) === index); // Remove duplicates

  // Query for items by location with search
  const {
    data: itemsData,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery<{ itemsByLocation: Item[] }>(ITEMS_QUERY, {
    variables:
      location && hasSearched
        ? {
          ...location,
          radiusKm: SEARCH_RADIUS_KM,
          category: selectedCategory ? [selectedCategory] : null,
          keyword: searchKeyword || null,
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        }
        : undefined,
    skip: !location || !hasSearched,
  });

  const { data: totalItemsData, loading: totalItemsLoading } = useQuery<{
    totalItemsCountByLocation: number;
  }>(ITEMS_COUNT_QUERY, {
    variables:
      location && hasSearched
        ? {
          ...location,
          radiusKm: SEARCH_RADIUS_KM,
          category: selectedCategory ? [selectedCategory] : undefined,
          keyword: searchKeyword || null,
        }
        : undefined,
    skip: !location || !hasSearched,
  });

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
    setPage(1); // Reset to page 1 when category changes
  };

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const handleSearch = () => {
    if (keyword.trim().length === 0 && selectedCategory === "") {
      return; // Don't search if keyword is empty
    }
    setSearchKeyword(keyword.trim());
    setPage(1); // Reset to page 1 when searching
    setHasSearched(true);
  };

  const handleClearSearch = () => {
    setKeyword("");
    setSearchKeyword("");
    setSelectedCategory("");
    setPage(1);
    setHasSearched(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getLocation = () => {
    setLocationError(null);

    if (user?.location?.latitude && user?.location?.longitude) {
      setLocation({
        latitude: user.location.latitude,
        longitude: user.location.longitude,
      });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError(
            t(
              "itemsAll.locationError",
              "Failed to get your location. Please enable location services and try again."
            )
          );
        }
      );
    }
  };

  // Auto-load location when component mounts
  useEffect(() => {
    getLocation();
  }, [user]);

  // Refetch items when search parameters, page, or location changes
  useEffect(() => {
    if (location && hasSearched) {
      refetchItems();
    }
  }, [
    selectedCategory,
    page,
    searchKeyword,
    refetchItems,
    location,
    hasSearched,
  ]);

  const canSearch =
    keyword.trim().length > 0 ||
    (selectedCategory !== null && selectedCategory !== "");
  const isSearchActive = hasSearched && searchKeyword.length > 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/")} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          {t("itemsAll.title", "Search Items")}
        </Typography>
      </Box>

      {/* Location Status */}
      <Box sx={{ mb: 3 }}>
        {!location && (
          <Button
            variant="contained"
            onClick={getLocation}
            disabled={itemsLoading || totalItemsLoading}
            sx={{ mb: 2 }}
          >
            {t("itemsAll.getLocation", "Get My Location")}
          </Button>
        )}

        {locationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {locationError}
          </Alert>
        )}

        {location && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t(
              "itemsAll.locationReady",
              "Location ready. You can now search for items within {{radius}}km.",
              {
                radius: SEARCH_RADIUS_KM,
              }
            )}
          </Alert>
        )}
      </Box>

      {/* Search Form */}
      {location && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="end">
            {/* Keyword Search */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t("itemsAll.searchKeyword", "Search by keyword")}
                placeholder={t(
                  "itemsAll.keywordPlaceholder",
                  "Enter book title, author, or description..."
                )}
                value={keyword}
                onChange={handleKeywordChange}
                disabled={itemsLoading || totalItemsLoading}
                helperText={t(
                  "itemsAll.keywordRequired",
                  "Keyword is required to search"
                )}
                error={keyword.length === 0 && hasSearched}
                InputProps={{
                  endAdornment: keyword && (
                    <IconButton
                      size="small"
                      onClick={() => setKeyword("")}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            {/* Category Filter */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel id="category-select-label">
                  {t("itemsAll.selectCategory", "Category (Optional)")}
                </InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={selectedCategory}
                  label={t("itemsAll.selectCategory", "Category (Optional)")}
                  onChange={handleCategoryChange}
                  disabled={
                    categoriesLoading || itemsLoading || totalItemsLoading
                  }
                >
                  <MenuItem value="">
                    <em>{t("itemsAll.allCategories", "All Categories")}</em>
                  </MenuItem>
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>&nbsp;</FormHelperText>
              </FormControl>
            </Grid>

            {/* Search Button */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSearch}
                disabled={!canSearch || itemsLoading || totalItemsLoading}
                startIcon={
                  itemsLoading || totalItemsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SearchIcon />
                  )
                }
                sx={{ height: "56px" }}
              >
                {itemsLoading || totalItemsLoading
                  ? t("common.searching", "Searching...")
                  : t("common.search", "Search")}
              </Button>
              <FormHelperText>&nbsp;</FormHelperText>
            </Grid>
          </Grid>

          {categoriesLoading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t("itemsAll.loadingCategories", "Loading categories...")}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Active Search Filters */}
      {isSearchActive && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("itemsAll.activeFilters", "Active filters:")}
            </Typography>
            <Chip
              label={`"${searchKeyword}"`}
              onDelete={() => setSearchKeyword("")}
              color="primary"
              size="small"
            />
            {selectedCategory && (
              <Chip
                label={selectedCategory}
                onDelete={() => setSelectedCategory("")}
                color="secondary"
                size="small"
              />
            )}
            <Button
              size="small"
              onClick={handleClearSearch}
              startIcon={<ClearIcon />}
            >
              {t("common.clearAll", "Clear All")}
            </Button>
          </Box>
        </Box>
      )}

      {/* Search Results */}
      {location && hasSearched && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedCategory
              ? t(
                "itemsAll.searchResultsWithCategory",
                'Search results for "{{keyword}}" in {{category}}',
                {
                  keyword: searchKeyword,
                  category: selectedCategory,
                }
              )
              : t(
                "itemsAll.searchResults",
                'Search results for "{{keyword}}"',
                {
                  keyword: searchKeyword,
                }
              )}
          </Typography>

          {itemsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("itemsAll.itemsError", "Error loading items")}:{" "}
              {itemsError.message}
            </Alert>
          )}

          {itemsData?.itemsByLocation && (
            <>
              {itemsData.itemsByLocation.length === 0 ? (
                <Alert severity="info">
                  {selectedCategory
                    ? t(
                      "itemsAll.noSearchResultsWithCategory",
                      'No items found for "{{keyword}}" in {{category}} within {{radius}}km.',
                      {
                        keyword: searchKeyword,
                        category: selectedCategory,
                        radius: SEARCH_RADIUS_KM,
                      }
                    )
                    : t(
                      "itemsAll.noSearchResults",
                      'No items found for "{{keyword}}" within {{radius}}km.',
                      {
                        keyword: searchKeyword,
                        radius: SEARCH_RADIUS_KM,
                      }
                    )}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {t("itemsAll.searchTips", "Try:")}
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                      <li>
                        {t("itemsAll.searchTip1", "Using different keywords")}
                      </li>
                      <li>
                        {t(
                          "itemsAll.searchTip2",
                          "Removing the category filter"
                        )}
                      </li>
                      <li>
                        {t(
                          "itemsAll.searchTip3",
                          "Checking for spelling mistakes"
                        )}
                      </li>
                    </Typography>
                  </Box>
                </Alert>
              ) : (
                <>
                  {/* Results Summary */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("itemsAll.resultsFound", "Found {{count}} item(s)", {
                      count: itemsData.itemsByLocation.length,
                    })}
                    {itemsData.itemsByLocation.length === ITEMS_PER_PAGE &&
                      t(
                        "itemsAll.moreResultsAvailable",
                        " (more results may be available)"
                      )}
                  </Typography>

                  {/* Results List */}
                  {itemsData.itemsByLocation.map((item) => (
                    <ItemSummary
                      key={item.id}
                      item={{
                        id: item.id,
                        name: item.name,
                        distance:
                          item.location && location
                            ? calculateDistance(
                              item.location.latitude,
                              item.location.longitude,
                              location.latitude,
                              location.longitude
                            )
                            : 0,
                        status: item.status,
                        images: item.images,
                        tags: item.category,
                      }}
                      onClick={handleItemClick}
                    />
                  ))}

                  {/* Pagination Controls */}
                  <PaginationControls
                    currentPage={page}
                    onPageChange={handlePageChange}
                    hasNextPage={
                      itemsData.itemsByLocation.length === ITEMS_PER_PAGE
                    }
                    totalItems={totalItemsData?.totalItemsCountByLocation}
                    hasPrevPage={page > 1}
                    isLoading={itemsLoading || totalItemsLoading}
                    itemsPerPage={ITEMS_PER_PAGE}
                    showPageInfo={true}
                  />
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Initial State - No Search Yet */}
      {location && !hasSearched && (
        <Alert severity="info">
          {t(
            "itemsAll.instructionsSearch",
            "Enter a keyword to search for items within {{radius}}km of your location. You can optionally select a category to narrow down your search.",
            { radius: SEARCH_RADIUS_KM }
          )}
        </Alert>
      )}

      {!location && !locationError && (
        <Alert severity="info">
          {t(
            "itemsAll.needLocation",
            "Please enable location services to search for nearby items."
          )}
        </Alert>
      )}
    </Container>
  );
};

export default ItemAllPage;
