import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import UserDetail from "../components/UserDetail";
import { User } from "../generated/graphql";
import { useNavigateBack } from "../hook/useNavigateBack";

interface OutletContext {
  user?: User;
}

const UserDetailPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { id } = useParams<{ id: string }>();
  const navigateBack = useNavigateBack("/");

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return <UserDetail userId={id} currentUser={user} onBack={navigateBack} />;
};

export default UserDetailPage;
