import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import UserDetail from "../components/UserDetail";
import { User } from "../generated/graphql";

interface OutletContext {
  user?: User;
}

const UserDetailPage: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <UserDetail
      userId={id || null}
      currentUser={user}
      onBack={() => window.history.back()} // Optional custom back behavior
    />
  );
};

export default UserDetailPage;
