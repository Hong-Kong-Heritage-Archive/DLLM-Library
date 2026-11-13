import React, { useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import EmailVerificationForm from "./EmailVerificationForm";

/**
 * The one verification card used wherever BookGuide asks for a verified email
 * (Issue #258). Everything is shared except the exit, which depends on
 * whether the person can carry on without verifying:
 *
 * - "optional": nothing is blocked (welcome after sign-up). Exit: "Later".
 * - "blocking": an exchange step is waiting on it (request, receive, return,
 *   transfer). Exit: "Go back", with a note that nothing has happened yet.
 *
 * Keep this rule: no other part of the card changes by situation.
 *
 * After a successful check the card shows a short "Email verified" message
 * with Done, unless showSuccess is false (the request flow, where the step
 * strip moving on is the confirmation).
 */
export type EmailVerificationCardMode = "optional" | "blocking";

interface EmailVerificationCardProps {
  mode: EmailVerificationCardMode;
  onVerified?: () => void;
  onExit: () => void;
  showSuccess?: boolean;
}

const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  mode,
  onVerified,
  onExit,
  showSuccess = true,
}) => {
  const { t } = useTranslation();
  const [verified, setVerified] = useState(false);

  const handleVerified = () => {
    if (showSuccess) setVerified(true);
    onVerified?.();
  };

  if (verified) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
          {t("emailVerification.cardTitle", "Verify your email")}
        </Typography>
        <Alert severity="success">
          {t(
            "emailVerification.successMessage",
            "Email verified. You can now borrow and lend books.",
          )}
        </Alert>
        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" onClick={onExit}>
            {t("emailVerification.done", "Done")}
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
        {t("emailVerification.cardTitle", "Verify your email")}
      </Typography>

      <EmailVerificationForm
        autoSend
        onVerified={handleVerified}
        reason={t(
          "emailVerification.reason",
          "A verified email lets you borrow and lend books, and lets members reach you.",
        )}
      />

      <Box sx={{ textAlign: "center" }}>
        <Button variant="text" onClick={onExit}>
          {mode === "blocking"
            ? t("emailVerification.goBack", "Go back")
            : t("emailVerification.later")}
        </Button>
        {mode === "blocking" && (
          <Typography variant="caption" color="text.secondary" component="p">
            {t(
              "emailVerification.blockingNote",
              "Nothing is sent or changed until you verify.",
            )}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default EmailVerificationCard;
