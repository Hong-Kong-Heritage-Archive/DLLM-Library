import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { Button, Box, Typography, TextField, Container } from "@mui/material";
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

  const signInSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Signed in successfully");
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
        console.log("Account created successfully");
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

  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      {!user && (
        <>
          <Button 
           variant="outlined"
           onClick={() => { setShowSignUpForm(true); setShowSignInForm(false); }}>
            Sign up 
          </Button>
          <Button 
           variant="outlined"
           onClick={() => { setShowSignInForm(true); setShowSignUpForm(false); }}>
            Sign In
          </Button>
          {showSignInForm && (
            <Container maxWidth="xs">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt={4}
                p={4}
                boxShadow={3}
                borderRadius={2}
              >
                <Typography variant="h5" mb={2}>
                  Sign In
                </Typography>
                <form onSubmit={signInSubmit} style={{ width: '100%' }}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Submit
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
                    Forgot Password?
                    </Button>
                </form>
              </Box>
            </Container>
          )}
          {showSignUpForm && (
            <Container maxWidth="xs">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt={4}
                p={4}
                boxShadow={3}
                borderRadius={2}
              >
                <Typography variant="h5" mb={2}>
                  Sign Up
                </Typography>
                <form onSubmit={signUpSubmit} style={{ width: '100%' }}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Sign Up
                  </Button>
                </form>
              </Box>
            </Container>
          )}
          {showResetForm && (
            <Container maxWidth="xs">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt={4}
                p={4}
                boxShadow={3}
                borderRadius={2}
              >
                <Typography variant="h5" mb={2}>
                  Reset Password
                </Typography>
                <form onSubmit={handleResetPassword} style={{ width: '100%' }}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Send Reset Email
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    sx={{ mt: 2 }}
                    onClick={() => setShowResetForm(false)}
                  >
                    Cancel
                  </Button>
                </form>
              </Box>
            </Container>
          )}
        </>
      )}
      <ApolloProvider client={client}>
        <App user={user} />
      </ApolloProvider>
    </Box>
  );
};

export default BaseApp;