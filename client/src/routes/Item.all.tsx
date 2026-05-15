import React, { useState, useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  TextField,
  Grid,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { User, Item, CategoryMap } from "../generated/graphql";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ItemPreview from "../components/ItemPreview";
import { calculateDistance } from "../utils/geoProcessor";
import { useNavigate } from "react-router";
import PaginationControls from "../components/PaginationControls";
import { translateCategory } from "../utils/categoryTranslation";

const ITEMS_QUERY = gql`
  query ItemsByLocation(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Float!
    $classifications: [String!]
    $category: [String!]
    $keyword: String
    $limit: Int
    $offset: Int
  ) {
    itemsByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
      classifications: $classifications
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
      clssfctns
      publishedYear
      language
      createdAt
    }
  }
`;

const ITEMS_COUNT_QUERY = gql`
  query TotalItemsCountByLocation(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Float!
    $classifications: [String!]
    $category: [String!]
    $keyword: String
  ) {
    totalItemsCountByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
      classifications: $classifications
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

const GET_ITEM_CONFIG = gql`
  query GetItemConfig {
    itemConfig {
      defaultCategoryTrees
      categoryMaps {
        language
        value
      }
    }
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

const ITEMS_PER_PAGE = 12;
const SEARCH_RADIUS_OPTIONS = [1, 5, 10, 25, 50];
const DEFAULT_SEARCH_RADIUS_KM = 10;

type FilterType = "none" | "keyword" | "category" | "classification";

const ItemAllPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get category from URL parameters
  const categoryFromUrl = searchParams.get("category") || "";

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // NEW: Active filter type with radio button control
  const [activeFilterType, setActiveFilterType] = useState<FilterType>("none");

  const [selectedCategory, setSelectedCategory] =
    useState<string>(categoryFromUrl);
  const [categoryInput, setCategoryInput] = useState<string>(categoryFromUrl);
  const [keyword, setKeyword] = useState<string>("");
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(
    DEFAULT_SEARCH_RADIUS_KM,
  );
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Classification filter state
  const [selectedClassification, setSelectedClassification] =
    useState<string>("");

  // Query for hot categories (for autocomplete suggestions)
  const { data: hotCategoriesData, loading: categoriesLoading } = useQuery<{
    hotCategories: string[];
  }>(HotCategoriesQuery, {
    variables: { limit: 15 },
    fetchPolicy: "cache-first",
  });

  // Query for default categories as fallback
  const { data: defaultCategoriesData } = useQuery<{
    defaultCategories: string[];
  }>(DefaultCategoriesQuery, { fetchPolicy: "cache-first" });

  // Query for item config (for classification trees)
  const { data: configData, loading: configLoading } = useQuery<{
    itemConfig: {
      defaultCategoryTrees: string[];
      categoryMaps: CategoryMap[][];
    };
  }>(GET_ITEM_CONFIG, { fetchPolicy: "cache-first" });

  // Combine categories from both queries for autocomplete suggestions
  const availableCategories = [
    ...(hotCategoriesData?.hotCategories || []),
    ...(defaultCategoriesData?.defaultCategories || []),
  ].filter((category, index, self) => self.indexOf(category) === index);

  // Query for items by location with search - ONLY when filter is active
  const {
    data: itemsData,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery<{ itemsByLocation: Item[] }>(ITEMS_QUERY, {
    variables:
      location && hasSearched && activeFilterType !== "none"
        ? {
          ...location,
          radiusKm: searchRadiusKm,
          classifications:
            activeFilterType === "classification" && selectedClassification
              ? [selectedClassification]
              : null,
          category:
            activeFilterType === "category" && selectedCategory
              ? [selectedCategory]
              : null,
          keyword:
            activeFilterType === "keyword" && searchKeyword
              ? searchKeyword
              : null,
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        }
        : undefined,
    skip: !location || !hasSearched || activeFilterType === "none",
  });

  const { data: totalItemsData, loading: totalItemsLoading } = useQuery<{
    totalItemsCountByLocation: number;
  }>(ITEMS_COUNT_QUERY, {
    variables:
      location && hasSearched && activeFilterType !== "none"
        ? {
          ...location,
          radiusKm: searchRadiusKm,
          classifications:
            activeFilterType === "classification" && selectedClassification
              ? [selectedClassification]
              : null,
          category:
            activeFilterType === "category" && selectedCategory
              ? [selectedCategory]
              : null,
          keyword:
            activeFilterType === "keyword" && searchKeyword
              ? searchKeyword
              : null,
        }
        : undefined,
    skip: !location || !hasSearched || activeFilterType === "none",
  });

  // Get classification options from defaultCategoryTrees
  const classificationOptions = useMemo(() => {
    if (!configData?.itemConfig?.defaultCategoryTrees) return [];
    return [...new Set(configData.itemConfig.defaultCategoryTrees)];
  }, [configData]);

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleCategoryChange = (
    _: React.SyntheticEvent,
    value: string | null,
  ) => {
    const newCategory = value || "";
    setCategoryInput(newCategory);
    setPage(1);
  };

  const handleCategoryInputChange = (
    _: React.SyntheticEvent,
    value: string,
  ) => {
    setCategoryInput(value);
  };

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  // NEW: Determine which filter type user wants to use
  const determineFilterType = (): FilterType => {
    if (keyword.trim().length > 0) return "keyword";
    if (categoryInput.trim().length > 0) return "category";
    if (selectedClassification) return "classification";
    return "none";
  };

  // Handle filter type change (radio button)
  const handleFilterTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newType = event.target.value as FilterType;
    setActiveFilterType(newType);

    // Clear all filters when switching
    if (newType !== "keyword") {
      setKeyword("");
      setSearchKeyword("");
    }
    if (newType !== "category") {
      setSelectedCategory("");
      setCategoryInput("");
    }
    if (newType !== "classification") {
      setSelectedClassification("");
    }

    // Reset search state
    setHasSearched(false);
    setPage(1);
  };

  const handleSearch = () => {
    // Don't search if no filter is active or filter is empty
    if (activeFilterType === "none") {
      return;
    }

    // Validate filter has content
    if (activeFilterType === "keyword" && !keyword.trim()) {
      return;
    }
    if (activeFilterType === "category" && !categoryInput.trim()) {
      return;
    }
    if (activeFilterType === "classification" && !selectedClassification) {
      return;
    }

    // Set search values
    if (activeFilterType === "keyword") {
      setSearchKeyword(keyword.trim());
    } else if (activeFilterType === "category") {
      setSelectedCategory(categoryInput.trim());
    }

    setPage(1);
    setHasSearched(true);

    // Update URL parameters
    if (activeFilterType === "category" && categoryInput.trim()) {
      searchParams.set("category", categoryInput.trim());
    } else {
      searchParams.delete("category");
    }
    setSearchParams(searchParams);
  };

  const handleClearSearch = () => {
    setKeyword("");
    setSearchKeyword("");
    setSelectedCategory("");
    setCategoryInput("");
    setSelectedClassification("");
    setPage(1);
    setHasSearched(false);
    setActiveFilterType("none");

    // Clear URL parameters
    searchParams.delete("category");
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              "Failed to get your location. Please enable location services and try again.",
            ),
          );
        },
      );
    }
  };

  // Auto-load location when component mounts
  useEffect(() => {
    getLocation();
  }, [user]);

  // Auto-search when category from URL is present and location is ready
  useEffect(() => {
    if (location && categoryFromUrl && !hasSearched) {
      setSelectedCategory(categoryFromUrl);
      setCategoryInput(categoryFromUrl);
      setActiveFilterType("category");
      setHasSearched(true);
    }
  }, [location, categoryFromUrl, hasSearched]);

  // Refetch items when search parameters, page, or location changes
  useEffect(() => {
    if (location && hasSearched && activeFilterType !== "none") {
      refetchItems();
    }
  }, [
    activeFilterType,
    selectedCategory,
    selectedClassification,
    page,
    searchKeyword,
    refetchItems,
    location,
    hasSearched,
    searchRadiusKm,
  ]);

  // Check if search can be performed
  const canSearch = (() => {
    if (activeFilterType === "none") return false;
    if (activeFilterType === "keyword") return keyword.trim().length > 0;
    if (activeFilterType === "category") return categoryInput.trim().length > 0;
    if (activeFilterType === "classification") return !!selectedClassification;
    return false;
  })();

  const isSearchActive = hasSearched && activeFilterType !== "none";

  // Calculate distances for items
  const itemsWithDistance =
    itemsData?.itemsByLocation.map((item) => ({
      ...item,
      distance:
        item.location && location
          ? calculateDistance(
            item.location.latitude,
            item.location.longitude,
            location.latitude,
            location.longitude,
          )
          : 0,
    })) || [];

  // Get active filter label for display
  const getActiveFilterLabel = (): string => {
    switch (activeFilterType) {
      case "keyword":
        return t("itemsAll.filterTypeKeyword", "Keyword");
      case "category":
        return t("itemsAll.filterTypeCategory", "Category");
      case "classification":
        return t("itemsAll.filterTypeClassification", "Classification");
      default:
        return "";
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header - Sticky */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", py: 2 }}>
            <IconButton onClick={() => navigate("/")} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: "bold" }}>
              {t("itemsAll.title", "Search Items")}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Alert severity="success" sx={{ flex: 1 }}>
                {t(
                  "itemsAll.locationReady",
                  "Location ready. You can now search for items within {{radius}}km.",
                  {
                    radius: searchRadiusKm,
                  },
                )}
              </Alert>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>{t("itemsAll.searchRadius", "Radius")}</InputLabel>
                <Select
                  value={searchRadiusKm}
                  label={t("itemsAll.searchRadius", "Radius")}
                  onChange={(e: SelectChangeEvent<number>) => {
                    setSearchRadiusKm(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {SEARCH_RADIUS_OPTIONS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r} km
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        {/* Search Form */}
        {location && (
          <Card elevation={2} sx={{ mb: 4 }}>
            <CardContent>
              {/* Filter Type Selection - Radio Buttons */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {t(
                      "itemsAll.selectFilterType",
                      "Select Search Filter Type",
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(
                      "itemsAll.filterTypeInfo",
                      "Choose one filter type to search. Only one filter can be active at a time.",
                    )}
                  </Typography>
                </FormLabel>
                <RadioGroup
                  row
                  value={activeFilterType}
                  onChange={handleFilterTypeChange}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel
                    value="keyword"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t("itemsAll.filterTypeKeyword", "Keyword")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(
                            "itemsAll.keywordFilterDesc",
                            "Search by title, author, description",
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="category"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t("itemsAll.filterTypeCategory", "Category")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(
                            "itemsAll.categoryFilterDesc",
                            "Browse by category",
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="classification"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t(
                            "itemsAll.filterTypeClassification",
                            "Classification",
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(
                            "itemsAll.classificationFilterDesc",
                            "Filter by taxonomy path",
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Filter Input - Show only selected type */}
              {activeFilterType !== "none" && (
                <Box sx={{ mb: 2 }}>
                  {/* Keyword Search */}
                  {activeFilterType === "keyword" && (
                    <TextField
                      fullWidth
                      label={t("itemsAll.searchKeyword", "Search by keyword")}
                      placeholder={t(
                        "itemsAll.keywordPlaceholder",
                        "Enter book title, author, or description...",
                      )}
                      value={keyword}
                      onChange={handleKeywordChange}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && canSearch) {
                          handleSearch();
                        }
                      }}
                      disabled={itemsLoading || totalItemsLoading}
                      helperText={t(
                        "itemsAll.keywordHelper",
                        "Search by item title, author, or description",
                      )}
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
                  )}

                  {/* Category Search */}
                  {activeFilterType === "category" && (
                    <Autocomplete
                      freeSolo
                      options={availableCategories}
                      value={categoryInput}
                      onChange={handleCategoryChange}
                      onInputChange={handleCategoryInputChange}
                      disabled={
                        categoriesLoading || itemsLoading || totalItemsLoading
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("itemsAll.selectCategory", "Category")}
                          placeholder={t(
                            "itemsAll.categoryPlaceholder",
                            "Type or select category...",
                          )}
                          helperText={t(
                            "itemsAll.categoryHelper",
                            "Search by a specific category",
                          )}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && canSearch) {
                              handleSearch();
                            }
                          }}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {categoriesLoading ? (
                                  <CircularProgress size={20} />
                                ) : null}
                                {categoryInput && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setCategoryInput("");
                                      setSelectedCategory("");
                                    }}
                                    edge="end"
                                  >
                                    <ClearIcon />
                                  </IconButton>
                                )}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}

                  {/* Classification Search */}
                  {activeFilterType === "classification" && (
                    <FormControl fullWidth>
                      <InputLabel>
                        {t(
                          "itemsAll.filterByClassification",
                          "Filter by Classification",
                        )}
                      </InputLabel>
                      <Select
                        value={selectedClassification}
                        label={t(
                          "itemsAll.filterByClassification",
                          "Filter by Classification",
                        )}
                        onChange={(e: SelectChangeEvent) => {
                          setSelectedClassification(e.target.value);
                        }}
                        disabled={configLoading}
                      >
                        <MenuItem value="">
                          <em>{t("common.selectOption", "Select...")}</em>
                        </MenuItem>
                        {configData?.itemConfig?.categoryMaps.map(
                          (langOptions) =>
                            langOptions.map((langOption) => {
                              if (langOption.language === "en") {
                                return (
                                  <MenuItem
                                    key={langOption.value}
                                    value={langOption.value}
                                  >
                                    {translateCategory(
                                      langOption.value,
                                      configData?.itemConfig?.categoryMaps,
                                      i18n.language,
                                    )}
                                  </MenuItem>
                                );
                              }
                              return null;
                            }),
                        )
                          /*classificationOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option
                                .split("/")
                                .map((part) =>
                                  translateCategory(
                                    part,
                                    configData?.itemConfig?.categoryMaps,
                                    i18n.language,
                                  ),
                                )
                                .join(" → ")}
                            </MenuItem>
                          ))*/
                        }
                      </Select>
                    </FormControl>
                  )}
                </Box>
              )}

              {/* Search Button */}
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
              >
                {itemsLoading || totalItemsLoading
                  ? t("common.searching", "Searching...")
                  : t("common.search", "Search")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Search Filters - Compact Display */}
        {isSearchActive && (
          <Box sx={{ mb: 3 }}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {t("itemsAll.activeFilter", "Active Filter")}:
                </Typography>
                <Chip
                  label={getActiveFilterLabel()}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("itemsAll.filterValue", "Filter Value")}:
                </Typography>
                {activeFilterType === "keyword" && searchKeyword && (
                  <Chip label={`"${searchKeyword}"`} size="small" />
                )}
                {activeFilterType === "category" && selectedCategory && (
                  <Chip label={selectedCategory} size="small" />
                )}
                {activeFilterType === "classification" &&
                  selectedClassification && (
                    <Chip
                      label={selectedClassification
                        .split("/")
                        .map((part) =>
                          translateCategory(
                            part,
                            configData?.itemConfig?.categoryMaps,
                            i18n.language,
                          ),
                        )
                        .join(" → ")}
                      size="small"
                    />
                  )}
              </Box>
              <Button
                size="small"
                onClick={handleClearSearch}
                startIcon={<ClearIcon />}
                variant="outlined"
              >
                {t("common.clearFilter", "Clear Filter")}
              </Button>
            </Paper>
          </Box>
        )}

        {/* Search Results */}
        {location && hasSearched && (
          <Box>
            {/* Results Header */}
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">
                {t("itemsAll.searchResultsGeneric", "Search Results")}
              </Typography>

              {/* Results count */}
              <Typography variant="body2" color="text.secondary">
                {itemsLoading || totalItemsLoading
                  ? t("common.loading", "Loading...")
                  : totalItemsData?.totalItemsCountByLocation
                    ? t(
                      "itemsAll.resultsFoundTotal",
                      "Found {{count}} item(s)",
                      {
                        count: totalItemsData.totalItemsCountByLocation,
                      },
                    )
                    : t("itemsAll.resultsFound", "Found {{count}} item(s)", {
                      count: itemsWithDistance.length,
                    })}
              </Typography>
            </Box>

            {/* Loading State */}
            {itemsLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error State */}
            {itemsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t("itemsAll.itemsError", "Error loading items")}:{" "}
                {itemsError.message}
              </Alert>
            )}

            {/* Items Grid */}
            {!itemsLoading && itemsWithDistance.length > 0 && (
              <>
                <Grid
                  container
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{
                    mb: 3,
                  }}
                >
                  {itemsWithDistance.map((item) => (
                    <Grid key={item.id} size={{ xs: 4, sm: 3, md: 2 }}>
                      <ItemPreview
                        item={item}
                        distance={item.distance}
                        onClick={handleItemClick}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination Controls */}
                <Box sx={{ mt: 4 }}>
                  <PaginationControls
                    currentPage={page}
                    onPageChange={handlePageChange}
                    hasNextPage={itemsWithDistance.length === ITEMS_PER_PAGE}
                    totalItems={totalItemsData?.totalItemsCountByLocation}
                    hasPrevPage={page > 1}
                    isLoading={itemsLoading || totalItemsLoading}
                    itemsPerPage={ITEMS_PER_PAGE}
                    showPageInfo={true}
                  />
                </Box>
              </>
            )}

            {/* Empty State */}
            {!itemsLoading && itemsWithDistance.length === 0 && (
              <Box
                sx={{
                  py: 8,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Alert severity="info" sx={{ maxWidth: 600 }}>
                  {t(
                    "itemsAll.noResults",
                    "No items found matching your search criteria within {{radius}}km.",
                    {
                      radius: searchRadiusKm,
                    },
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
                          "Selecting a different filter",
                        )}
                      </li>
                      <li>
                        {t(
                          "itemsAll.searchTip3",
                          "Checking for spelling mistakes",
                        )}
                      </li>
                    </Typography>
                  </Box>
                </Alert>
              </Box>
            )}
          </Box>
        )}

        {/* Initial State */}
        {location && !hasSearched && !categoryFromUrl && (
          <Alert severity="info">
            {t(
              "itemsAll.instructionsSearch",
              "Please select a filter type above to search for items within {{radius}}km of your location.",
              { radius: searchRadiusKm },
            )}
          </Alert>
        )}

        {!location && !locationError && (
          <Alert severity="info">
            {t(
              "itemsAll.needLocation",
              "Please enable location services to search for nearby items.",
            )}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default ItemAllPage;
