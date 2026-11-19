import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../../styles/semanticTokens";
import { HOW_TO_BORROW_IMAGES } from "./HowToBorrow";

const c = semanticTokens.color;

export const HOW_TO_BORROW_PATH = "/news/how-to-borrow";

/**
 * Entry card at the top of the 新聞 tab (transitional, until the sub-tabs
 * in Part 2). Shown to everyone; opens the 點樣借書 page.
 */
const FirstBorrowCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      component="section"
      aria-labelledby="first-borrow-title"
      sx={{
        mb: 3,
        bgcolor: c.bgSurface,
        border: `1px solid ${c.borderDefault}`,
        borderRadius: "12px",
        boxShadow: "0 1px 4px rgba(25,6,9,.06)",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Box
          component="img"
          src={HOW_TO_BORROW_IMAGES.borrower}
          alt=""
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: c.bgCanvas,
            border: `1px solid ${c.borderSubtle}`,
            boxSizing: "border-box",
            objectFit: "contain",
          }}
        />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            id="first-borrow-title"
            component="h2"
            sx={{ m: 0, fontFamily: semanticTokens.font.display, fontWeight: 700, fontSize: 18, color: c.textPrimary }}
          >
            {t("howToBorrow.card.title")}
          </Typography>
          <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: c.textBody }}>
            {t("howToBorrow.card.body")}
          </Typography>
        </Box>
      </Box>
      <Button
        component={Link}
        to={HOW_TO_BORROW_PATH}
        variant="contained"
        disableElevation
        sx={{
          height: 44,
          borderRadius: "12px",
          bgcolor: c.brandPrimaryHover,
          color: c.textInverse,
          fontSize: 15,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: c.brandAccent },
        }}
      >
        {t("howToBorrow.card.button")}
      </Button>
    </Box>
  );
};

export default FirstBorrowCard;
