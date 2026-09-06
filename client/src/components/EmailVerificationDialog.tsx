import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import EmailVerificationForm from "./EmailVerificationForm";

const EmailVerificationDialog: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
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

  const handleVerified = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{t("emailVerification.title")}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <EmailVerificationForm
          onVerified={handleVerified}
          description={t("emailVerification.transactionDescription")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>
          {t("emailVerification.later")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailVerificationDialog;
