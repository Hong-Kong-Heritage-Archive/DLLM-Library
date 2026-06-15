import React from "react";
import { useParams, useNavigate } from "react-router";
import NewsDetail from "../components/NewsDetail";

const NewsDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/news");
  };

  return <NewsDetail newsId={id || null} open={true} onBack={handleBack} />;
};

export default NewsDetailPage;
