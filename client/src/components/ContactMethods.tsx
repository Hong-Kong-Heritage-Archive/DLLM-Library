import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Chip,
  SvgIcon,
  Alert,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ContactMethodType, ContactMethod } from "../generated/graphql";

// Custom icons for social platforms
const SignalIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 32 32">
    {/* Official Signal logo SVG path */}
    <path d="M16 2C8.268 2 2 8.268 2 16c0 7.732 6.268 14 14 14s14-6.268 14-14c0-7.732-6.268-14-14-14zm0 2.5c6.355 0 11.5 5.145 11.5 11.5 0 6.355-5.145 11.5-11.5 11.5-6.355 0-11.5-5.145-11.5-11.5 0-6.355 5.145-11.5 11.5-11.5zm7.2 3.3a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .55-1.28zm-14.4 0a.75.75 0 0 1 .55 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm7.2 1.2a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 1.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm10.2 2.3a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .55-1.28zm-20.4 0a.75.75 0 0 1 .55 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm21.7 3.7a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .54-1.28zm-23 0a.75.75 0 0 1 .54 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm23.7 4.2a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .54-1.28zm-24.4 0a.75.75 0 0 1 .54 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm23.7 4.2a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .54-1.28zm-23 0a.75.75 0 0 1 .54 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm21.7 3.7a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .54-1.28zm-20.4 0a.75.75 0 0 1 .55 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm7.2 3.3a.75.75 0 0 1 .55 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .53-1.28zm7.2 0a.75.75 0 0 1 .53 1.28l-.01.01a.75.75 0 0 1-1.06 0l-.01-.01a.75.75 0 0 1 .55-1.28z" />
  </SvgIcon>
);

const TelegramIcon = (props: any) => (
  <SvgIcon {...props}>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </SvgIcon>
);

interface ContactMethodForm {
  type: ContactMethodType;
  value: string;
  isPublic: boolean;
}

interface ContactMethodsProps {
  contactMethods: ContactMethod[] | ContactMethodForm[];
  onContactMethodsChange?: (methods: ContactMethodForm[]) => void;
  readOnly?: boolean;
  title?: string;
  showTitle?: boolean;
  showAddButton?: boolean;
  showPublicPrivateFilter?: boolean;
  maxHeight?: number;
}

const ContactMethods: React.FC<ContactMethodsProps> = ({
  contactMethods = [],
  onContactMethodsChange,
  readOnly = false,
  title,
  showTitle = true,
  showAddButton = true,
  showPublicPrivateFilter = false,
  maxHeight = 400,
}) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentMethod, setCurrentMethod] = useState<ContactMethodForm>({
    type: ContactMethodType.Email,
    value: "",
    isPublic: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Convert ContactMethod[] to ContactMethodForm[] for consistency
  const methods: ContactMethodForm[] = contactMethods.map((method) => ({
    type: method.type,
    value: method.value,
    isPublic: method.isPublic,
  }));

  // Filter methods based on public/private preference
  const filteredMethods =
    showPublicPrivateFilter && showPublicOnly
      ? methods.filter((method) => method.isPublic)
      : methods;

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateHttpsUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateContactMethod = (
    type: ContactMethodType,
    value: string
  ): { isValid: boolean; error?: string } => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return {
        isValid: false,
        error: t(
          "contactMethods.validation.required",
          "This field is required"
        ),
      };
    }

    switch (type) {
      case ContactMethodType.Email:
        if (!validateEmail(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "userProfile.contactMethods.validation.invalidEmail",
              "Please enter a valid email address"
            ),
          };
        }
        break;

      case ContactMethodType.Whatsapp:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.invalidWhatsappUrl",
              "Please enter a valid WhatsApp HTTPS link"
            ),
          };
        }
        if (
          !trimmedValue.includes("wa.me") &&
          !trimmedValue.includes("whatsapp.com")
        ) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.whatsappFormat",
              "Please use a WhatsApp link format (wa.me or whatsapp.com)"
            ),
          };
        }
        break;

      case ContactMethodType.Signal:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.invalidSignalUrl",
              "Please enter a valid Signal HTTPS link"
            ),
          };
        }
        if (
          !trimmedValue.includes("signal.me")
        ) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.signalFormat",
              "Please use a Signal link format"
            ),
          };
        }
        break;

      case ContactMethodType.Telegram:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.invalidTelegramUrl",
              "Please enter a valid Telegram HTTPS link"
            ),
          };
        }
        if (
          !trimmedValue.includes("t.me") &&
          !trimmedValue.includes("telegram.me")
        ) {
          return {
            isValid: false,
            error: t(
              "contactMethods.validation.telegramFormat",
              "Please use a Telegram link format"
            ),
          };
        }
        break;

      default:
        break;
    }

    return { isValid: true };
  };

  // Helper functions
  const getContactMethodIcon = (type: ContactMethodType) => {
    switch (type) {
      case ContactMethodType.Email:
        return <EmailIcon fontSize="small" />;
      case ContactMethodType.Whatsapp:
        return <PhoneIcon fontSize="small" />;
      case ContactMethodType.Signal:
        return <SignalIcon fontSize="small" />;
      case ContactMethodType.Telegram:
        return <TelegramIcon fontSize="small" />;
      default:
        return <ChatIcon fontSize="small" />;
    }
  };

  const getContactMethodPlaceholder = (type: ContactMethodType): string => {
    switch (type) {
      case ContactMethodType.Email:
        return t("userProfile.contactMethods.emailPlaceholder", "e.g., user@example.com");
      case ContactMethodType.Whatsapp:
        return t(
          "userProfile.contactMethods.whatsappPlaceholder",
          "e.g., https://wa.me/1234567890"
        );
      case ContactMethodType.Signal:
        return t(
          "userProfile.contactMethods.signalPlaceholder",
          "e.g., https://signal.me/#p/+1234567890"
        );
      case ContactMethodType.Telegram:
        return t(
          "userProfile.contactMethods.telegramPlaceholder",
          "e.g., https://t.me/username"
        );
      default:
        return t(
          "userProfile.contactMethods.socialPlaceholder",
          "Enter contact information"
        );
    }
  };

  const getContactMethodHelper = (type: ContactMethodType): string => {
    switch (type) {
      case ContactMethodType.Email:
        return t("userProfile.contactMethods.emailHelper", "Enter a valid email address");
      case ContactMethodType.Whatsapp:
        return t("userProfile.contactMethods.whatsappHelper", "Enter your WhatsApp link");
      case ContactMethodType.Signal:
        return t("userProfile.contactMethods.signalHelper", "Enter your Signal link");
      case ContactMethodType.Telegram:
        return t("userProfile.contactMethods.telegramHelper", "Enter your Telegram link");
      default:
        return t(
          "userProfile.contactMethods.socialHelper",
          "Enter your contact information"
        );
    }
  };

  // Click handlers for read mode
  const handleContactMethodClick = (method: ContactMethodForm) => {
    if (readOnly) {
      const value = method.value.trim();

      switch (method.type) {
        case ContactMethodType.Email:
          // Open email client
          if (validateEmail(value)) {
            window.open(`mailto:${value}`, "_blank");
          }
          break;

        case ContactMethodType.Whatsapp:
        case ContactMethodType.Signal:
        case ContactMethodType.Telegram:
          // Open URL in new tab
          if (validateHttpsUrl(value)) {
            window.open(value, "_blank", "noopener,noreferrer");
          }
          break;

        default:
          // For other types, try to open as URL or copy to clipboard
          if (validateHttpsUrl(value)) {
            window.open(value, "_blank", "noopener,noreferrer");
          } else {
            navigator.clipboard?.writeText(value);
          }
          break;
      }
    }
  };

  // Edit mode handlers
  const handleAdd = () => {
    setCurrentMethod({
      type: ContactMethodType.Email,
      value: "",
      isPublic: false,
    });
    setEditingIndex(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setCurrentMethod({ ...methods[index] });
    setEditingIndex(index);
    setError(null);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedMethods = methods.filter((_, i) => i !== index);
    onContactMethodsChange?.(updatedMethods);
  };

  const handleSave = () => {
    const validation = validateContactMethod(
      currentMethod.type,
      currentMethod.value
    );

    if (!validation.isValid) {
      setError(validation.error || "Invalid input");
      return;
    }

    // Check for duplicates
    const isDuplicate = methods.some(
      (method, index) =>
        index !== editingIndex &&
        method.type === currentMethod.type &&
        method.value.trim().toLowerCase() ===
        currentMethod.value.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError(
        t(
          "contactMethods.validation.duplicate",
          "This contact method already exists"
        )
      );
      return;
    }

    let updatedMethods: ContactMethodForm[];

    if (editingIndex !== null) {
      // Editing existing method
      updatedMethods = methods.map((method, index) =>
        index === editingIndex
          ? { ...currentMethod, value: currentMethod.value.trim() }
          : method
      );
    } else {
      // Adding new method
      updatedMethods = [
        ...methods,
        { ...currentMethod, value: currentMethod.value.trim() },
      ];
    }

    onContactMethodsChange?.(updatedMethods);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
    setError(null);
  };

  const handleValueChange = (value: string) => {
    setCurrentMethod((prev) => ({ ...prev, value }));
    if (error) setError(null);
  };

  const handleTypeChange = (type: ContactMethodType) => {
    setCurrentMethod((prev) => ({ ...prev, type, value: "" }));
    if (error) setError(null);
  };

  const isSaveDisabled = () => {
    if (!currentMethod.value.trim()) return true;
    const validation = validateContactMethod(
      currentMethod.type,
      currentMethod.value
    );
    return !validation.isValid;
  };

  return (
    <Box>
      {/* Header */}
      {showTitle && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <EmailIcon />
            {title || t("userProfile.contactMethods.title", "Contact Methods")}
          </Typography>
          {!readOnly && showAddButton && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              variant="outlined"
              size="small"
            >
              {t("userProfile.contactMethods.add", "Add Contact Method")}
            </Button>
          )}
        </Box>
      )}

      {/* Public/Private Filter for read mode */}
      {showPublicPrivateFilter && readOnly && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showPublicOnly}
                onChange={(e) => setShowPublicOnly(e.target.checked)}
                size="small"
              />
            }
            label={t("userProfile.contactMethods.showPublicOnly", "Show public only")}
          />
        </Box>
      )}

      {/* Helper text for edit mode */}
      {!readOnly && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            "userProfile.contactMethods.helper",
            "Add contact methods for other users to reach you when needed"
          )}
        </Typography>
      )}

      {/* Contact Methods List */}
      {filteredMethods.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {readOnly
            ? t(
              "userProfile.contactMethods.noContactMethodsRead",
              "No contact methods available"
            )
            : t(
              "userProfile.contactMethods.noContactMethods",
              "No contact methods added yet. Add some to help others contact you."
            )}
        </Alert>
      ) : (
        <List sx={{ maxHeight: maxHeight, overflow: "auto" }}>
          {filteredMethods.map((method, index) => (
            <ListItem
              key={index}
              divider
              sx={{
                cursor: readOnly ? "pointer" : "default",
                "&:hover": readOnly ? { bgcolor: "action.hover" } : {},
                borderRadius: 1,
                mb: 1,
              }}
              onClick={() => handleContactMethodClick(method)}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getContactMethodIcon(method.type)}
                    <Typography variant="body1" fontWeight="medium">
                      {t(`userProfile.contactMethod.type.${method.type}`, method.type)}
                    </Typography>
                    <Chip
                      icon={method.isPublic ? <PublicIcon /> : <PrivateIcon />}
                      label={
                        method.isPublic
                          ? t("common.public")
                          : t("common.private")
                      }
                      size="small"
                      color={method.isPublic ? "success" : "default"}
                      variant="outlined"
                    />
                    {readOnly && <LaunchIcon fontSize="small" color="action" />}
                  </Box>
                }
                secondary={
                  readOnly ? (
                    <Link
                      component="span"
                      sx={{
                        textDecoration: "none",
                        color: "text.secondary",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {method.value}
                    </Link>
                  ) : (
                    method.value
                  )
                }
              />

              {/* Edit/Delete buttons for edit mode */}
              {!readOnly && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(index);
                    }}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null
            ? t("userProfile.contactMethods.editTitle", "Edit Contact Method")
            : t("userProfile.contactMethods.addTitle", "Add Contact Method")}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t("userProfile.contactMethods.typeLabel", "Type")}</InputLabel>
            <Select
              value={currentMethod.type}
              label={t("userProfile.contactMethods.typeLabel", "Type")}
              onChange={(e) =>
                handleTypeChange(e.target.value as ContactMethodType)
              }
            >
              <MenuItem value={ContactMethodType.Email}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  {t("userProfile.contactMethod.email", "Email")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Whatsapp}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon fontSize="small" />
                  {t("userProfile.contactMethod.whatsapp", "WhatsApp")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Signal}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SignalIcon fontSize="small" />
                  {t("userProfile.contactMethod.signal", "Signal")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Telegram}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TelegramIcon fontSize="small" />
                  {t("userProfile.contactMethod.telegram", "Telegram")}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label={t("userProfile.contactMethods.valueLabel", "Contact Value")}
            placeholder={getContactMethodPlaceholder(currentMethod.type)}
            helperText={error || getContactMethodHelper(currentMethod.type)}
            value={currentMethod.value}
            onChange={(e) => handleValueChange(e.target.value)}
            error={Boolean(error)}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={currentMethod.isPublic}
                onChange={(e) =>
                  setCurrentMethod((prev) => ({
                    ...prev,
                    isPublic: e.target.checked,
                  }))
                }
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  {t("userProfile.contactMethods.makePublic", "Make Public")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentMethod.isPublic
                    ? t(
                      "userProfile.contactMethods.publicHelp",
                      "This contact method will be visible to all users"
                    )
                    : t(
                      "userProfile.contactMethods.privateHelp",
                      "This contact method will only be shared during transactions"
                    )}
                </Typography>
              </Box>
            }
            sx={{ mt: 2, alignItems: "flex-start" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t("common.cancel")}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaveDisabled()}
          >
            {editingIndex !== null ? t("common.update") : t("common.add")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactMethods;
