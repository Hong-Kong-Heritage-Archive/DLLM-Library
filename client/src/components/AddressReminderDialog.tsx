// src/components/AddressReminderDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface AddressReminderDialogProps {
  open: boolean;
  onClose: () => void;
  onGoToProfile: (() => void) | null;
}

const AddressReminderDialog: React.FC<AddressReminderDialogProps> = ({
  open,
  onClose,
  onGoToProfile,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {t("user.addressRequiredTitle", "Address Required")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            "user.addressRequiredMessage",
            "Please set your exchange address in your profile before adding items. This helps other users know where to exchange.",
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel", "Cancel")}</Button>
        {onGoToProfile && (
          <Button variant="contained" onClick={onGoToProfile}>
            {t("user.goToProfile", "Go to Profile")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddressReminderDialog;
