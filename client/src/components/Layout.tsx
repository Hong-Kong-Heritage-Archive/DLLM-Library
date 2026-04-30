import React from "react";
import { Outlet } from "react-router";
import { Box, Typography, AppBar, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { User } from "../generated/graphql";
import { resolveBranding } from "../utils/branding";

interface LayoutProps {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ email, emailVerified, user }) => {
  const { t } = useTranslation();
  const appTitle =
    resolveBranding(window.__DLLM_CLIENT_CONFIG__).appTitle ||
    t("app.title", "DLLM Library");

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
            onClick={() => (window.location.href = "/")}
          >
            {appTitle}
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      <Outlet context={{ email, emailVerified, user }} />
    </>
  );
};

export default Layout;
