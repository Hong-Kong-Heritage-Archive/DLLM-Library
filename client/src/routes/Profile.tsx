import React from "react";
import { Container } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { User } from "../generated/graphql";
import UserDetail from "../components/UserDetail";

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
  onSignOut?: () => Promise<void> | undefined;
}

const ProfilePage: React.FC = () => {
  const { user, onSignOut } = useOutletContext<OutletContext>();
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {user && (
        <UserDetail
          userId={user.id}
          currentUser={user}
          onBack={undefined}
          signOut={onSignOut}
        />
      )}
    </Container>
  );
};

export default ProfilePage;
