import React from "react";
import { User } from "../generated/graphql";
import { CreateNewsPostMutation, NewsStatus } from "../generated/graphql";
import RecentNewsPage from "../components/RecentNewsPage";
import { useNavigate, useSearchParams } from "react-router";
import { useOutletContext } from "react-router-dom";

interface OutletContext {
  user?: User;
}

const AllNewsPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get status from URL parameters
  const status = searchParams.get("status") || "";
  const handleBack = () => {
    navigate("/");
  };

  if (status)
    return (
      <RecentNewsPage
        user={user}
        newsStatus={status as NewsStatus}
        onBack={handleBack}
      />
    );
  else
    return (
      <RecentNewsPage
        newsStatus={NewsStatus.Published}
        user={user}
        onBack={handleBack}
      />
    );
};

export default AllNewsPage;
