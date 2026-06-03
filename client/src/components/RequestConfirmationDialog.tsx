// components/RequestConfirmationDialog.tsx - Updated to accept existing transactions
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  NotificationImportant as NotificationIcon,
  PendingActions as PendingIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  StoreMallDirectory as ExchangePointIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@apollo/client";
import { GET_EXCHANGE_POINTS } from "../hook/user";
import {
  Item,
  User,
  Transaction,
  TransactionLocation,
} from "../generated/graphql";

interface RequestConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: TransactionLocation, locationIndex?: number) => void;
  loading: boolean;
  item: Item | null;
  owner: User | null;
  holder: User | null;
  requestor: User | null;
}

const RequestConfirmationDialog: React.FC<RequestConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  item,
  owner,
  holder,
  requestor,
}) => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<TransactionLocation>(
    TransactionLocation.HolderLocation,
  );
  const [selectedExchangePointIndex, setSelectedExchangePointIndex] =
    useState<number>(0);

  const isOwnerAndHolderSame = owner?.id === holder?.id;
  const displayHolder = holder || owner;

  // Get exchange point IDs for both holder and requestor
  const holderExchangePointIds = displayHolder?.exchangePoints || [];
  const requestorExchangePointIds = requestor?.exchangePoints || [];
  const allExchangePointIds = [
    ...new Set([...holderExchangePointIds, ...requestorExchangePointIds]),
  ];

  const { data: allExchangePointsData, loading: exchangePointsLoading } =
    useQuery(GET_EXCHANGE_POINTS, {
      variables: { limit: 100 }, // Adjust as needed
    });

  // Filter exchange points by IDs
  const exchangePointsData = {
    users:
      allExchangePointsData?.exchangePoints?.filter((exchangePoint: User) =>
        allExchangePointIds.includes(exchangePoint.id),
      ) || [],
  };

  useEffect(() => {
    // Reset state when dialog opens
    if (open) {
      setSelectedLocation(TransactionLocation.HolderLocation);
      setSelectedExchangePointIndex(0);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(selectedLocation, selectedExchangePointIndex);
  };

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

  // Get exchange point options based on selected location type
  const getExchangePointOptions = () => {
    if (!exchangePointsData?.users) return [];

    const targetExchangePointIds =
      selectedLocation === TransactionLocation.HolderPublicExchangePoint
        ? holderExchangePointIds
        : requestorExchangePointIds;

    return exchangePointsData.users.filter((ep: User) =>
      targetExchangePointIds.includes(ep.id),
    );
  };

  const exchangePointOptions = getExchangePointOptions();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationIcon color="primary" />
          {t("item.confirmRequest", "Confirm Request")}
        </Box>
      </DialogTitle>

      <DialogContent>
        {
          <Box>
            {/* Item Information */}
            {item && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  {item.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    label={`${t("item.condition", "Condition")}: ${
                      item.condition
                    }`}
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

            {/* Location Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ mb: 2, fontWeight: "bold" }}
                >
                  <LocationOnIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  {t("item.selectExchangeLocation", "Select Exchange Location")}
                </FormLabel>
                <RadioGroup
                  value={selectedLocation}
                  onChange={(e) =>
                    setSelectedLocation(e.target.value as TransactionLocation)
                  }
                >
                  {/* Holder Address Option */}
                  <FormControlLabel
                    value={TransactionLocation.HolderLocation}
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <HomeIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">
                            {t("item.holderAddress", "Holder's Address")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {displayHolder?.address ||
                              t("user.addressNotSet", "Address not set")}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    disabled={!displayHolder?.address}
                  />

                  {/* Requestor Address Option */}
                  <FormControlLabel
                    value={TransactionLocation.RequestorLocation}
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <HomeIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">
                            {t("item.requestorAddress", "Your Address")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {requestor?.address ||
                              t("user.addressNotSet", "Address not set")}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    disabled={!requestor?.address}
                  />

                  {/* Holder Exchange Point Option */}
                  {/* {holderExchangePointIds.length > 0 && (
                    <FormControlLabel
                      value={TransactionLocation.HolderPublicExchangePoint}
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ExchangePointIcon fontSize="small" />
                          <Typography variant="body2">
                            {t(
                              "item.holderExchangePoint",
                              "Holder's Exchange Point"
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  )} */}

                  {/* Requestor Exchange Point Option */}
                  {/* {requestorExchangePointIds.length > 0 && (
                    <FormControlLabel
                      value={TransactionLocation.RequestorPublicExchangePoint}
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ExchangePointIcon fontSize="small" />
                          <Typography variant="body2">
                            {t(
                              "item.requestorExchangePoint",
                              "Your Exchange Point"
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  )} */}
                </RadioGroup>

                {/* Exchange Point Selection Dropdown */}
                {(selectedLocation ===
                  TransactionLocation.HolderPublicExchangePoint ||
                  selectedLocation ===
                    TransactionLocation.RequestorPublicExchangePoint) && (
                  <Box sx={{ mt: 2, pl: 4 }}>
                    <FormControl fullWidth disabled={exchangePointsLoading}>
                      <InputLabel id="exchange-point-select-label">
                        {t("item.selectExchangePoint", "Select Exchange Point")}
                      </InputLabel>
                      <Select
                        labelId="exchange-point-select-label"
                        value={selectedExchangePointIndex}
                        label={t(
                          "item.selectExchangePoint",
                          "Select Exchange Point",
                        )}
                        onChange={(e) =>
                          setSelectedExchangePointIndex(
                            e.target.value as number,
                          )
                        }
                      >
                        {exchangePointsLoading ? (
                          <MenuItem value="">
                            <CircularProgress size={20} />
                          </MenuItem>
                        ) : (
                          exchangePointOptions.map(
                            (ep: User, index: number) => (
                              <MenuItem key={ep.id} value={index}>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium" }}
                                  >
                                    {ep.nickname}
                                  </Typography>
                                  {ep.address && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {ep.address}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ),
                          )
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

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
                    {t("item.owner", "Owner")}: {owner.nickname || owner.email}
                  </Typography>
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
                    {displayHolder.nickname || displayHolder.email}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Notification Information */}
            <Box
              sx={{ p: 2, backgroundColor: "warning.light", borderRadius: 1 }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {t("item.notificationInfo", "Notifications")}
              </Typography>
              {isOwnerAndHolderSame ? (
                <Typography variant="body2">
                  {t(
                    "item.ownerWillBeNotified",
                    "The owner will be notified of your request.",
                  )}
                </Typography>
              ) : (
                <Typography variant="body2">
                  {t(
                    "item.ownerAndHolderWillBeNotified",
                    "Both the owner and current holder will be notified of your request, as they are different people.",
                  )}
                </Typography>
              )}
            </Box>
          </Box>
        }
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading} size="large">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
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
