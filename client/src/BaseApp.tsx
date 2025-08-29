import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  User as fireUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router";
import { useTranslation } from "react-i18next";
import client from "./apollo";
import App from "./App";

// Adds messages only in a dev environment
loadDevMessages();
loadErrorMessages();

const BaseApp: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<fireUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setter(e.target.value);

  const signInSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Signed in successfully");
        setShowSignInForm(false);
      } catch (error) {
        alert(t("common.error", { message: error }));
      }
    }
  };

  const signUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email && password) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Account created successfully");
        setShowSignUpForm(false);
      } catch (error) {
        alert(t("common.error", { message: error }));
      }
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resetEmail) {
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        alert("Password reset email sent!");
        setShowResetForm(false);
      } catch (error) {
        alert(t("common.error", { message: error }));
      }
    }
  };

  return (
    <>
      {!user && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowSignUpForm(true);
                setShowSignInForm(false);
              }}
            >
              {t("auth.signUp")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowSignInForm(true);
                setShowSignUpForm(false);
              }}
            >
              {t("auth.signIn")}
            </Button>
          </Box>
          {/* Sign In Dialog */}
          <Dialog
            open={showSignInForm}
            onClose={() => setShowSignInForm(false)}
          >
            <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
              {t("auth.signIn")}
            </DialogTitle>
            <form onSubmit={signInSubmit}>
              <DialogContent>
                {" "}
                <TextField
                  label={t("auth.email")}
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label={t("auth.password")}
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  {t("auth.submit")}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setShowSignInForm(false);
                    setShowSignUpForm(false);
                    setShowResetForm(true);
                  }}
                >
                  {t("auth.forgotPassword")}
                </Button>
              </DialogContent>
            </form>
          </Dialog>
          {/* Sign Up Dialog */}
          <Dialog
            open={showSignUpForm}
            onClose={() => setShowSignUpForm(false)}
          >
            <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
              Sign Up
            </DialogTitle>
            <form onSubmit={signUpSubmit}>
              <DialogContent>
                {" "}
                <TextField
                  label={t("auth.email")}
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label={t("auth.password")}
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  {t("auth.signUp")}
                </Button>
              </DialogContent>
            </form>
          </Dialog>
          {/* Reset Password Dialog */}

          <Dialog open={showResetForm} onClose={() => setShowResetForm(false)}>
            <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
              {t("auth.resetPassword")}
            </DialogTitle>
            <form onSubmit={handleResetPassword} style={{ width: "100%" }}>
              <DialogContent>
                <TextField
                  label={t("auth.email")}
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  {t("auth.sendResetEmail")}
                </Button>
              </DialogContent>
            </form>
          </Dialog>
        </>
      )}

      <ApolloProvider client={client}>
        <App user={user} />
      </ApolloProvider>
    </>
  );
};

export default BaseApp;
