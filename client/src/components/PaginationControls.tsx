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

  if (!hasPrevPage && !hasNextPage) return null;

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
        {t("common.previous", "Previous")}
      </Button>

      {showPageInfo && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            {totalItems !== undefined && totalItems !== 0
              ? t("common.pageOfTotal", "Page {{page}} of {{total}}", {
                page: currentPage,
                total: Math.ceil(totalItems / itemsPerPage),
              })
              : t("common.pageOfUnknown", "Page {{page}}", { page: currentPage })}
          </Typography>
        </Box>
      )}

      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
        size="small"
      >
        {t("common.next", "Next")}
      </Button>
    </Box>
  );
};

export default PaginationControls;
