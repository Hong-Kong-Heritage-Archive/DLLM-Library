import React from "react";
import { Outlet } from "react-router";
import { Box, Typography, AppBar, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { User } from "../generated/graphql";

interface LayoutProps {
  email?: string | undefined | null;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ email, user }) => {
  const { t } = useTranslation();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} onClick={() => window.location.href = '/'}>
            {t("app.title")}
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      <Outlet context={{ email, user }} />
    </>
  );
};

export default Layout;
