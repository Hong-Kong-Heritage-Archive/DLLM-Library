import React from "react";
import { useQuery } from "@apollo/client";
import { User, Role } from "../generated/graphql";
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

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
  };

  const handleShowAllNews = () => {
    // Navigation is handled by Link component
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/news/all" variant="outlined">
          View All News
        </Button>
      </Box>
      <RecentNewsBanner 
        user={user}
        onNewsCreated={handleNewsCreated}
      />
    </Box>
  );
};

export default NewsPage;