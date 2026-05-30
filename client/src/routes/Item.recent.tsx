import React from "react";
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
  CircularProgress,
  Container,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const ALL_RECENT_ITEMS_QUERY = gql`
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

const TOTAL_ITEMS_COUNT_QUERY = gql`
  query TotalItemsCount($classifications: [String!]) {
    totalItemsCount(classifications: $classifications)
  }
`;

const ITEMS_PER_PAGE = 12; // Changed to 12 for better grid layout (3 columns x 4 rows)

const ItemRecentPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") || "";
  const selectedCategory = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, loading, error } = useQuery<
    RecentAddedItemsQuery,
    RecentAddedItemsQueryVariables
  >(ALL_RECENT_ITEMS_QUERY, {
    variables: {
      category: selectedCategory ? [selectedCategory] : [],
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    },
  });

  const { data: totalCountData } = useQuery<
    { totalItemsCount: number },
    { classifications?: string[] }
  >(TOTAL_ITEMS_COUNT_QUERY, {
    variables: {
      classifications: selectedCategory ? [selectedCategory] : undefined,
    },
  });

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredItems =
    data?.recentAddedItems.filter((item) =>
      statusFilter ? item.status === statusFilter : true
    ) || [];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
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
              {selectedCategory
                ? t("item.categoryItems", "{{category}} Items", { category: selectedCategory })
                : t("item.recentItems", "Recent Items")}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {!loading && (
          <>
            {/* Filters */}
            <Box
              sx={{
                mb: 3,
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel shrink>{t("item.status")}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t("item.status")}
                  displayEmpty
                  onChange={(e) => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      if (e.target.value) next.set("status", e.target.value); else next.delete("status");
                      return next;
                    });
                  }}
                >
                  <MenuItem value="">{t("common.all", "All")}</MenuItem>
                  <MenuItem value="AVAILABLE">{t("item.available")}</MenuItem>
                  <MenuItem value="EXCHANGEABLE">
                    {t("item.exchangeable")}
                  </MenuItem>
                  <MenuItem value="GIFT">{t("item.gift")}</MenuItem>
                  <MenuItem value="RESERVED">{t("item.reserved")}</MenuItem>
                </Select>
              </FormControl>

              {/* Results count */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: "auto" }}
              >
                {t("itemsAll.itemsFound", "{{count}} items found", {
                  count: filteredItems.length,
                })}
              </Typography>
            </Box>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="error">
              {t("common.error", "Error")}: {error.message}
            </Typography>
          </Box>
        )}

        {/* Items Grid - 3 columns on mobile, 4 on tablet, 6 on desktop */}
        {!loading && filteredItems.length > 0 && (
          <>
            <Grid
              container
              spacing={{ xs: 1, sm: 2 }}
              sx={{
                mb: 3,
              }}
            >
              {filteredItems.map((item) => (
                <Grid key={item.id} size={{ xs: 4, sm: 3, md: 2 }}>
                  <ItemPreview item={item} onClick={handleItemClick} />
                </Grid>
              ))}
            </Grid>

            {/* Pagination Controls */}
            <Box sx={{ mt: 4 }}>
              <PaginationControls
                currentPage={page}
                onPageChange={handlePageChange}
                hasNextPage={filteredItems.length === ITEMS_PER_PAGE}
                hasPrevPage={page > 1}
                isLoading={loading}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={totalCountData?.totalItemsCount}
                showPageInfo={true}
              />
            </Box>
          </>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
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
            <Typography variant="h6" color="text.secondary">
              {t("itemsAll.noItemsFound", "No items found")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {statusFilter || selectedCategory
                ? t("itemsAll.tryDifferentFilters", "Try adjusting your filters")
                : t("itemsAll.noItemsYet", "No items available yet")}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ItemRecentPage;
