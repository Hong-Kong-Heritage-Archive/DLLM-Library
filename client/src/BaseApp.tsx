import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { Button, Box, Typography, TextField, Dialog, DialogTitle, DialogContent,  Container, ListItem } from "@mui/material";
import {
  User as fireUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { ApolloProvider } from "@apollo/client";

import client from "./apollo";
import App from "./App";
// Adds messages only in a dev environment
loadDevMessages();
loadErrorMessages();


const BaseApp: React.FC = () => {
  const [user, setUser] = useState<fireUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);

  const signInSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setShowSignInForm(false);
      } catch (error) {
        alert("Error signing in:" + error);
      }
    }
  };


  const signUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email && password) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setShowSignUpForm(false);
      } catch (error) {
        alert("Error creating account:" + error);
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
        alert("Error sending reset email: " + error);
      }
    }
  };

  const handleShowForm = (form: "signIn" | "signUp" | "reset") => {
    setShowSignInForm(form === "signIn");
    setShowSignUpForm(form === "signUp");
    setShowResetForm(form === "reset");
    if (form === "signIn" || form === "signUp") {
      setEmail('');
      setPassword('');
    }
    if (form === "reset") {
      setResetEmail('');
    }
  };

  const handleShowSignIn = () => handleShowForm("signIn");
  const handleShowSignUp = () => handleShowForm("signUp");
  const handleShowReset = () => handleShowForm("reset");

  return (
    <Box p={4}>
      {/* <Typography variant="h4" mb={2}>無大台香港典藏館</Typography> */}
      {!user && (
        <>
          <Box mb={2}>
            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={handleShowSignUp}
            >
              Siugn up
            </Button>
            <Button
              variant="outlined"
              onClick={handleShowSignIn}
            >
              Sign In
            </Button>
          </Box>
          {/* Sign In Dialog */}
          <Dialog open={showSignInForm} onClose={() => setShowSignInForm(false)}>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: "center" }}>Sign In</DialogTitle>
            <form onSubmit={signInSubmit}>
              <DialogContent>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={email}
                  onChange={handleInputChange(setEmail)}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={password}
                  onChange={handleInputChange(setPassword)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleShowReset}
                  color="secondary"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Forgot Password?
                </Button>
              </DialogContent>
            </form>
          </Dialog>
          {/* Sign Up Dialog */}
          <Dialog open={showSignUpForm} onClose={() => setShowSignUpForm(false)}>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: "center" }}>Sign Up</DialogTitle>
            <form onSubmit={signUpSubmit}>
              <DialogContent>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={email}
                  onChange={handleInputChange(setEmail)}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={password}
                  onChange={handleInputChange(setPassword)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Submit
                </Button>
              </DialogContent>
            </form>
          </Dialog>
          {/* Reset Password Dialog */}
          <Dialog open={showResetForm} onClose={() => setShowResetForm(false)}>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: "center" }}>Reset Password</DialogTitle>
            <form onSubmit={handleResetPassword}>
              <DialogContent>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={resetEmail}
                  onChange={handleInputChange(setResetEmail)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Send
                </Button>
              </DialogContent>
            </form>
          </Dialog>
        </>
      )}
      <ApolloProvider client={client}>
        <App user={user} />
      </ApolloProvider>
    </Box>
  );
};

export default BaseApp;