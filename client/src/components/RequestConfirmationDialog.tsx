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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  TextField,
} from "@mui/material";
import {
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  NotificationImportant as NotificationIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { GET_EXCHANGE_POINTS } from "../hook/user";
import {
  Item,
  User,
  TransactionLocation,
} from "../generated/graphql";
import { isUsableSuburbLocation, suburbWithState } from "../utils/suburbName";

// Checks that a suburb can be found on the map before it is saved. updateUser
// clears the address when it can't resolve it, so we check first.
const CHECK_MEETING_SUBURB = gql`
  query CheckMeetingSuburb($address: String!) {
    geocodeAddress(address: $address) {
      latitude
      longitude
    }
  }
`;

// Saves only the address. The server works out the location from it.
const SAVE_MEETING_SUBURB = gql`
  mutation SaveMeetingSuburb($address: String) {
    updateUser(address: $address) {
      id
      address
      location {
        latitude
        longitude
        geohash
      }
    }
  }
`;

type SuburbStatus = "idle" | "checking" | "saved" | "notFound" | "error";

const itemInfoCardSx = {
  mb: 3,
  p: 2,
  backgroundColor: "grey.50",
  borderRadius: 2,
};

const inlineOptionLabelSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const sectionTitleSx = {
  mb: 2,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const personCardBaseSx = {
  mb: 2,
  p: 2,
  border: "1px solid",
  borderRadius: 1,
};

const boldSubtitleSx = {
  fontWeight: "bold",
};

const notificationBoxSx = {
  p: 2,
  backgroundColor: "warning.light",
  borderRadius: 1,
};

interface RequestConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: TransactionLocation, locationIndex?: number, subject?: string, emailContent?: string) => void;
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
  // Nothing is pre-selected: the person chooses where to meet (Issue #258, R7).
  const [selectedLocation, setSelectedLocation] =
    useState<TransactionLocation | null>(null);
  const [suburbInput, setSuburbInput] = useState("");
  const [suburbStatus, setSuburbStatus] = useState<SuburbStatus>("idle");
  const [savedSuburb, setSavedSuburb] = useState("");
  const [checkSuburb] = useLazyQuery(CHECK_MEETING_SUBURB, {
    fetchPolicy: "network-only",
  });
  const [saveSuburb] = useMutation(SAVE_MEETING_SUBURB);
  const [selectedExchangePointIndex, setSelectedExchangePointIndex] =
    useState<number>(0);
  const defaultSubject = t("item.defaultEmailSubject", "Request for Item: {{itemName}}", { itemName: item?.name || "" });
  const defaultEmailContent = t(
    "item.defaultEmailContent",
    "Hello,\n\nI would like to request the item '{{itemName}}'. Please let me know the next steps.\n\nThank you.",
    { itemName: item?.name || "" }
  );
  const [draftSubject, setDraftSubject] = useState(defaultSubject);
  const [draftEmailContent, setDraftEmailContent] = useState(defaultEmailContent);

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
      setSelectedLocation(null);
      setSelectedExchangePointIndex(0);
      setSuburbInput("");
      setSuburbStatus("idle");
      setSavedSuburb("");
    }
  }, [open]);

  useEffect(() => {
    // Reset state when dialog opens
    setDraftSubject(defaultSubject);
    setDraftEmailContent(defaultEmailContent);
  }, [t, defaultSubject, defaultEmailContent]);

  // The requestor's meeting suburb: just saved here, or already on their profile.
  const requestorSuburb =
    savedSuburb ||
    (requestor?.address && requestor?.location ? requestor.address : "");
  const needsSuburb = !requestorSuburb;
  const holderAddress = displayHolder?.address || "";

  const selectedPlaceIsUsable =
    (selectedLocation === TransactionLocation.HolderLocation && !!holderAddress) ||
    (selectedLocation === TransactionLocation.RequestorLocation && !!requestorSuburb);

  const handleUseSuburb = async () => {
    // Search and save as "Chatswood NSW" so the map stays in New South Wales.
    const name = suburbWithState(suburbInput);
    if (!name || suburbStatus === "checking") return;
    setSuburbStatus("checking");
    try {
      const { data } = await checkSuburb({ variables: { address: name } });
      const place = data?.geocodeAddress;
      if (!place || !isUsableSuburbLocation(place.latitude, place.longitude)) {
        setSuburbStatus("notFound");
        return;
      }
      await saveSuburb({ variables: { address: name } });
      setSavedSuburb(name);
      setSuburbStatus("saved");
    } catch (err) {
      console.error("Error saving meeting suburb:", err);
      setSuburbStatus("error");
    }
  };

  const handleConfirmRequest = () => {
    if (!selectedLocation || !selectedPlaceIsUsable) return;
    onConfirm(selectedLocation, selectedExchangePointIndex, draftSubject.trim(), draftEmailContent.trim());
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
              <Box sx={itemInfoCardSx}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  {item.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    label={`${t("item.condition", "Condition")}: ${item.condition
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
                  {needsSuburb
                    ? t("item.addExchangeLocation", "Add exchange location")
                    : t("item.selectExchangeLocation", "Select Exchange Location")}
                </FormLabel>
                {/* Add a meeting suburb without leaving the request (Issue #258, R2) */}
                {needsSuburb && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t("item.meetSuburbLabel", "Where can you meet?")}
                        placeholder={t("item.meetSuburbPlaceholder", "Suburb, e.g. Chatswood")}
                        InputLabelProps={{ shrink: true }}
                        value={suburbInput}
                        onChange={(e) => {
                          setSuburbInput(e.target.value);
                          if (suburbStatus !== "checking") setSuburbStatus("idle");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUseSuburb();
                          }
                        }}
                        disabled={suburbStatus === "checking"}
                        error={suburbStatus === "notFound" || suburbStatus === "error"}
                        helperText={
                          suburbStatus === "notFound"
                            ? t("item.meetSuburbNotFound", "We couldn't find that suburb. Try another nearby one.")
                            : suburbStatus === "error"
                              ? t("item.meetSuburbError", "We couldn't save it. Check your connection and try again.")
                              : t("item.meetSuburbHelper", "Shared with the book's owner and holder.")
                        }
                      />
                      <Button
                        variant={suburbInput.trim() ? "contained" : "outlined"}
                        onClick={handleUseSuburb}
                        disabled={!suburbInput.trim() || suburbStatus === "checking"}
                        sx={{ flexShrink: 0, height: 40 }}
                      >
                        {suburbStatus === "checking" ? (
                          <CircularProgress size={18} />
                        ) : (
                          t("item.meetSuburbUse", "Use this")
                        )}
                      </Button>
                    </Box>
                  </Box>
                )}

                {suburbStatus === "saved" && (
                  <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">
                      {savedSuburb}{" "}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {t("item.meetSuburbSaved", "Saved. Now choose where to meet below.")}
                      </Typography>
                    </Typography>
                  </Box>
                )}

                <RadioGroup
                  value={selectedLocation ?? ""}
                  onChange={(e) =>
                    setSelectedLocation(e.target.value as TransactionLocation)
                  }
                >
                  {/* Holder Address Option */}
                  <FormControlLabel
                    value={TransactionLocation.HolderLocation}
                    control={<Radio />}
                    label={
                      <Box sx={inlineOptionLabelSx}>
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
                      <Box sx={inlineOptionLabelSx}>
                        <HomeIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">
                            {t("item.requestorAddress", "Your Address")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {requestorSuburb ||
                              t("user.addressNotSet", "Address not set")}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    disabled={!requestorSuburb}
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
                sx={sectionTitleSx}
              >
                <PersonIcon />
                {t("item.peopleInvolved", "People Involved")}
              </Typography>

              {/* Owner Information */}
              {owner && (
                <Box sx={{ ...personCardBaseSx, borderColor: "primary.light" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ ...boldSubtitleSx, color: "primary.main" }}
                  >
                    {t("item.owner", "Owner")}: {owner.nickname || owner.email}
                  </Typography>
                </Box>
              )}

              {/* Holder Information (if different from owner) */}
              {displayHolder && !isOwnerAndHolderSame && (
                <Box sx={{ ...personCardBaseSx, borderColor: "secondary.light" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ ...boldSubtitleSx, color: "secondary.main" }}
                  >
                    {t("item.currentHolder", "Current Holder")}:{" "}
                    {displayHolder.nickname || displayHolder.email}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Draft Email Editor */}
            <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
              <Typography variant="subtitle1" sx={{ ...boldSubtitleSx, mb: 2 }}>{t("item.draftEmail", "Draft Email")}</Typography>
              <TextField
                fullWidth
                multiline
                minRows={1}
                label={t("item.subject", "Subject")}
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                minRows={6}
                label={t("item.emailContent", "Email Content")}
                value={draftEmailContent}
                onChange={(e) => setDraftEmailContent(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Notification Information */}
            <Box sx={notificationBoxSx}>
              <Typography
                variant="subtitle1"
                sx={{ ...boldSubtitleSx, mb: 1 }}
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

      {!selectedPlaceIsUsable && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 3, pt: 2 }}
        >
          {t("item.chooseMeetingPlaceHint", "Choose where to meet to send your request.")}
        </Typography>
      )}
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading} size="large">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleConfirmRequest}
          variant="contained"
          color="primary"
          disabled={loading || !selectedPlaceIsUsable}
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
