import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { MarkEmailUnread as MarkEmailUnreadIcon } from "@mui/icons-material";

function withBoldEmail(text: string, email: string): React.ReactNode {
  if (!email || !text.includes(email)) return text;
  const [before, ...rest] = text.split(email);
  return (
    <>
      {before}
      <strong>{email}</strong>
      {rest.join(email)}
    </>
  );
}
import { useTranslation } from "react-i18next";
import { auth } from "../firebase";
import {
  confirmEmailVerificationCode,
  requestEmailVerificationCode,
} from "../utils/emailVerification";

interface EmailVerificationFormProps {
  onVerified?: () => void;
  description?: string;
  /**
   * Send the code as soon as the form appears and put the code field first.
   * Used by the shared verification card (Issue #258, D3).
   */
  autoSend?: boolean;
  /** Supporting line shown under the "code sent" line (autoSend layout only). */
  reason?: string;
}

/** The server refuses a new code within 60 seconds of the last one. */
function isCooldownError(message: string | undefined): boolean {
  return /please wait before requesting another verification code/i.test(message || "");
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onVerified,
  description,
  autoSend = false,
  reason,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [autoSendFailed, setAutoSendFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Guards against sending twice (React runs effects twice in development).
  const autoSendStartedRef = useRef(false);

  const email =
    auth.currentUser?.email || t("emailVerification.fallbackEmail");

  const send = async (isAuto: boolean) => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await requestEmailVerificationCode();
      setSent(true);
      setAutoSendFailed(false);
      if (!isAuto) {
        setSuccess(
          autoSend
            ? t("emailVerification.codeResent", "We've sent a new code.")
            : t("emailVerification.codeSent"),
        );
      }
    } catch (err: any) {
      if (isCooldownError(err?.message)) {
        // A code was sent less than a minute ago, so it's already on its way.
        setSent(true);
        if (!isAuto) {
          setSuccess(
            t(
              "emailVerification.codeAlreadySent",
              "We've already sent a code. Check your inbox.",
            ),
          );
        }
      } else {
        if (isAuto) setAutoSendFailed(true);
        setError(err?.message || t("emailVerification.sendError"));
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!autoSend || autoSendStartedRef.current) return;
    autoSendStartedRef.current = true;
    send(true);
    // Runs once when the form first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend]);

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

  const codeField = (
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
  );

  const verifyButton = (
    <Button
      variant="contained"
      onClick={handleVerify}
      disabled={code.length !== 6 || verifying}
    >
      {verifying
        ? t("emailVerification.verifying")
        : t("emailVerification.verify")}
    </Button>
  );

  if (autoSend) {
    // Card layout: what happened, why it matters, then the code.
    const showSentLine = !autoSendFailed;
    return (
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          {showSentLine ? (
            // The one instruction to act on: info colour, address in bold so
            // a typo in it is easy to spot.
            <Alert severity="info" icon={<MarkEmailUnreadIcon fontSize="inherit" />}>
              <Typography variant="body2">
                {withBoldEmail(
                  t(
                    "emailVerification.autoSentDescription",
                    "We've sent a 6-digit code to {{email}}. Check your inbox.",
                    { email },
                  ),
                  email,
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("emailVerification.expiryNote", "The code expires in 10 minutes.")}
              </Typography>
            </Alert>
          ) : (
            <Typography variant="body1">
              {t("emailVerification.sendDescription", { email })}
            </Typography>
          )}
        </Stack>

        {reason && (
          <Typography variant="body2" color="text.secondary">
            {reason}
          </Typography>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {codeField}
        {verifyButton}
        <Button
          variant="outlined"
          onClick={() => send(false)}
          disabled={sending || verifying}
        >
          {sending
            ? t("emailVerification.sending")
            : autoSendFailed
              ? t("emailVerification.sendCode")
              : t("emailVerification.resendShort", "Resend code")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {description || t("emailVerification.sendDescription", { email })}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Button
        variant={sent ? "outlined" : "contained"}
        onClick={() => send(false)}
        disabled={sending || verifying}
      >
        {sending
          ? t("emailVerification.sending")
          : sent
            ? t("emailVerification.resendCode")
            : t("emailVerification.sendCode")}
      </Button>
      {codeField}
      {verifyButton}
    </Stack>
  );
};

export default EmailVerificationForm;
