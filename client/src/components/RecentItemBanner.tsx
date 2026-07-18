import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Button,
} from "@mui/material";
import { useOutletContext } from "react-router";
import { gql, useQuery } from "@apollo/client";
import {
  User,
  RecentItemsQuery,
  RecentItemsQueryVariables,
  RecommendationType,
  Item,
} from "../generated/graphql";
import ItemPreview from "./ItemPreview";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const RECENT_ITEMS_QUERY = gql`
  query RecentItems($category: [String!], $limit: Int, $random: Boolean) {
    recentAddedItems(category: $category, limit: $limit, random: $random) {
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
  recommendationType?: RecommendationType;
  recommendedItems?: Item[];
  titleOverride?: string;
  descriptionOverride?: string;
}

const loadingBoxSx = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  py: 4,
};

const headerRowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  mb: 2.5,
  borderBottom: "1px solid var(--color-border-soft)",
  pb: 1.5,
};

const bannerTitleSx = {
  fontWeight: "900",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-family-display)",
  letterSpacing: "-0.5px",
  mb: 0.5,
};

const bannerDescriptionSx = {
  color: "var(--color-text-tertiary)",
  fontFamily: "var(--font-family-body)",
  fontSize: "13px",
};

const viewAllButtonSx = {
  flexShrink: 0,
  color: "var(--color-brand-primary)",
  fontWeight: "bold",
  fontFamily: "var(--font-family-body)",
  fontSize: "14px",
  textTransform: "none",
  padding: 0,
  minWidth: 0,
  "&:hover": {
    background: "none",
    textDecoration: "underline",
  },
};

const itemsGridSx = {
  width: "100%",
};

const RecentItemBanner: React.FC<RecentItemBannerProps> = ({
  category,
  recommendationType,
  recommendedItems,
  titleOverride,
  descriptionOverride,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user?: User }>();
  const isRecent = recommendationType === RecommendationType.NewArrivals; // If no recommendation type, treat as recent items

  const maxItems = 6;

  // Use provided recommendedItems or fetch based on category/type
  const shouldFetchRecommended =
    recommendationType && !recommendedItems?.length;
  const shouldFetchCategory =
    category != null && category !== undefined && !recommendationType;

  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useQuery<RecentItemsQuery, RecentItemsQueryVariables>(
    RECENT_ITEMS_QUERY,
    {
      variables: {
        category: category && category !== "" ? [category] : [],
        limit: maxItems,
        random: true,
      },
      skip: !shouldFetchCategory,
    },
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
    if (category && category !== "") {
      navigate(`/item/recent?category=${encodeURIComponent(category)}`);
    } else {
      navigate("/item/recent");
    }
  };

  // Generate title and description
  const getTitle = () => {
    if (titleOverride) return titleOverride;
    if (category && category !== "") {
      return isRecent
        ? t("item.recent.recentInCategory", "Recent in {{category}}", {
          category,
        })
        : t("item.recent.hotInCategory", "Hot in {{category}}", { category });
    }
    if (recommendationType === RecommendationType.UserPicked) {
      return t("item.recent.recommendedForYou", "Recommended for You");
    }
    if (isRecent) {
      return ""; //t("item.recent.recentItems", "Recent Items");
    } else {
      return ""; //t("item.recent.updatedItems", "Updated Items");
    }
  };

  const getDescription = () => {
    if (descriptionOverride) return descriptionOverride;
    if (category && category !== "") {
      return isRecent
        ? t("item.recent.latestAdditions", "Latest additions in this category")
        : t("home.popularItems", "Popular items in this category");
    }
    if (recommendationType === RecommendationType.UserPicked) {
      return t(
        "item.recent.basedOnInterests",
        "Based on your interests and activity",
      );
    }
    if (isRecent) {
      return t("item.recent.browseRecent", "Browse recently added items");
    } else {
      return t("item.recent.browseUpdated", "Browse recently updated items");
    }
  };

  if (loading) {
    return (
      <Box sx={loadingBoxSx}>
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
    <Box sx={{ width: "100%", mb: 5 }}>
      {/* Header */}
      <Box sx={headerRowSx}>
        <Box>
          <Typography variant="h5" sx={bannerTitleSx}>
            {getTitle()}
          </Typography>
          <Typography variant="body2" sx={bannerDescriptionSx}>
            {getDescription()}
          </Typography>
        </Box>
        {category != null && category !== undefined && (
          <Button
            variant="text"
            size="small"
            onClick={handleViewAll}
            sx={viewAllButtonSx}
          >
            全部查看
          </Button>
        )}
      </Box>

      {/* Items Grid - Responsive layout */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2 }}
        sx={itemsGridSx}
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
    </Box>
  );
};

export default RecentItemBanner;
