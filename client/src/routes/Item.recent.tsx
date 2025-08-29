import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import {
  RecentAddedItemsQuery,
  RecentAddedItemsQueryVariables,
  User,
} from "../generated/graphql";
import ItemPreview from "../components/ItemPreview";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import PaginationControls from "../components/PaginationControls";

interface OutletContext {
  user?: User;
}

const ALL_COMICS_QUERY = gql`
  query RecentAddedItems($limit: Int, $offset: Int, $category: [String!]) {
    recentAddedItems(limit: $limit, offset: $offset, category: $category) {
      id
      name
      description
      condition
      category
      status
      images
      publishedYear
      language
      createdAt
    }
  }
`;

const ITEMS_PER_PAGE = 10;

const ItemRecentPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data, loading, error, refetch } = useQuery<
    RecentAddedItemsQuery,
    RecentAddedItemsQueryVariables
  >(ALL_COMICS_QUERY, {
    variables: {
      category: selectedCategory ? [selectedCategory] : [],
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    },
  });

  const handleComicClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setSelectedCategory(event.target.value as string);
    setPage(1); // Reset to page 1 when category changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Refetch when category, page, or status changes
  React.useEffect(() => {
    refetch({
      category: selectedCategory ? [selectedCategory] : [],
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    });
  }, [selectedCategory, page, refetch]);

  const filteredItems =
    data?.recentAddedItems.filter((item) =>
      statusFilter ? item.status === statusFilter : true
    ) || [];

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/")} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t("item.allItems")}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t("item.status")}</InputLabel>
          <Select
            value={statusFilter}
            label={t("item.status")}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">{t("common.all", "All")}</MenuItem>
            <MenuItem value="AVAILABLE">{t("item.available")}</MenuItem>
            <MenuItem value="EXCHANGEABLE">{t("item.exchangeable")}</MenuItem>
            <MenuItem value="GIFT">{t("item.gift")}</MenuItem>
            <MenuItem value="RESERVED">{t("item.reserved")}</MenuItem>
          </Select>
        </FormControl>
        {/* Category filter (optional, if you want to show) */}
        {/*
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t("item.category")}</InputLabel>
          <Select
            value={selectedCategory}
            label={t("item.category")}
            onChange={handleCategoryChange}
          >
            <MenuItem value="">{t("common.all", "All")}</MenuItem>
            // Add your categories here
          </Select>
        </FormControl>
        */}
      </Box>

      {/* Comics Grid */}
      {loading && <CircularProgress />}

      {error && (
        <Typography color="error">
          {t("common.error", "Error")}: {error.message}
        </Typography>
      )}

      {filteredItems.length > 0 && (
        <>
          <Grid container spacing={2}>
            {filteredItems.map((item) => (
              <Grid key={item.id}>
                <ItemPreview
                  item={item}
                  width="100%"
                  height="300px"
                  showImage={true}
                  onClick={handleComicClick}
                  isPortrait={false}
                />
              </Grid>
            ))}
          </Grid>
          {/* Pagination Controls */}
          <PaginationControls
            currentPage={page}
            onPageChange={handlePageChange}
            hasNextPage={filteredItems.length === ITEMS_PER_PAGE}
            hasPrevPage={page > 1}
            isLoading={loading}
            itemsPerPage={ITEMS_PER_PAGE}
            showPageInfo={true}
          />
        </>
      )}

      {filteredItems.length === 0 && !loading && (
        <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
          {t("item.noComicsFound")}
        </Typography>
      )}
    </Box>
  );
};

export default ItemRecentPage;
