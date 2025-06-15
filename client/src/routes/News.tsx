import React from "react";
import { User } from "../generated/graphql";
import { CreateNewsPostMutation } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";
import { Link } from "react-router";
import { Button, Box } from "@mui/material";
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  user?: User;
}

const NewsPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();



  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/news/all" variant="outlined">
          View All News
        </Button>
      </Box>
      <RecentNewsBanner 
        user={user}
      />
    </Box>
  );
};

export default NewsPage;