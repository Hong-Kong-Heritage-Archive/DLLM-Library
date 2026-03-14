import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import ItemDetail from "../components/ItemDetail";
import { User } from "../generated/graphql";
import { useNavigateBack } from "../hook/useNavigateBack";

interface OutletContext {
  user?: User;
}

const ItemDetailPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { id } = useParams<{ id: string }>();
  const navigateBack = useNavigateBack("/item/recent");

  if (!id) {
    return <Navigate to="/item/recent" replace />;
  }

  return <ItemDetail itemId={id || null} user={user} onBack={navigateBack} />;
};

export default ItemDetailPage;
