import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Grid,
  Button,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Link, useOutletContext } from "react-router";
import { gql, useQuery } from "@apollo/client";
import {
  User,
  RecentAddedItemsQuery,
  RecentAddedItemsQueryVariables,
  RecommendationType,
  Item,
} from "../generated/graphql";
import ItemPreview from "./ItemPreview";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const RECENT_ITEMS_QUERY = gql`
  query RecentItems($category: [String!], $limit: Int) {
    recentAddedItems(category: $category, limit: $limit) {
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

const RECOMMENDED_ITEMS_QUERY = gql`
  query RecommendedItemsForBanner($type: RecommendationType!, $limit: Int!) {
    recommendedItems(type: $type, limit: $limit) {
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

interface RecentItemBannerProps {
  category?: string;
  isRecent?: boolean;
  recommendationType?: RecommendationType;
  recommendedItems?: Item[];
  titleOverride?: string;
  descriptionOverride?: string;
}

const RecentItemBanner: React.FC<RecentItemBannerProps> = ({
  category,
  isRecent = false,
  recommendationType,
  recommendedItems,
  titleOverride,
  descriptionOverride,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user?: User }>();

  const maxItems = 6;

  // Use provided recommendedItems or fetch based on category/type
  const shouldFetchRecommended =
    recommendationType && !recommendedItems?.length;
  const shouldFetchCategory = category && !recommendationType;

  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useQuery<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>(
    RECENT_ITEMS_QUERY,
    {
      variables: {
        category: category ? [category] : [],
        limit: maxItems,
        //isRecent: isRecent,
      },
      skip: !shouldFetchCategory,
    }
  );

  const {
    data: recommendedData,
    loading: recommendedLoading,
    error: recommendedError,
  } = useQuery(RECOMMENDED_ITEMS_QUERY, {
    variables: {
      type: recommendationType!,
      limit: maxItems,
    },
    skip: !shouldFetchRecommended,
  });

  // Determine which items to display
  const items: Item[] =
    recommendedItems?.slice(0, maxItems) ||
    recommendedData?.recommendedItems?.slice(0, maxItems) ||
    categoryData?.recentAddedItems?.slice(0, maxItems) ||
    [];

  const loading = categoryLoading || recommendedLoading;
  const error = categoryError || recommendedError;

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleViewAll = () => {
    if (category) {
      navigate(`/item/recent?category=${encodeURIComponent(category)}`);
    } else {
      navigate("/item/recent");
    }
  };

  // Generate title and description
  const getTitle = () => {
    if (titleOverride) return titleOverride;
    if (category) {
      return isRecent
        ? t("item.recent.recentInCategory", "Recent in {{category}}", { category })
        : t("item.recent.hotInCategory", "Hot in {{category}}", { category });
    }
    if (recommendationType === RecommendationType.UserPicked) {
      return t("item.recent.recommendedForYou", "Recommended for You");
    }
    return t("item.recent.recentItems", "Recent Items");
  };

  const getDescription = () => {
    if (descriptionOverride) return descriptionOverride;
    if (category) {
      return isRecent
        ? t("item.recent.latestAdditions", "Latest additions in this category")
        : t("home.popularItems", "Popular items in this category");
    }
    if (recommendationType === RecommendationType.UserPicked) {
      return t("item.recent.basedOnInterests", "Based on your interests and activity");
    }
    return t("item.recent.browseRecent", "Browse recently added items");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="error">
          {t("common.error", "Error loading items")}: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
            {getTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getDescription()}
          </Typography>
        </Box>
        {category && (
          <Button
            variant="text"
            size="small"
            onClick={handleViewAll}
            sx={{ flexShrink: 0 }}
          >
            {t("common.viewAll", "View All")}
          </Button>
        )}
      </Box>

      {/* Items Grid - Responsive layout */}
      <Grid
        container
        spacing={{ xs: 1, sm: 2 }}
        sx={{
          width: "100%",
        }}
      >
        {items.map((item) => (
          <Grid
            key={item.id}
            size={{
              xs: 4, // 3 items per row on mobile (vertical)
              sm: 4, // 3 items per row on small screens
              md: 2, // 6 items per row on desktop (horizontal)
            }}
          >
            <ItemPreview item={item} onClick={handleItemClick} />
          </Grid>
        ))}
      </Grid>

      {/* Show message if there are more items available */}
      {category && items.length === maxItems && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {t("item.recent.showingItems", "Showing {{count}} of many items", {
              count: maxItems,
            })}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentItemBanner;
