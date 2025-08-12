import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Box,
  Typography,
  List,
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
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
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
  ) {
    itemsByLocation(
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
      category: $category
    ) {
      id
      name
      condition
      status
      location {
        latitude
        longitude
      }
      images
      thumbnails
      category
    }
  }
`;

const HotCategoriesQuery = gql`
  query HotCategories($limit: Int!) {
    hotCategories(limit: $limit)
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

const ITEMS_PER_PAGE = 10;

const ItemAllPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  // Query for hot categories
  const { data: hotCategoriesData, loading: categoriesLoading } = useQuery<{
    hotCategories: string[];
  }>(HotCategoriesQuery, {
    variables: { limit: 10 },
  });

  // Query for items by location with pagination
  const {
    data: itemsData,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery<{ itemsByLocation: Item[] }>(ITEMS_QUERY, {
    variables: location
      ? {
          ...location,
          radiusKm: 10,
          category: selectedCategory ? [selectedCategory] : null,
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        }
      : undefined,
    skip: !location,
  });

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
    setPage(1); // Reset to page 1 when category changes
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

  // Refetch items when category, page, or location changes
  useEffect(() => {
    if (location) {
      refetchItems();
    }
  }, [selectedCategory, page, refetchItems, location]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/")} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ mb: 3 }}>
          {t("itemsAll.title", "All Items Nearby")}
        </Typography>
      </Box>
      {/* Location Controls */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={getLocation}
          disabled={itemsLoading}
          sx={{ mb: 2 }}
        >
          {location
            ? t("itemsAll.refreshLocation", "Refresh Location")
            : t("itemsAll.getLocation", "Get My Location")}
        </Button>

        {locationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {locationError}
          </Alert>
        )}
      </Box>

      {/* Category Filter */}
      {location && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="category-select-label">
              {t("itemsAll.selectCategory", "Select Category")}
            </InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              value={selectedCategory}
              label={t("itemsAll.selectCategory", "Select Category")}
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
            >
              <MenuItem value="">
                <em>
                  {t("itemsAll.allCategories", "All Categories (No Filter)")}
                </em>
              </MenuItem>
              {hotCategoriesData?.hotCategories?.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

      {/* Items List */}
      {location && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedCategory
              ? t(
                  "itemsAll.itemsInCategory",
                  "{{category}} Items Within 10km",
                  {
                    category: selectedCategory,
                  }
                )
              : t("itemsAll.allItemsWithinRadius", "All Items Within 10km")}
          </Typography>

          {itemsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>
                {t("itemsAll.loadingItems", "Loading items...")}
              </Typography>
            </Box>
          )}

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
                        "itemsAll.noItemsInCategory",
                        "No {{category}} items found within 10km of your location.",
                        {
                          category: selectedCategory,
                        }
                      )
                    : t(
                        "itemsAll.noItemsNearby",
                        "No items found within 10km of your location."
                      )}
                </Alert>
              ) : (
                <List>
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
                </List>
              )}

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={page}
                onPageChange={handlePageChange}
                hasNextPage={
                  itemsData.itemsByLocation.length === ITEMS_PER_PAGE
                }
                hasPrevPage={page > 1}
                isLoading={itemsLoading}
                itemsPerPage={ITEMS_PER_PAGE}
                showPageInfo={true}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("itemsAll.itemsCount", "Found {{count}} item(s)", {
                  count: itemsData.itemsByLocation.length,
                })}
              </Typography>
            </>
          )}
        </Box>
      )}

      {!location && !locationError && (
        <Alert severity="info">
          {t(
            "itemsAll.needLocation",
            "Please enable location services to see nearby items."
          )}
        </Alert>
      )}
    </Container>
  );
};

export default ItemAllPage;
