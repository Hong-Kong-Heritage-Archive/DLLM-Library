import React from "react";
import {
  Box,
  Typography,
  List,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { gql } from "@apollo/client";
import { ArrowBack } from "@mui/icons-material";
import {
  useNewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  User,
  Role,
  NewsStatus,
} from "../generated/graphql";
import { CreateNewsPostMutation } from "../generated/graphql";
import NewsForm from "./NewsForm";
import NewsSummary from "./NewsSummary";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const NEWS_RECENT_QUERY = gql`
  query NewsRecentPosts($limit: Int, $offset: Int, $newsStatus: NewsStatus) {
    newsRecentPosts(limit: $limit, offset: $offset, newsStatus: $newsStatus) {
      id
      title
      images
      createdAt
      tags
      relatedItems {
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
  }
`;
interface RecentNewsPageProps {
  user: User | undefined;
  newsStatus: NewsStatus | undefined;
  onBack: () => void;
}

const RecentNewsPage: React.FC<RecentNewsPageProps> = ({
  user,
  newsStatus,
  onBack,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useNewsRecentPostsQuery({
    variables: {
      tags: [],
      limit: 20,
      offset: 0,
      newsStatus: newsStatus,
    } as NewsRecentPostsQueryVariables,
  });

  const handleNewsCreated = () => {
    refetch();
  };

  const handleNewsItemClick = (newsId: string) => {
    // Navigate to the news detail page instead of opening a dialog
    // setSelectedNewsId(newsId);
    navigate(`/news/${newsId}`);
  };

  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, p: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t("news.viewAll")}→
        </Typography>
        {user?.role === Role.Admin && (
          <NewsForm
            open={false}
            onSuccess={handleNewsCreated}
            onClose={handleNewsCreated}
          />
        )}
      </Box>

      {/* All news list */}
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

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
          <Typography>{t("news.loadNews")}</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ p: 2 }}>
          <Typography color="error">Error: {error.message}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentNewsPage;
