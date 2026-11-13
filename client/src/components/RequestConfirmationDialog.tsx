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
  Alert,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
} from "@mui/material";
import {
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  NotificationImportant as NotificationIcon,
  MarkEmailUnread as EmailIcon,
  Edit as EditIcon,
  MenuBook as HolderPlaceIcon,
  MyLocation as YourPlaceIcon,
  WarningAmber as WarningAmberIcon,
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
import {
  isUsableSuburbLocation,
  suburbWithState,
  suggestSuburbs,
} from "../utils/suburbName";
import type { RequestError } from "../utils/requestErrors";
import { openEmailVerificationDialog } from "../utils/emailVerification";
import EmailVerificationCard from "./EmailVerificationCard";
import { requestRecipients } from "../utils/requestRecipients";
import BoldNames, { nameMarker } from "./BoldNames";
import RequestSentCard from "./RequestSentCard";

/** A message shown above the buttons: why sending failed, or that it can go now. */
export type RequestNotice = RequestError | { kind: "verified" };

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

/** The steps a new member must unlock before sending a request (Issue #258). */
type MissionStep = "verify" | "suburb" | "send";

/**
 * Colour by meaning, not by "something went wrong":
 * action needed = warning, not the person's fault = info,
 * something broke = error, done = success.
 */
function noticeSeverity(notice: RequestNotice): "warning" | "info" | "error" | "success" {
  switch (notice.kind) {
    case "verified":
      return "success";
    case "verification":
      return "warning";
    case "capacity":
    case "unavailable":
      return "info";
    default:
      return "error";
  }
}

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
  // Nicknames can be emails with no spaces; let them wrap.
  overflowWrap: "anywhere",
};

const boldSubtitleSx = {
  fontWeight: "bold",
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
  notice?: RequestNotice | null;
  // After a first request the same window shows "Request sent".
  sent?: boolean;
  onDone?: () => void;
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
  notice,
  sent = false,
  onDone,
}) => {
  const { t } = useTranslation();
  // Nothing is pre-selected: the person chooses where to meet (Issue #258, R7).
  const [selectedLocation, setSelectedLocation] =
    useState<TransactionLocation | null>(null);
  const [suburbInput, setSuburbInput] = useState("");
  const [suburbStatus, setSuburbStatus] = useState<SuburbStatus>("idle");
  const [savedSuburb, setSavedSuburb] = useState("");
  // Suggestions come from a list of NSW suburbs, loaded only when needed, so
  // only real suburb names can be saved ("chatswoods" suggests "Chatswood").
  const [allSuburbs, setAllSuburbs] = useState<string[] | null>(null);
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  const [suburbListOpen, setSuburbListOpen] = useState(false);
  const [checkSuburb] = useLazyQuery(CHECK_MEETING_SUBURB, {
    fetchPolicy: "network-only",
  });
  const [saveSuburb] = useMutation(SAVE_MEETING_SUBURB);
  // Verify before writing the request (Issue #258, D3, R4). Google sign-ins
  // and members who verified earlier skip this step.
  const [verifiedHere, setVerifiedHere] = useState(false);
  const needsVerification =
    !!requestor && !requestor.isVerified && !verifiedHere;
  // Fixed when the window opens, so finished steps stay visible as ticked.
  const [missionSteps, setMissionSteps] = useState<MissionStep[]>([]);
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
  const [editingDraft, setEditingDraft] = useState(false);

  const isOwnerAndHolderSame = owner?.id === holder?.id;
  const recipients = requestRecipients(owner, holder);
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
      setSelectedSuburb(null);
      setSuburbStatus("idle");
      setSavedSuburb("");
      setVerifiedHere(false);
      setEditingDraft(false);
      const steps: MissionStep[] = [];
      if (requestor && !requestor.isVerified) steps.push("verify");
      // "Where to meet" covers the suburb (if missing) and picking a place.
      const missingSuburb = !(requestor?.address && requestor?.location);
      if ((requestor && !requestor.isVerified) || missingSuburb) steps.push("suburb");
      steps.push("send");
      // Only show the strip when there is something to unlock.
      setMissionSteps(steps.length > 1 ? steps : []);
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

  useEffect(() => {
    if (!open || !needsSuburb || allSuburbs) return;
    let cancelled = false;
    import("../data/nswSuburbs").then((module) => {
      if (!cancelled) setAllSuburbs(module.NSW_SUBURBS);
    });
    return () => {
      cancelled = true;
    };
  }, [open, needsSuburb, allSuburbs]);

  const suburbSuggestions = allSuburbs ? suggestSuburbs(suburbInput, allSuburbs) : [];
  // Typed something, list is loaded, and nothing matches: warn under the field.
  const suburbNoMatch =
    !!allSuburbs &&
    !selectedSuburb &&
    suburbInput.trim().length >= 2 &&
    suburbSuggestions.length === 0;

  const holderAddress = displayHolder?.address || "";

  const selectedPlaceIsUsable =
    (selectedLocation === TransactionLocation.HolderLocation && !!holderAddress) ||
    (selectedLocation === TransactionLocation.RequestorLocation && !!requestorSuburb);

  // Step 2 is only done once a meeting place is actually chosen.
  const activeMissionStep: MissionStep = needsVerification
    ? "verify"
    : needsSuburb || !selectedPlaceIsUsable
      ? "suburb"
      : "send";
  const missionStepLabels: Record<MissionStep, string> = {
    verify: t("item.missionStepVerify", "Verify email"),
    suburb: t("item.missionStepPlace", "Where to meet"),
    send: t("item.missionStepSend", "Review and send"),
  };
  const missionStrip =
    missionSteps.length > 0 ? (
      // Stays at the top while the form scrolls.
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          pt: 1,
          pb: 2,
          mb: 1,
        }}
      >
        <Stepper
          activeStep={missionSteps.indexOf(activeMissionStep)}
          alternativeLabel
        >
          {missionSteps.map((step) => (
            <Step key={step}>
              <StepLabel
                StepIconProps={{
                  // Brighter than the theme's dark success green so the ticks
                  // read as "done" at a glance (3.8:1 on white, passes WCAG
                  // 1.4.11). Phase 4: move into semanticTokens.
                  sx: { "&.Mui-completed": { color: "#2A9455" } },
                }}
              >
                {missionStepLabels[step]}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    ) : null;

  const handleUseSuburb = async () => {
    // Search and save as "Chatswood NSW" so the map stays in New South Wales.
    const name = selectedSuburb ? suburbWithState(selectedSuburb) : "";
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={needsVerification || sent ? "xs" : "md"}
      fullWidth
      // Narrow side margins on phones so the window nearly fills the screen.
      PaperProps={{
        sx: {
          mx: { xs: 1, sm: 4 },
          width: { xs: "calc(100% - 16px)", sm: undefined },
        },
      }}
    >
      {sent ? (
        <DialogContent sx={{ p: 3 }}>
          <RequestSentCard
            recipients={recipients}
            onDone={onDone ?? onClose}
          />
        </DialogContent>
      ) : needsVerification ? (
        // Verifying is an account step, so it gets its own card, shown in
        // place of the request (one layer, no stacking).
        <DialogContent sx={{ p: 3 }}>
          {missionStrip}
          <EmailVerificationCard
            mode="blocking"
            showSuccess={false}
            onVerified={() => setVerifiedHere(true)}
            onExit={onClose}
          />
        </DialogContent>
      ) : (
      <>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationIcon color="primary" />
          {t("item.requestToBorrow", "Request To Borrow")}
        </Box>
      </DialogTitle>

      <DialogContent>
        {missionStrip}
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
                      <Autocomplete
                        fullWidth
                        size="small"
                        autoHighlight
                        options={suburbSuggestions}
                        open={suburbListOpen && suburbSuggestions.length > 0}
                        onOpen={() => setSuburbListOpen(true)}
                        onClose={() => setSuburbListOpen(false)}
                        filterOptions={(options) => options}
                        value={selectedSuburb}
                        onChange={(_event, value) => {
                          setSelectedSuburb(value);
                          if (suburbStatus !== "checking") setSuburbStatus("idle");
                        }}
                        inputValue={suburbInput}
                        onInputChange={(_event, value, reason) => {
                          setSuburbInput(value);
                          if (reason === "input") {
                            setSelectedSuburb(null);
                            if (suburbStatus !== "checking") setSuburbStatus("idle");
                          }
                        }}
                        noOptionsText={t(
                          "item.meetSuburbNoMatch",
                          "No matching suburb. Check the spelling.",
                        )}
                        loading={!allSuburbs}
                        disabled={suburbStatus === "checking"}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t("item.meetSuburbLabel", "Where can you meet?")}
                            placeholder={t("item.meetSuburbPlaceholder", "Suburb, e.g. Chatswood")}
                            InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                            error={suburbStatus === "notFound" || suburbStatus === "error"}
                            FormHelperTextProps={
                              suburbNoMatch && suburbStatus === "idle"
                                ? {
                                    sx: {
                                      color: "warning.dark",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      fontWeight: 500,
                                    },
                                  }
                                : undefined
                            }
                            helperText={
                              suburbNoMatch && suburbStatus === "idle" ? (
                                <>
                                  <WarningAmberIcon sx={{ fontSize: 16 }} />
                                  {t(
                                    "item.meetSuburbNoMatch",
                                    "No matching suburb. Check the spelling.",
                                  )}
                                </>
                              ) : suburbStatus === "notFound"
                                ? t("item.meetSuburbNotFound", "We couldn't find that suburb. Try another nearby one.")
                                : suburbStatus === "error"
                                  ? t("item.meetSuburbError", "We couldn't save it. Check your connection and try again.")
                                  : suburbInput.trim() && !selectedSuburb
                                    ? t("item.meetSuburbChoose", "Choose a suburb from the list.")
                                    : t("item.meetSuburbHelper", "Shared with the book's owner and holder.")
                            }
                          />
                        )}
                      />
                      <Button
                        variant={selectedSuburb ? "contained" : "outlined"}
                        onClick={handleUseSuburb}
                        disabled={!selectedSuburb || suburbStatus === "checking"}
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
                        <HolderPlaceIcon fontSize="small" color="action" />
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
                        <YourPlaceIcon fontSize="small" color="action" />
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

            {/* Email preview (Issue #258). Shown in full for review; editing is
                the exception. Header (To, Subject) is kept apart from the
                message. Owner and holder appear here as recipients. */}
            <Paper sx={{ p: 2, mb: 1, overflowWrap: "anywhere" }} variant="outlined">
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: "bold" }}>
                  {t("item.requestEmailTitle", "Your request email")}
                </Typography>
                {!editingDraft && (
                  <Button
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setEditingDraft(true)}
                    sx={{ minWidth: 0, py: 0 }}
                  >
                    {t("item.editShort", "Edit")}
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr)",
                  columnGap: 1.5,
                  rowGap: 0.5,
                  typography: "body2",
                }}
              >
                <Box sx={{ color: "text.secondary" }}>{t("item.emailTo", "To")}</Box>
                <Box>
                  <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    {recipients.ownerName}
                  </Box>{" "}
                  {recipients.holderName
                    ? t("item.roleOwnerShort", "(owner)")
                    : t("item.roleOwnerAndHolderShort", "(owner, has the book)")}
                  {recipients.holderName && (
                    <>
                      ,{" "}
                      <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
                        {recipients.holderName}
                      </Box>{" "}
                      {t("item.roleHolderShort", "(holder)")}
                    </>
                  )}
                </Box>
                {!editingDraft && (
                  <>
                    <Box sx={{ color: "text.secondary" }}>{t("item.subject", "Subject")}</Box>
                    <Box>{draftSubject.trim() || defaultSubject}</Box>
                  </>
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {editingDraft ? (
                <Box>
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
                    minRows={5}
                    label={t("item.emailContent", "Email Content")}
                    value={draftEmailContent}
                    onChange={(e) => setDraftEmailContent(e.target.value)}
                  />
                  <Box sx={{ textAlign: "right", mt: 1 }}>
                    <Button size="small" onClick={() => setEditingDraft(false)}>
                      {t("item.doneEditingDraft", "Done editing")}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {draftEmailContent.trim()}
                </Typography>
              )}
            </Paper>

          </Box>
        }
      </DialogContent>

      {notice && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert
            severity={noticeSeverity(notice)}
            action={
              notice.kind === "verification" ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => openEmailVerificationDialog("blocking")}
                  sx={{ whiteSpace: "nowrap", alignSelf: "center" }}
                >
                  {t("item.requestVerifyEmailButton", "Verify email")}
                </Button>
              ) : undefined
            }
          >
            {notice.kind === "verification" &&
              t(
                "item.requestErrorVerification",
                "Verify your email to send this request.",
              )}
            {notice.kind === "verified" &&
              t(
                "item.requestVerifiedNowSend",
                "Email verified. Press \"Send request\" to send it.",
              )}
            {notice.kind === "capacity" &&
              t(
                "item.requestErrorCapacity",
                "This book already has {{count}} requests waiting. Tap ♡ to save it to your booklist and check back later, or look for another book.",
                { count: notice.count ?? 2 },
              )}
            {notice.kind === "unavailable" &&
              t(
                "item.requestErrorUnavailable",
                "This book can't be requested anymore. It may have been removed or changed.",
              )}
            {notice.kind === "other" &&
              t(
                "item.requestErrorOther",
                "We couldn't send your request. Check your connection and try again. Your message is kept.",
              )}
          </Alert>
        </Box>
      )}
      {/* Inline confirmation: who gets emailed the moment they press send. */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Alert
          severity="info"
          icon={<EmailIcon fontSize="inherit" />}
          sx={{ overflowWrap: "anywhere" }}
        >
          <BoldNames
            names={{ owner: recipients.ownerName, holder: recipients.holderName ?? "" }}
            text={
              recipients.holderName
                ? t(
                    "item.sendEmailsWho",
                    "Pressing Send request emails {{owner}} (owner) and {{holder}} (holder) now. You'll get a copy.",
                    { owner: nameMarker("owner"), holder: nameMarker("holder") },
                  )
                : t(
                    "item.sendEmailsWhoSame",
                    "Pressing Send request emails {{owner}} now. They own this book and have it. You'll get a copy.",
                    { owner: nameMarker("owner") },
                  )
            }
          />
        </Alert>
      </Box>
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
            t("item.sendRequest", "Send request")
          )}
        </Button>
      </DialogActions>
      </>
      )}
    </Dialog>
  );
};

export default RequestConfirmationDialog;
