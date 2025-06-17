import React from "react";
import { User } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import { Link } from "react-router";
import { Button, Box } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface OutletContext {
  user?: User;
}

const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext<OutletContext>();

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/news/all" variant="outlined">
          {t("news.viewAll")}
        </Button>
      </Box>
      <RecentNewsBanner user={user} />
    </Box>
  );
};

export default NewsPage;
