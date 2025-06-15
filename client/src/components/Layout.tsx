import React from "react";
import { Outlet } from "react-router";
import { Box, Typography } from "@mui/material";
import { User } from "../generated/graphql";

interface LayoutProps {
  email?: string | undefined | null;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ email, user }) => {
  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      <Outlet context={{ email, user }} />
    </Box>
  );
};

export default Layout;
