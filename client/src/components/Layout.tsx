import React from 'react';
import { Outlet } from 'react-router';
import { Box, Typography } from '@mui/material';
import { User } from '../generated/graphql';

interface LayoutProps {
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      <Outlet context={{ user }}/>
    </Box>
  );
};

export default Layout;