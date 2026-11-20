import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { Dialog, DialogContent, Button, Box } from "@mui/material";
import { User as fireUser } from "firebase/auth";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { ApolloProvider } from "@apollo/client";
import { useTranslation } from "react-i18next";
import client from "./apollo";
import App from "./App";
import { AuthDialog, ResetPasswordDialog } from "./components/Auth";
import EmailVerificationCard, { EmailVerificationCardMode } from "./components/EmailVerificationCard";

// Adds messages only in a dev environment
loadDevMessages();
loadErrorMessages();

const BaseApp: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<fireUser | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [defaultIsSignUp, setDefaultIsSignUp] = useState(false);
  const [emailVerificationOpen, setEmailVerificationOpen] = useState(false);
  const [emailVerificationMode, setEmailVerificationMode] = useState<EmailVerificationCardMode>("blocking");

  useEffect(() => {
    // Server refusals send no detail, so they open in "blocking" mode.
    const handleOpen = (event: Event) => {
      const requested = (event as CustomEvent).detail?.mode;
      setEmailVerificationMode(requested === "optional" ? "optional" : "blocking");
      setEmailVerificationOpen(true);
    };
    window.addEventListener(
      "bookguide:email-verification-required",
      handleOpen as EventListener,
    );
    return () =>
      window.removeEventListener(
        "bookguide:email-verification-required",
        handleOpen as EventListener,
      );
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleSignInClick = () => {
    setDefaultIsSignUp(false);
    setShowAuthDialog(true);
  };

  const handleSignUpClick = () => {
    setDefaultIsSignUp(true);
    setShowAuthDialog(true);
  };

  const handleForgotPassword = () => {
    setShowAuthDialog(false);
    setShowResetForm(true);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      // User state will be automatically updated by onAuthStateChanged listener
      // which will set it to null
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {!user && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
            <Button variant="outlined" onClick={handleSignUpClick}>
              {t("auth.signUp")}
            </Button>
            <Button variant="outlined" onClick={handleSignInClick}>
              {t("auth.signIn")}
            </Button>
          </Box>

          {/* Unified Auth Dialog */}
          <AuthDialog
            open={showAuthDialog}
            onClose={() => setShowAuthDialog(false)}
            onSuccess={() => console.log("Authentication successful")}
            onForgotPassword={handleForgotPassword}
            defaultIsSignUp={defaultIsSignUp}
          />

          {/* Reset Password Dialog */}
          <ResetPasswordDialog
            open={showResetForm}
            onClose={() => setShowResetForm(false)}
            onSuccess={() => console.log("Reset email sent")}
          />
        </>
      )}

      {/* Must stay mounted near the app root — Home / request flow open it via event. */}
      <Dialog open={emailVerificationOpen} onClose={() => setEmailVerificationOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          {emailVerificationOpen && (
            <EmailVerificationCard
              mode={emailVerificationMode}
              onExit={() => setEmailVerificationOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ApolloProvider client={client}>
        <App user={user} onSignOut={handleSignOut} />
      </ApolloProvider>
    </>
  );
};

export default BaseApp;
