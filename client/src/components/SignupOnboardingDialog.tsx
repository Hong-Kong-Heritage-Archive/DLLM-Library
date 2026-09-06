import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import { clearPendingSignupOnboarding } from "../utils/signupOnboarding";
import { semanticTokens } from "../styles/semanticTokens";
import EmailVerificationForm from "./EmailVerificationForm";

export const OPEN_SIGNUP_EMAIL_VERIFICATION_EVENT =
  "bookguide:open-signup-email-verification";

export function openSignupEmailVerificationStep(): void {
  window.dispatchEvent(new CustomEvent(OPEN_SIGNUP_EMAIL_VERIFICATION_EVENT));
}

interface SignupOnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAddress: () => void;
}

const SignupOnboardingDialog: React.FC<SignupOnboardingDialogProps> = ({
  open,
  onClose,
  onAddAddress,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [forcedOpen, setForcedOpen] = useState(false);
  const verificationStep = 1;
  const addressStep = 2;
  const completeStep = 3;
  const isVerification = step === verificationStep;
  const isComplete = step === completeStep;
  const dialogOpen = open || forcedOpen;

  useEffect(() => {
    const handleOpenVerification = () => {
      setStep(verificationStep);
      setForcedOpen(true);
    };

    window.addEventListener(
      OPEN_SIGNUP_EMAIL_VERIFICATION_EVENT,
      handleOpenVerification,
    );

    return () =>
      window.removeEventListener(
        OPEN_SIGNUP_EMAIL_VERIFICATION_EVENT,
        handleOpenVerification,
      );
  }, []);

  const closeAndReset = () => {
    setStep(0);
    setForcedOpen(false);
    onClose();
  };

  const finishOnboarding = () => {
    clearPendingSignupOnboarding();
    closeAndReset();
  };

  const handleDismiss = () => {
    if (!forcedOpen) {
      clearPendingSignupOnboarding();
    }
    closeAndReset();
  };

  const handlePrimaryAction = () => {
    if (isComplete) {
      finishOnboarding();
      return;
    }

    setStep((currentStep) => currentStep + 1);
  };

  const handleAddAddressNow = () => {
    clearPendingSignupOnboarding();
    closeAndReset();
    onAddAddress();
  };

  const handleVerificationDone = () => {
    setStep(addressStep);
  };

  const handleVerificationLater = () => {
    if (forcedOpen) {
      closeAndReset();
      return;
    }

    setStep(addressStep);
  };

  const stepCopy = [
    {
      title: t("onboarding.signup.step1.title"),
      body: t("onboarding.signup.step1.body"),
      action: t("onboarding.signup.continue"),
    },
    {
      title: t("signupOtp.emailVerification.title"),
      body: t("signupOtp.emailVerification.body"),
      action: "",
    },
    {
      title: t("onboarding.signup.step3.title"),
      body: t("onboarding.signup.step3.body"),
      action: t("onboarding.signup.continue"),
    },
    {
      title: t("signupOtp.completeTitle"),
      body: t("onboarding.signup.complete.body"),
      action: t("onboarding.signup.browseBooks"),
    },
  ][step];

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleDismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: semanticTokens.color.bgSurface,
          color: semanticTokens.color.textPrimary,
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        {isComplete ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              mb: 2,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(semanticTokens.color.brandPrimary, 0.08),
              color: semanticTokens.color.brandPrimary,
            }}
          >
            <CheckIcon />
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 0.75, mb: 2.5 }}>
            {[0, 1, 2].map((progressStep) => (
              <Box
                key={progressStep}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor:
                    progressStep <= step
                      ? semanticTokens.color.brandPrimary
                      : semanticTokens.color.borderSubtle,
                }}
              />
            ))}
          </Box>
        )}

        {!isComplete && (
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 1.5,
              color: semanticTokens.color.brandPrimary,
              fontWeight: 600,
            }}
          >
            {t("signupOtp.stepLabel", { step: step + 1 })}
          </Typography>
        )}

        <Typography
          variant="h6"
          sx={{
            mb: 1.25,
            color: semanticTokens.color.textPrimary,
            fontFamily: '"Noto Serif TC", serif',
            fontWeight: 700,
          }}
        >
          {stepCopy.title}
        </Typography>

        {isVerification ? (
          <>
            <Typography
              sx={{
                mb: 2,
                color: semanticTokens.color.textSecondary,
                lineHeight: 1.7,
              }}
            >
              {stepCopy.body}
            </Typography>
            <EmailVerificationForm onVerified={handleVerificationDone} />
            <Button
              fullWidth
              variant="text"
              onClick={handleVerificationLater}
              sx={{ mt: 1 }}
            >
              {t("emailVerification.later")}
            </Button>
          </>
        ) : (
          <>
            <Typography
              sx={{
                minHeight: isComplete ? undefined : { xs: 120, sm: 140 },
                color: semanticTokens.color.textSecondary,
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {stepCopy.body}
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={handlePrimaryAction}
              sx={{ mt: 2.5 }}
            >
              {stepCopy.action}
            </Button>

            {step === addressStep && (
              <Button
                fullWidth
                variant="text"
                onClick={handleAddAddressNow}
                sx={{ mt: 1 }}
              >
                {t("onboarding.signup.addAddress")}
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupOnboardingDialog;
