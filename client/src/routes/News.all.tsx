import React from "react";
import { User, Role } from "../generated/graphql";
import { CreateNewsPostMutation } from "../generated/graphql";
import RecentNewsPage from "../components/RecentNewsPage";
import { useNavigate } from "react-router";

interface AllNewsPageProps {
  user?: User | undefined;
}

const AllNewsPage: React.FC<AllNewsPageProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
  };

  const handleBack = () => {
    navigate('/news');
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