import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Pagination,
  Container,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";

const GET_EXCHANGE_POINTS = gql`
  query GetExchangePoints($limit: Int, $offset: Int) {
    exchangePoints(limit: $limit, offset: $offset) {
      id
      nickname
      address
      location {
        latitude
        longitude
        geohash
      }
    }
  }
`;

const GET_EXCHANGE_POINTS_COUNT = gql`
  query GetExchangePointsCount {
    exchangePointsCount
  }
`;

interface ExchangePoint {
  id: string;
  nickname: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
}

const ExchangePointsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const exchangePointsPerPage = 10;

  const {
    data: exchangePointsData,
    loading: exchangePointsLoading,
    error: exchangePointsError,
  } = useQuery<{
    exchangePoints: ExchangePoint[];
  }>(GET_EXCHANGE_POINTS, {
    variables: {
      limit: exchangePointsPerPage,
      offset: (page - 1) * exchangePointsPerPage,
    },
  });

  const { data: exchangePointsCountData } = useQuery<{
    exchangePointsCount: number;
  }>(GET_EXCHANGE_POINTS_COUNT);

  const handleExchangePointClick = (exchangePointId: string) => {
    navigate(`/user/${exchangePointId}`);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = exchangePointsCountData?.exchangePointsCount
    ? Math.ceil(
      exchangePointsCountData.exchangePointsCount / exchangePointsPerPage
    )
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        {t("navigation.exchangePoints", "Exchange Points")}
      </Typography>

      {exchangePointsLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {exchangePointsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("userProfile.exchangePointsError", "Error loading exchange points")}:{" "}
          {exchangePointsError.message}
        </Alert>
      )}

      {exchangePointsData?.exchangePoints && (
        <>
          <Box sx={{ mb: 3 }}>
            {exchangePointsData.exchangePoints.map((point) => (
              <Card
                key={point.id}
                sx={{
                  mb: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "action.hover",
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleExchangePointClick(point.id)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {point.nickname}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {point.address}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: "center" }}
          >
            {t(
              "userProfile.exchangePointsCount",
              "{{current}} of {{total}} exchange points",
              {
                current: exchangePointsData.exchangePoints.length,
                total: exchangePointsCountData?.exchangePointsCount || 0,
              }
            )}
          </Typography>
        </>
      )}

      {!exchangePointsLoading &&
        exchangePointsData?.exchangePoints?.length === 0 && (
          <Alert severity="info">
            {t("userProfile.noExchangePoints", "No exchange points available.")}
          </Alert >
        )}
    </Container >
  );
};

export default ExchangePointsPage;
