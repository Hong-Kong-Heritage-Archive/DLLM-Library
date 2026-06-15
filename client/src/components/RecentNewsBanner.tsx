import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  List,
  CircularProgress,
  Grid,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Link } from "react-router";
import {
  useNewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  NewsStatus,
} from "../generated/graphql";
import NewsSummary from "./NewsSummary";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ItemPreview from "./ItemPreview";

interface RecentNewsBannerProps {
  newsStatus: NewsStatus;
  isFrontPage?: boolean; // Whether this banner is on the front page (affects styling)
}

const RecentNewsBanner: React.FC<RecentNewsBannerProps> = ({
  newsStatus,
  isFrontPage,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
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
      limit: isFrontPage ? 1 : 2,
      offset: 0,
      newsStatus,
    } as NewsRecentPostsQueryVariables,
  });

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

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

  const handleNewsItemClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography>Error: {error.message}</Typography>;
  let title = t("news.trending");
  if (newsStatus === NewsStatus.Draft) {
    title = t("news.draft");
  }
  if (newsStatus === NewsStatus.CoEditing) {
    title = t("news.coedit");
  }

  return (
    <>
      <Box sx={{ mb: 4, width: "100%" }}>
        {/* Header Section */}
        {isFrontPage ? (
          data && (
            <List>
              {data.newsRecentPosts.map((news) => (
                <>
                  <NewsSummary
                    key={news.id}
                    news={news}
                    onClick={handleNewsItemClick}
                  />
                  <Grid
                    container
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{
                      width: "100%",
                    }}
                  >
                    {news.relatedItems?.map((item) => (
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
                </>
              ))}
            </List>
          )
        ) : (
          <>
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
                {title || t("news.trending")}
              </Typography>
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
                to={`/news/all?status=${newsStatus}`}
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: "medium",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {t("news.viewAll")} ↓
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default RecentNewsBanner;
