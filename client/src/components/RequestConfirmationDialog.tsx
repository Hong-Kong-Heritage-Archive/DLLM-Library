// components/RequestConfirmationDialog.tsx - Updated to accept existing transactions
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  NotificationImportant as NotificationIcon,
  PendingActions as PendingIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Item, User, Transaction } from "../generated/graphql";

interface RequestConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  item: Item | null;
  owner: User | null;
  holder: User | null;
  existingTransactions?: Transaction[];
  transactionsLoading?: boolean;
}

const RequestConfirmationDialog: React.FC<RequestConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  item,
  owner,
  holder,
  existingTransactions = [],
  transactionsLoading = false,
}) => {
  const { t } = useTranslation();

  const isOwnerAndHolderSame = owner?.id === holder?.id;
  const displayHolder = holder || owner;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "IN_PROGRESS":
        return "info";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationIcon color="primary" />
          {t("item.confirmRequest", "Confirm Request")}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          {t(
            "item.confirmRequestMessage",
            "Are you sure you want to request this item? This will create a transaction."
          )}
        </DialogContentText>

        {/* Item Information */}
        {item && (
          <Box
            sx={{ mb: 3, p: 2, backgroundColor: "grey.50", borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              {item.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip
                label={`${t("item.condition", "Condition")}: ${item.condition}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${t("item.status", "Status")}: ${item.status}`}
                size="small"
                variant="outlined"
                color={
                  item.status === "AVAILABLE"
                    ? "success"
                    : item.status === "EXCHANGEABLE"
                      ? "info"
                      : item.status === "GIFT"
                        ? "warning"
                        : "default"
                }
              />
            </Box>
            {item.language && (
              <Typography variant="body2" color="text.secondary">
                {t("item.language", "Language")}: {item.language}
              </Typography>
            )}
          </Box>
        )}

        {/* Existing Open Transactions */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <PendingIcon />
            {t("item.existingRequests", "Existing Requests")}
          </Typography>

          {transactionsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>{t("item.loadingRequests")}</Typography>
            </Box>
          ) : existingTransactions.length === 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t(
                "item.noExistingRequests",
                "No existing open requests for this item. You'll be the first!"
              )}
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t(
                  "item.existingRequestsWarning",
                  `There ${existingTransactions.length === 1 ? "is" : "are"} ${existingTransactions.length
                  } existing open request${existingTransactions.length === 1 ? "" : "s"
                  } for this item. Your request will be added to the queue.`
                )}
              </Alert>

              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                {existingTransactions.map((transaction) => (
                  <Box
                    key={transaction.id}
                    sx={{
                      mb: 1,
                      p: 2,
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 1,
                      backgroundColor: "grey.50",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {transaction.requestor?.nickname}
                      </Typography>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status)}
                        variant="outlined"
                      />
                    </Box>

                    {transaction.requestor?.email && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {transaction.requestor.email}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {t("item.requestedOn", "Requested on")}:{" "}
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </Box>

                    {transaction.updatedAt !== transaction.createdAt && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {t("item.lastUpdated", "Last updated")}:{" "}
                          {formatDate(transaction.updatedAt)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* People Information */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <PersonIcon />
            {t("item.peopleInvolved", "People Involved")}
          </Typography>

          {/* Owner Information */}
          {owner && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                border: "1px solid",
                borderColor: "primary.light",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                {t("item.owner", "Owner")}: {owner.nickname}
              </Typography>
              {owner.email && (
                <Typography variant="body2" color="text.secondary">
                  {owner.email}
                </Typography>
              )}
            </Box>
          )}

          {/* Holder Information (if different from owner) */}
          {displayHolder && !isOwnerAndHolderSame && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                border: "1px solid",
                borderColor: "secondary.light",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", color: "secondary.main" }}
              >
                {t("item.currentHolder", "Current Holder")}:{" "}
                {displayHolder.nickname}
              </Typography>
              {displayHolder.email && (
                <Typography variant="body2" color="text.secondary">
                  {displayHolder.email}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Transaction Location */}
        {displayHolder?.address && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
            >
              <LocationOnIcon />
              {t("item.transactionLocation", "Transaction Location")}
            </Typography>
            <Box sx={{ p: 2, backgroundColor: "info.light", borderRadius: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {displayHolder.address}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t(
                  "item.transactionLocationNote",
                  "This is where you'll meet to complete the transaction."
                )}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Notification Information */}
        <Box sx={{ p: 2, backgroundColor: "warning.light", borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            {t("item.notificationInfo", "Notifications")}
          </Typography>
          {isOwnerAndHolderSame ? (
            <Typography variant="body2">
              {t(
                "item.ownerWillBeNotified",
                "The owner will be notified of your request."
              )}
            </Typography>
          ) : (
            <Typography variant="body2">
              {t(
                "item.ownerAndHolderWillBeNotified",
                "Both the owner and current holder will be notified of your request, as they are different people."
              )}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading} size="large">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <span>{t("item.requesting", "Requesting...")}</span>
            </Box>
          ) : (
            t("item.confirmRequest", "Confirm Request")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestConfirmationDialog;
