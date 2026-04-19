import React, { useEffect, useMemo, useState } from "react";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SvgIcon,
  type SvgIconProps,
} from "@mui/material";
import {
  Share as ShareIcon,
  ContentCopy as ContentCopyIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Telegram as TelegramIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

function ThreadsIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 448 512">
      <path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.8-30.3 143.2c-36.2 36.2-80.3 52.5-142.6 53h-.3c-70.2-.5-124.1-24.1-160.4-70.2c-32.3-41-48.9-98.1-49.5-169.6V256v-.2C17 184.3 33.6 127.2 65.9 86.2C102.2 40.1 156.2 16.5 226.4 16h.3c70.3 .5 124.9 24 162.3 69.9c18.4 22.7 32 50 40.6 81.7l-40.4 10.8c-7.1-25.8-17.8-47.8-32.2-65.4c-29.2-35.8-73-54.2-130.5-54.6c-57 .5-100.1 18.8-128.2 54.4C72.1 146.1 58.5 194.3 58 256c.5 61.7 14.1 109.9 40.3 143.3c28 35.6 71.2 53.9 128.2 54.4c51.4-.4 85.4-12.6 113.7-40.9c32.3-32.2 31.7-71.8 21.4-95.9c-6.1-14.2-17.1-26-31.9-34.9c-3.7 26.9-11.8 48.3-24.7 64.8c-17.1 21.8-41.4 33.6-72.7 35.3c-23.6 1.3-46.3-4.4-63.9-16c-20.8-13.8-33-34.8-34.3-59.3c-2.5-48.3 35.7-83 95.2-86.4c21.1-1.2 40.9-.3 59.2 2.8c-2.4-14.8-7.3-26.6-14.6-35.2c-10-11.7-25.6-17.7-46.2-17.8H227c-16.6 0-39 4.6-53.3 26.3l-34.4-23.6c19.2-29.1 50.3-45.1 87.8-45.1h.8c62.6 .4 99.9 39.5 103.7 107.7l-.2 .2zm-156 68.8c1.3 25.1 28.4 36.8 54.6 35.3c25.6-1.4 54.6-11.4 59.5-73.2c-13.2-2.9-27.8-4.4-43.4-4.4c-4.8 0-9.6 .1-14.4 .4c-42.9 2.4-57.2 23.2-56.2 41.8l-.1 .1z" />
    </SvgIcon>
  );
}

function applyItemNameTemplate(template: string, itemName: string): string {
  return template.replace(/\{\{itemName\}\}/g, itemName);
}

/** Threads intent/post only honours `text`; URL must be part of the text. */
function buildShareText(message: string, pageUrl: string): string {
  const m = message.trim();
  const u = pageUrl.trim();
  if (m && u) return `${m}\n${u}`;
  return m || u;
}

function toAbsolutePageUrl(url: string): string {
  if (!url) return "";
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

export interface ItemShareDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemUrl: string;
  adminTemplates: string[];
}

const ItemShareDialog: React.FC<ItemShareDialogProps> = ({
  open,
  onClose,
  itemName,
  itemUrl,
  adminTemplates,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [presetIndex, setPresetIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const presetOptions = useMemo(() => {
    if (adminTemplates.length > 0) {
      return adminTemplates.map((tpl) => applyItemNameTemplate(tpl, itemName));
    }
    return [
      t("item.sharePreset1", "Check out {{itemName}}!", { itemName }),
      t(
        "item.sharePreset2",
        "I found this in the library: {{itemName}}",
        { itemName },
      ),
      t("item.sharePreset3", "{{itemName}} — worth a look.", { itemName }),
    ];
  }, [adminTemplates, itemName, t]);

  useEffect(() => {
    if (!open) return;
    const next = presetOptions[0] ?? "";
    setPresetIndex(0);
    setMessage(next);
  }, [open, presetOptions]);

  const messageTrimmed = message.trim();
  const [copiedWithMessage, setCopiedWithMessage] = useState(false);

  const handleCopyLink = async () => {
    const payload = buildShareText(messageTrimmed, itemUrl);
    const hadMessage = Boolean(messageTrimmed);
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedWithMessage(hadMessage);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
      const textArea = document.createElement("textarea");
      textArea.value = payload;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedWithMessage(hadMessage);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: itemName,
        text: messageTrimmed
          ? `${messageTrimmed}\n${itemUrl}`
          : `${itemName}\n${itemUrl}`,
        url: itemUrl,
      });
    } catch (err) {
      console.log("Share cancelled or failed:", err);
    }
  };

  const shareViaWhatsApp = () => {
    const text = buildShareText(messageTrimmed, itemUrl);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareViaFacebook = () => {
    const absolute = toAbsolutePageUrl(itemUrl);
    if (!absolute) return;
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const base = mobile
      ? "https://m.facebook.com/sharer.php"
      : "https://www.facebook.com/sharer/sharer.php";
    const url = `${base}?u=${encodeURIComponent(absolute)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=580,height=400");
  };

  const shareViaThreads = () => {
    const text = buildShareText(messageTrimmed, itemUrl);
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareViaTelegram = () => {
    const absolute = toAbsolutePageUrl(itemUrl);
    if (!absolute) return;
    const params = new URLSearchParams();
    params.set("url", absolute);
    if (messageTrimmed) params.set("text", messageTrimmed);
    window.open(
      `https://t.me/share/url?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handlePresetChange = (index: number) => {
    setPresetIndex(index);
    setMessage(presetOptions[index] ?? "");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ShareIcon sx={{ mr: 1 }} />
            {t("item.shareTitle", "Share item")}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {t(
                "item.shareFacebookNote",
                "Facebook only shares the page link. Add your comment inside Facebook after sharing.",
              )}
            </Typography>
          </Alert>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="item-share-preset-label">
              {t("item.sharePickTemplate", "Quick message")}
            </InputLabel>
            <Select
              labelId="item-share-preset-label"
              label={t("item.sharePickTemplate", "Quick message")}
              value={Math.min(presetIndex, Math.max(0, presetOptions.length - 1))}
              onChange={(e) =>
                handlePresetChange(Number(e.target.value))
              }
            >
              {presetOptions.map((label, i) => (
                <MenuItem key={i} value={i}>
                  {label.length > 72 ? `${label.slice(0, 72)}…` : label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t("item.shareMessageLabel", "Additional message (optional)")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t("item.sharePageLink", "Page link")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                wordBreak: "break-all",
                bgcolor: "grey.100",
                p: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              {itemUrl}
            </Typography>
          </Box>

          {isMobile && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={handleNativeShare}
                size="large"
              >
                {t("item.shareViaSystem", "Share via…")}
              </Button>
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t("item.shareViaApps", "Share on")}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FacebookIcon sx={{ color: "#1877F2" }} />}
                onClick={shareViaFacebook}
              >
                Facebook
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ThreadsIcon sx={{ color: "#000" }} />}
                onClick={shareViaThreads}
              >
                Threads
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<WhatsAppIcon sx={{ color: "#25D366" }} />}
                onClick={shareViaWhatsApp}
              >
                WhatsApp
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TelegramIcon sx={{ color: "#0088cc" }} />}
                onClick={shareViaTelegram}
              >
                Telegram
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyLink}
              >
                {t("item.shareCopyMessageAndLink", "Copy message & link")}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="contained">
            {t("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>

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
          {copiedWithMessage
            ? t(
                "item.shareCopiedMessageAndLink",
                "Message and link copied to clipboard!",
              )
            : t("item.shareLinkCopied", "Link copied")}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ItemShareDialog;
