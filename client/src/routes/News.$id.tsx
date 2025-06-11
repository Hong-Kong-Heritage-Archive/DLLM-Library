import React from "react";
import { useParams, useNavigate } from "react-router";
import NewsDetail from "../components/NewsDetail";

const NewsDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/news');
  };

  return (
    <NewsDetail 
      newsId={id || null}
      open={true}
      onClose={handleClose}
    />
  );
};

export default NewsDetailPage;