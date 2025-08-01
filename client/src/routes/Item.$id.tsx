import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import ItemDetail from "../components/ItemDetail";
import { User } from "../generated/graphql";

interface OutletContext {
  user?: User;
}

const ItemDetailPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/item/recent" replace />;
  }

  return (
    <ItemDetail
      itemId={id || null}
      user={user}
      onBack={() => window.history.back()} // Optional custom back behavior
    />
  );
};

export default ItemDetailPage;
