import React from "react";
import {
  Alert,
  Box,
  Grid,
  List,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { gql, useQuery } from "@apollo/client";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { semanticTokens } from "../styles/semanticTokens";
import BookSpinePreview from "./BookSpinePreview";
import ItemPreview from "./ItemPreview";
import { PageLoader } from "./LoadingState";
import NewsSummary, { SimpleNews } from "./NewsSummary";

interface BooklistItem {
  id: string;
  name: string;
  description?: string | null;
  condition: string;
  status: string;
  images?: string[] | null;
  publishedYear?: number | null;
  createdAt: string;
  updatedAt: string;
  category: string[];
  contentRating?: number | null;
}

interface UserBooklistPost extends SimpleNews {
  relatedItems?: BooklistItem[] | null;
}

interface UserBooklistBannerQueryData {
  userBooklist: UserBooklistPost[];
}

interface UserBookListBannerProps {
  userId: string;
}

const USER_BOOKLIST_BANNER_QUERY = gql`
  query UserBookListBanner($userId: ID!, $limit: Int, $offset: Int) {
    userBooklist(userId: $userId, limit: $limit, offset: $offset) {
      id
      title
      createdAt
      updatedAt
      images
      tags
      relatedItems {
        id
        name
        description
        condition
        status
        images
        publishedYear
        createdAt
        category
        contentRating
      }
    }
  }
`;

const UserBookListBanner: React.FC<UserBookListBannerProps> = ({ userId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktopLayout = useMediaQuery(theme.breakpoints.up("md"));
  const isPortraitOrientation = useMediaQuery("(orientation: portrait)");
  const useBookSpine = !isDesktopLayout || isPortraitOrientation;
  const { data, loading, error } = useQuery<UserBooklistBannerQueryData>(
    USER_BOOKLIST_BANNER_QUERY,
    {
      variables: { userId, limit: 10, offset: 0 },
      skip: !userId,
    },
  );

  if (loading) {
    return (
      <PageLoader
        size={24}
        minHeight={100}
        message={t("common.loading", "Loading...")}
      />
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {t("user.booklistLoadError", "Could not load booklists")}:{" "}
        {error.message}
      </Alert>
    );
  }

  const booklists = data?.userBooklist ?? [];
  if (booklists.length === 0) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          border: `1px solid ${alpha(semanticTokens.color.brandPrimary, 0.18)}`,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(semanticTokens.color.bgSubtle, 0.06)} 0%, ${semanticTokens.color.bgCanvas} 46%, ${alpha(semanticTokens.color.bgSubtle, 0.03)} 100%)`,
          boxShadow: `0 10px 24px ${alpha(semanticTokens.color.bgSubtle, 0.06)}`,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 1.5,
            borderBottom: `1px solid ${alpha(semanticTokens.color.brandPrimary, 0.12)}`,
            background: alpha(semanticTokens.color.bgSubtle, 0.8),
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--font-family-display)",
              fontSize: { xs: "1.15rem", md: "1.5rem" },
              fontWeight: 700,
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
            }}
          >
            {t("user.booklists", "Book Lists")}
          </Typography>
        </Box>

        <List sx={{ px: 2, pt: 1.5, pb: 2 }}>
          {booklists.map((booklist) => (
            <React.Fragment key={booklist.id}>
              <NewsSummary
                news={booklist}
                onClick={(newsId) => navigate(`/news/${newsId}`)}
              />
              {booklist.relatedItems && booklist.relatedItems.length > 0 && (
                <Grid
                  container
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ width: "100%", mt: 0.5, mb: 1 }}
                >
                  {booklist.relatedItems
                    .slice(0, useBookSpine ? 4 : 6)
                    .map((item) => (
                      <Grid key={item.id} size={{ xs: 3, sm: 2, md: 2 }}>
                        {useBookSpine ? (
                          <BookSpinePreview
                            item={item}
                            onClick={(itemId) => navigate(`/item/${itemId}`)}
                          />
                        ) : (
                          <ItemPreview
                            item={item}
                            onClick={(itemId) => navigate(`/item/${itemId}`)}
                          />
                        )}
                      </Grid>
                    ))}
                </Grid>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default UserBookListBanner;
