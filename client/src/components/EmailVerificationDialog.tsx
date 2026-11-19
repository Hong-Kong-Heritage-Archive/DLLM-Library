import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import EmailVerificationCard, {
  EmailVerificationCardMode,
} from "./EmailVerificationCard";

/**
 * The shared verification card in a window. Opens in "blocking" mode when the
 * server refuses an exchange step (request, receive, return, transfer), and in
 * "optional" mode when the person chooses to verify (Home's Verify Email).
 */
const EmailVerificationDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EmailVerificationCardMode>("blocking");

  useEffect(() => {
    // Server refusals send no detail, so they open in "blocking" mode.
    const handleOpen = (event: Event) => {
      const requested = (event as CustomEvent).detail?.mode;
      setMode(requested === "optional" ? "optional" : "blocking");
      setOpen(true);
    };
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

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        {open && (
          <EmailVerificationCard
            mode={mode}
            onExit={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationDialog;
