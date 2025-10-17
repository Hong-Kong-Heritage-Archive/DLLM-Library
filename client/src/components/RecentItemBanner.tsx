import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
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
import { calculateDistance } from "../utils/geoProcessor";
import ItemSummary from "./ItemSummary";

const RECENT_ITEM_QUERY = gql`
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

interface RecentItemBannerProps {
  category?: string;
  isRecent?: boolean;
  recommendationType?: RecommendationType;
  recommendedItems?: Item[]; // Add this prop
  titleOverride?: string; // Add this for custom titles
  descriptionOverride?: string; // Add this for custom descriptions
}

const RecentItemBanner: React.FC<RecentItemBannerProps> = ({
  category,
  isRecent = true,
  recommendationType,
  recommendedItems,
  titleOverride,
  descriptionOverride,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user?: User }>();

  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // If recommendedItems are provided, use them instead of querying
  const shouldSkipQuery = Boolean(recommendedItems);

  const { data, loading, error } = useQuery<
    RecentAddedItemsQuery,
    RecentAddedItemsQueryVariables
  >(RECENT_ITEM_QUERY, {
    variables: {
      category: category ? [category] : [],
      limit: 10,
      offset: 0,
    },
    skip: !category || shouldSkipQuery, // Skip if recommendedItems provided
    errorPolicy: "all",
  });

  // Use provided items or queried items
  const items = recommendedItems || data?.recentAddedItems || [];
  const isLoading = !shouldSkipQuery && loading;
  const hasError = !shouldSkipQuery && error;

  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  // Calculate responsive dimensions and cards per view
  useEffect(() => {
    const calculateLayout = () => {
      let cards = 4;

      if (isMobile) {
        if (isPortrait) {
          cards = window.innerWidth < 400 ? 2 : 3; // 2-3 cards for mobile portrait
        } else {
          cards = Math.min(4, Math.floor(window.innerWidth / 200)); // At least 3 for landscape
          cards = Math.max(3, cards);
        }
      } else {
        // Desktop/tablet landscape
        cards = Math.floor(window.innerWidth / 250);
        cards = Math.max(3, Math.min(6, cards));
      }

      const maxCards = items?.length || 10;
      setCardsPerView(Math.max(1, Math.min(cards, maxCards)));
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);

    return () => window.removeEventListener("resize", calculateLayout);
  }, [items?.length, isMobile, isPortrait, isLandscape]);

  // Calculate container height based on device and orientation
  const getContainerHeight = () => {
    const vh = window.innerHeight;

    if (isMobile) {
      if (isPortrait) {
        return Math.max(150, Math.min(vh * 0.35, 250)); // 25-35% of screen height
      } else {
        return Math.max(180, Math.min(vh * 0.45, 250)); // Less than 50% for landscape
      }
    }

    // Desktop
    return Math.max(250, Math.min(vh * 0.4, 350));
  };

  const containerHeight = getContainerHeight();

  // Calculate card dimensions
  const getCardDimensions = () => {
    const gap = 8;
    const arrowSpace = 40;
    const availableWidth =
      (scrollContainerRef.current?.offsetWidth || window.innerWidth) -
      arrowSpace;
    const cardWidth =
      (availableWidth - (cardsPerView - 1) * gap) / cardsPerView;

    return {
      width: `${cardWidth}px`,
      height: `${containerHeight}px`,
    };
  };

  const cardDimensions = getCardDimensions();

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - cardsPerView);
    setCurrentIndex(newIndex);
  };

  const scrollRight = () => {
    const maxIndex = Math.max(0, (items?.length || 0) - cardsPerView);
    const newIndex = Math.min(maxIndex, currentIndex + cardsPerView);
    setCurrentIndex(newIndex);
  };

  // Check if we can scroll left or right
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = items
    ? currentIndex + cardsPerView < items.length
    : false;
  // Get title
  const getTitle = () => {
    if (titleOverride) return titleOverride;
    if (recommendationType) {
      const key = {
        ADMIN_PICKED: "adminPicked",
        USER_PICKED: "userPicked",
        NEW_ARRIVALS: "newArrivals",
        POPULAR: "popular",
      }[recommendationType];
      return t(
        `home.recommendation.${key}`,
        `Recommended ${category || "Items"}`
      );
    }
    return isRecent
      ? t("item.recentlyAdded", { category })
      : t("item.hotItem", { category });
  };

  // Get description
  const getDescription = () => {
    if (descriptionOverride) return descriptionOverride;
    if (recommendationType) {
      const key = {
        ADMIN_PICKED: "adminPicked",
        USER_PICKED: "userPicked",
        NEW_ARRIVALS: "newArrivals",
        POPULAR: "popular",
      }[recommendationType];
      return t(`home.${key}Description`, "");
    }
    return "";
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
        <Typography>{t("item.loadItems")}</Typography>
      </Box>
    );
  }
  if (hasError)
    return <Typography>{t("common.error", hasError.message)}</Typography>;

  return (
    <Box sx={{ mb: 4, width: "100%" }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
          px: 1,
        }}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          component={Link}
          to="/item/recent"
          sx={{
            textDecoration: "none",
            color: "primary.main",
            fontWeight: "bold",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {getTitle()}
        </Typography>
      </Box>

      {getDescription() && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getDescription()}
        </Typography>
      )}

      {/* Scrollable Comics Container */}
      {items && items.length > 0 && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: `${containerHeight}px`,
            overflow: "hidden",
          }}
        >
          {/* Left Arrow */}
          {canScrollLeft && (
            <IconButton
              onClick={scrollLeft}
              sx={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "background.paper",
                boxShadow: 2,
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "background.paper",
                  boxShadow: 4,
                },
              }}
            >
              <ArrowBackIos fontSize="small" />
            </IconButton>
          )}

          {/* Comics Cards Container */}
          <Box
            ref={scrollContainerRef}
            sx={{
              display: "flex",
              overflowX: "hidden",
              scrollBehavior: "smooth",
              gap: 1,
              px: canScrollLeft || canScrollRight ? 5 : 1,
              width: "100%",
              height: "100%",
            }}
          >
            {items.map(
              (item, index) =>
                index >= currentIndex &&
                index < currentIndex + cardsPerView && (
                  <Box
                    key={item.id}
                    sx={{
                      opacity:
                        index >= currentIndex &&
                        index < currentIndex + cardsPerView
                          ? 1
                          : 0,
                      visibility:
                        index >= currentIndex &&
                        index < currentIndex + cardsPerView
                          ? "visible"
                          : "hidden",
                      transition: "opacity 0.3s ease-in-out",
                    }}
                  >
                    <ItemPreview
                      item={{
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        condition: item.condition,
                        status: item.status,
                        images: item.images,
                        publishedYear: item.publishedYear,
                        createdAt: item.createdAt,
                        category: item.category,
                      }}
                      width={cardDimensions.width}
                      height={cardDimensions.height}
                      showImage={true}
                      onClick={handleItemClick}
                      isPortrait={isMobile && isPortrait}
                    />
                  </Box>
                )
            )}
          </Box>

          {/* Right Arrow */}
          {canScrollRight && (
            <IconButton
              onClick={scrollRight}
              sx={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "background.paper",
                boxShadow: 2,
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "background.paper",
                  boxShadow: 4,
                },
              }}
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {/* Pagination Dots */}
      {items && items.length > cardsPerView && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
          {Array.from({
            length: Math.ceil(items.length / cardsPerView),
          }).map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor:
                  Math.floor(currentIndex / cardsPerView) === index
                    ? "primary.main"
                    : "grey.300",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onClick={() => {
                const newIndex = index * cardsPerView;
                setCurrentIndex(newIndex);
              }}
            />
          ))}
        </Box>
      )}

      {/* Empty state */}
      {items && items.length === 0 && !isLoading && (
        <Alert severity="info">
          {recommendationType
            ? t(
                "home.noRecommendationItems",
                "No recommended items available at the moment."
              )
            : t("item.noItemsFound", "No items found in this category.")}
        </Alert>
      )}
    </Box>
  );
};

export default RecentItemBanner;
