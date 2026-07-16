import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Snackbar,
} from "@mui/material";
import {
  Share as ShareIcon,
  ContentCopy as ContentCopyIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../styles/semanticTokens";

interface ShareTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transactionUrl: string;
  itemName: string;
}

export const ShareTransactionDialog: React.FC<ShareTransactionDialogProps> = ({
  open,
  onClose,
  transactionUrl,
  itemName,
}) => {
  const { t } = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);

  const shareMessage = t(
    "transactions.shareMessage",
    "Check out this transaction for {{itemName}}",
    { itemName }
  );

  const clipboardPayload = `${shareMessage}\n${transactionUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(clipboardPayload);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = clipboardPayload;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("transactions.shareTitle", "Transaction Details"),
          text: shareMessage,
          url: transactionUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", err);
      }
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(
      `${shareMessage}\n${transactionUrl}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareViaTelegram = () => {
    let absolute = transactionUrl;
    try {
      absolute = new URL(transactionUrl, window.location.href).href;
    } catch {
      /* keep transactionUrl */
    }
    const params = new URLSearchParams();
    params.set("url", absolute);
    if (shareMessage) params.set("text", shareMessage);
    window.open(
      `https://t.me/share/url?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareViaFacebook = () => {
    let absolute = transactionUrl;
    try {
      absolute = new URL(transactionUrl, window.location.href).href;
    } catch {
      /* keep transactionUrl */
    }
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const base = mobile
      ? "https://m.facebook.com/sharer.php"
      : "https://www.facebook.com/sharer/sharer.php";
    const url = `${base}?u=${encodeURIComponent(absolute)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=580,height=400");
  };

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      transactionUrl
    )}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ShareIcon sx={{ mr: 1 }} />
            {t("transactions.shareTransaction", "Share Transaction")}
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Instructions */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t(
                "transactions.shareInstructions",
                "Share this transaction link with the other party for face-to-face exchange. They can scan the QR code or use the link to view the transaction details."
              )}
            </Typography>
          </Alert>

          {/* QR Code */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
              p: 3,
              bgcolor: "white",
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
            }}
          >
            <QRCodeSVG
              value={transactionUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </Box>

          {/* URL Display and Copy Button */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {t("transactions.transactionLink", "Transaction Link")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  p: 1.5,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: semanticTokens.font.mono,
                    wordBreak: "break-all",
                  }}
                >
                  {transactionUrl}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleCopyLink}
                startIcon={<ContentCopyIcon />}
                sx={{ minWidth: "auto", whiteSpace: "nowrap" }}
              >
                {t("common.copy", "Copy")}
              </Button>
            </Box>
          </Box>

          {/* Native Share Button (Mobile) */}
          {isMobile && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={handleNativeShare}
                size="large"
              >
                {t("transactions.shareVia", "Share via...")}
              </Button>
            </Box>
          )}

          {/* Share via Messaging Apps */}
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {t("transactions.shareViaApps", "Share via Messaging Apps")}
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<WhatsAppIcon sx={{ color: semanticTokens.color.success }} />}
                  onClick={shareViaWhatsApp}
                >
                  WhatsApp
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TelegramIcon sx={{ color: semanticTokens.color.textSecondary }} />}
                  onClick={shareViaTelegram}
                >
                  Telegram
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FacebookIcon sx={{ color: semanticTokens.color.brandPrimary }} />}
                  onClick={shareViaFacebook}
                >
                  Facebook
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TwitterIcon sx={{ color: semanticTokens.color.warning }} />}
                  onClick={shareViaTwitter}
                >
                  Twitter
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="contained">
            {t("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setCopySuccess(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setCopySuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {t(
            "transactions.messageAndLinkCopied",
            "Link and summary copied to clipboard!",
          )}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareTransactionDialog;
