import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface PaginationControlsProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading?: boolean;
  itemsPerPage: number;
  totalItems?: number;
  showPageInfo?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  isLoading = false,
  itemsPerPage,
  totalItems,
  showPageInfo = true,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        mt: 2,
        gap: 2,
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage || isLoading}
        size="small"
      >
        {t("pagination.prev", "Previous")}
      </Button>

      {showPageInfo && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            {t("pagination.page", "Page")} {currentPage}
          </Typography>
          {totalItems !== undefined && (
            <Typography variant="body2" color="text.secondary">
              (
              {t(
                "pagination.showing",
                "showing {{start}}-{{end}} of {{total}}",
                {
                  start: (currentPage - 1) * itemsPerPage + 1,
                  end: Math.min(currentPage * itemsPerPage, totalItems),
                  total: totalItems,
                }
              )}
              )
            </Typography>
          )}
        </Box>
      )}

      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
        size="small"
      >
        {t("pagination.next", "Next")}
      </Button>
    </Box>
  );
};

export default PaginationControls;
