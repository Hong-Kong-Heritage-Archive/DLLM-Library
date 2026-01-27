import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase";
import { useTranslation } from "react-i18next";
import GoogleIcon from "@mui/icons-material/Google";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  defaultIsSignUp?: boolean;
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onForgotPassword,
  defaultIsSignUp = false,
}) => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      // Sign Up validation
      if (password !== confirmPassword) {
        setError(t("auth.passwordsDoNotMatch", "Passwords do not match"));
        return;
      }

      if (password.length < 6) {
        setError(
          t(
            "auth.passwordTooShort",
            "Password must be at least 6 characters long"
          )
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("Account created successfully");

        // Send verification email
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent");

        alert(t("auth.verificationEmailSent"));
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Signed in successfully");
      }

      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(`${isSignUp ? "Sign up" : "Sign in"} error:`, error);
      setError(
        error.message ||
          t(
            isSignUp ? "auth.signUpError" : "auth.signInError",
            isSignUp ? "Failed to create account" : "Failed to sign in"
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      onClose();
    }
  };

  const handleForgotPassword = () => {
    handleClose();
    if (onForgotPassword) onForgotPassword();
  };

  const handleToggleMode = (checked: boolean) => {
    setIsSignUp(checked);
    setError(null);
    setConfirmPassword("");
  };

  // Add this new handler for Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("Signed in with Google successfully");

      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setError(
        error.message ||
          t("auth.googleSignInError", "Failed to sign in with Google")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
        {isSignUp ? t("auth.signUp") : t("auth.signIn")}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google Sign-In Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="large"
            sx={{ mb: 2 }}
          >
            {t("auth.signInWithGoogle", "Sign in with Google")}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("common.or", "or")}
            </Typography>
          </Divider>

          {/* Sign Up / Sign In Toggle */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSignUp}
                  onChange={(e) => handleToggleMode(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  {t("auth.createNewAccount", "Create a new account")}
                </Typography>
              }
            />
          </Box>

          {/* Email Field */}
          <TextField
            label={t("auth.email")}
            type="email"
            fullWidth
            margin="normal"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />

          {/* Password Field */}
          <TextField
            label={t("auth.password")}
            type="password"
            fullWidth
            margin="normal"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            helperText={
              isSignUp
                ? t("auth.passwordRequirements", "At least 6 characters")
                : undefined
            }
          />

          {/* Confirm Password Field - Only for Sign Up */}
          {isSignUp && (
            <TextField
              label={t("auth.confirmPassword", "Confirm Password")}
              type="password"
              fullWidth
              margin="normal"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
            size="large"
          >
            {loading
              ? t("common.loading", "Loading...")
              : isSignUp
              ? t("auth.signUp")
              : t("auth.signIn")}
          </Button>

          {/* Forgot Password - Only for Sign In */}
          {!isSignUp && onForgotPassword && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("common.or", "or")}
                </Typography>
              </Divider>
              <Button
                fullWidth
                variant="text"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {t("auth.forgotPassword")}
              </Button>
            </>
          )}

          {/* Additional Info */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              {isSignUp
                ? t(
                    "auth.alreadyHaveAccount",
                    "Already have an account? Uncheck the box above to sign in."
                  )
                : t(
                    "auth.needAccount",
                    "Need an account? Check the box above to sign up."
                  )}
            </Typography>
          </Box>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default AuthDialog;
