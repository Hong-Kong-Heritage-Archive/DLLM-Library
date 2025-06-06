import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { Button, Box, Typography} from "@mui/material";
import {
  User as fireUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    /*
    const provider = new EmailAuthProvider();
    await signInWithPopup(auth, provider);
    */
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Account created successfully");
      } catch (error) {
        console.error("Error creating account:", error);
      }
    }
  };

  const signUp = async () => {
    /*
    const provider = new EmailAuthProvider();
    await signInWithPopup(auth, provider);
    */
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (email && password) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Account created successfully");
      } catch (error) {
        console.error("Error creating account:", error);
      }
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      { user ? (<></>):
        <>
          <Button onClick={signUp}>Sign up with Email</Button>
          <Button onClick={signIn}>Sign In</Button>
        </>
      }
      <ApolloProvider client={client}>
        <App user={user} />
      </ApolloProvider>
    </Box>
  );
};

export default BaseApp;
