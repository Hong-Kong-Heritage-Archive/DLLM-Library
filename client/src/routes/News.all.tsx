import React from "react";
import { User } from "../generated/graphql";
import { CreateNewsPostMutation } from "../generated/graphql";
import RecentNewsPage from "../components/RecentNewsPage";
import { useNavigate } from "react-router";
import { useOutletContext } from "react-router-dom";

interface OutletContext {
  user?: User;
}

const AllNewsPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <RecentNewsPage
      user={user}
      onBack={handleBack}
      onNewsCreated={handleNewsCreated}
    />
  );
};

export default AllNewsPage;
