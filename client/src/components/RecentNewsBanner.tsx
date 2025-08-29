import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  List,
  CircularProgress,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Link } from "react-router";
import {
  useNewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  User,
  Role,
} from "../generated/graphql";
import NewsForm from "./NewsForm";
import NewsDetail from "./NewsDetail";
import NewsSummary from "./NewsSummary";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface RecentNewsBannerProps {
  user: User | undefined;
}

const RecentNewsBanner: React.FC<RecentNewsBannerProps> = ({ user }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  const { data, loading, error, refetch } = useNewsRecentPostsQuery({
    variables: {
      tags: [],
      limit: 2,
      offset: 0,
    } as NewsRecentPostsQueryVariables,
  });

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

      const maxCards = data?.newsRecentPosts.length || 10;
      setCardsPerView(Math.max(1, Math.min(cards, maxCards)));
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);

    return () => window.removeEventListener("resize", calculateLayout);
  }, [data?.newsRecentPosts.length, isMobile, isPortrait, isLandscape]);

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

  const handleNewsCreated = () => {
    refetch();
  };

  const handleNewsItemClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  const handleCloseDialog = () => {
    setSelectedNewsId(null);
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - cardsPerView);
    setCurrentIndex(newIndex);
  };

  const scrollRight = () => {
    const maxIndex = Math.max(
      0,
      (data?.newsRecentPosts.length || 0) - cardsPerView
    );
    const newIndex = Math.min(maxIndex, currentIndex + cardsPerView);
    setCurrentIndex(newIndex);
  };

  // Check if we can scroll left or right
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = data?.newsRecentPosts.length
    ? currentIndex + cardsPerView < data.newsRecentPosts.length
    : false;

  if (loading) return <CircularProgress />;
  if (error) return <Typography>Error: {error.message}</Typography>;

  return (
    <>
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
            sx={{
              textDecoration: "none",
              color: "primary.main",
              fontWeight: "bold",
            }}
          >
            {t("news.trending")}
          </Typography>
          {user?.role === Role.Admin && (
            <NewsForm onNewsCreated={handleNewsCreated} />
          )}
        </Box>

        {data && (
          <List>
            {data.newsRecentPosts.map((news) => (
              <NewsSummary
                key={news.id}
                news={news}
                onClick={handleNewsItemClick}
              />
            ))}
          </List>
        )}

        {/* See All Link */}
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography
            variant="body2"
            component={Link}
            to="/news/all"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              fontWeight: "medium",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {t("news.viewAll")} →
          </Typography>
        </Box>
      </Box>

      <NewsDetail
        newsId={selectedNewsId}
        open={!!selectedNewsId}
        onClose={handleCloseDialog}
      />
    </>
  );
};

export default RecentNewsBanner;
