import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AuthDialog } from "../components/Auth";

interface NotFoundState {
  reason?: "login" | "rating";
}

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as NotFoundState;
  const [authOpen, setAuthOpen] = useState(false);

  let title = t("notFound.title", "Page Not Found");
  let message = t("notFound.message", "The page you are looking for does not exist.");

  if (state.reason === "login") {
    title = t("notFound.loginRequired", "Sign In Required");
    message = t(
      "item.loginToView",
      "This item may require you to sign in. Please log in to continue.",
    );
  } else if (state.reason === "rating") {
    title = t("notFound.contentRestricted", "Content Restricted");
    message = t(
      "item.contentRatingRestricted",
      "This item is not available.",
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {message}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        {state.reason === "login" ? (
          <Button variant="outlined" color="primary" onClick={() => setAuthOpen(true)}>
            {t("auth.signIn", "Sign In")}
          </Button>
        ) : (
          <Button variant="outlined" onClick={() => navigate(-1)}>
            {t("common.back", "Back")}
          </Button>
        )}
        <Button variant="contained" onClick={() => navigate("/")}>
          {t("common.goHome", "Go Home")}
        </Button>
      </Box>

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => { setAuthOpen(false); navigate(-1); }}
        onForgotPassword={() => setAuthOpen(false)}
        defaultIsSignUp={false}
      />
    </Container>
  );
};

export default NotFound;
