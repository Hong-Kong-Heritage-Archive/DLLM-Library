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
import ItemDetail from "../components/ItemDetail";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";

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

const AllItemPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, loading, error } = useQuery<
    RecentAddedItemsQuery,
    RecentAddedItemsQueryVariables
  >(ALL_COMICS_QUERY, {
    variables: {
      category: [],
      limit: 50,
      offset: 0,
    },
  });

  const handleComicClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleCloseDialog = () => {
    setSelectedItemId(null);
  };

  const filteredComics =
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
          {t("item.allItems", "All Items")}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t("item.status", "Status")}</InputLabel>
          <Select
            value={statusFilter}
            label={t("item.status", "Status")}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">{t("common.all", "All")}</MenuItem>
            <MenuItem value="AVAILABLE">
              {t("item.available", "Available")}
            </MenuItem>
            <MenuItem value="EXCHANGEABLE">
              {t("item.exchangeable", "Exchangeable")}
            </MenuItem>
            <MenuItem value="GIFT">{t("item.gift", "Gift")}</MenuItem>
            <MenuItem value="RESERVED">
              {t("item.reserved", "Reserved")}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Comics Grid */}
      {loading && <Typography>{t("common.loading", "Loading...")}</Typography>}

      {error && (
        <Typography color="error">
          {t("common.error", "Error")}: {error.message}
        </Typography>
      )}

      {filteredComics.length > 0 && (
        <Grid container spacing={2}>
          {filteredComics.map((item) => (
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
      )}

      {filteredComics.length === 0 && !loading && (
        <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
          {t("item.noComicsFound", "No comics found")}
        </Typography>
      )}

      <ItemDetail
        itemId={selectedItemId}
        user={user}
        onBack={() => window.history.back()} // Optional custom back behavior
      />
    </Box>
  );
};

export default AllItemPage;
