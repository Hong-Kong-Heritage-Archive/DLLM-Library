import React, { useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { auth } from "../firebase";
import {
  confirmEmailVerificationCode,
  requestEmailVerificationCode,
} from "../utils/emailVerification";

interface EmailVerificationFormProps {
  onVerified?: () => void;
  description?: string;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onVerified,
  description,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const email =
    auth.currentUser?.email || t("emailVerification.fallbackEmail");

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await requestEmailVerificationCode();
      setSent(true);
      setSuccess(t("emailVerification.codeSent"));
    } catch (err: any) {
      setError(err?.message || t("emailVerification.sendError"));
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      await confirmEmailVerificationCode(code.trim());
      setSuccess(t("emailVerification.verifySuccess"));
      onVerified?.();
    } catch (err: any) {
      setError(err?.message || t("emailVerification.verifyError"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {description || t("emailVerification.sendDescription", { email })}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Button
        variant={sent ? "outlined" : "contained"}
        onClick={handleSend}
        disabled={sending || verifying}
      >
        {sending
          ? t("emailVerification.sending")
          : sent
            ? t("emailVerification.resendCode")
            : t("emailVerification.sendCode")}
      </Button>

      <TextField
        label={t("emailVerification.codeLabel")}
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputProps={{ inputMode: "numeric", maxLength: 6 }}
        disabled={verifying}
        fullWidth
      />

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
      >
        {verifying
          ? t("emailVerification.verifying")
          : t("emailVerification.verify")}
      </Button>
    </Stack>
  );
};

export default EmailVerificationForm;
