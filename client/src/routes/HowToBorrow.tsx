import React from "react";
import { Box, Container, IconButton, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import HowToBorrow from "../components/how-to-borrow/HowToBorrow";
import { semanticTokens } from "../styles/semanticTokens";

/** Standalone 點樣借書 page at /news/how-to-borrow. */
const HowToBorrowPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Back to the previous screen; opened from a shared link there is no
  // in-app history, so fall back to the 新聞 tab instead of leaving the app.
  const handleBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/news");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={handleBack} aria-label={t("howToBorrow.back")} sx={{ width: 44, height: 44 }}>
          <ArrowBack />
        </IconButton>
        <Typography
          component="p"
          sx={{ fontFamily: semanticTokens.font.display, fontWeight: 700, fontSize: 16, color: semanticTokens.color.textPrimary }}
        >
          {t("howToBorrow.pageTitle")}
        </Typography>
      </Box>
      <HowToBorrow />
    </Container>
  );
};

export default HowToBorrowPage;
