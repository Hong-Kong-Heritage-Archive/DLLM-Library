import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigateBack } from "../hook/useNavigateBack";
import {
  Container,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Divider,
  ListItem,
  ListItemText,
  ListItemIcon,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
import {
  ArrowBack,
  SwapHoriz as SwapHorizIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Done as DoneIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Email as EmailIcon,
  AccountBox as AccountBoxIcon,
  PersonAdd as PersonAddIcon,
  Home as HomeIcon,
  Image as ImageIcon,
  Share as ShareIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import {
  User,
  Transaction,
  TransactionStatus,
  Role,
} from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReceiptImageUploadDialog from "./ReceiptImageUploadDialog";
import { AuthDialog } from "./Auth";
import ShareTransactionDialog from "./ShareTransactionDialog";
import { QRCodeSVG } from "qrcode.react";
import { semanticTokens } from "../styles/semanticTokens";
import DetailSectionCard from "../styles/DetailSectionCard";
import {
  buildTransactionWorkflowState,
  type TransactionWorkflowState,
} from "../utils/transactionWorkflow";
import { getTransactionStatusChipProps } from "../utils/itemStatusChip";

// Create a custom icon using Leaflet's default marker
const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 23],
});

const GET_TRANSACTION = gql`
  query GetTransaction($id: ID!) {
    transaction(id: $id) {
      id
      status
      createdAt
      updatedAt
      item {
        id
        name
        description
        images
        thumbnails
        condition
        category
        ownerId
        holderId
        location {
          latitude
          longitude
        }
      }
      details
      requestor {
        id
        nickname
        email
        contactMethods {
          type
          value
          isPublic
        }
        location {
          latitude
          longitude
        }
        role
        address
      }
      receiver {
        id
        nickname
        email
        contactMethods {
          type
          value
          isPublic
        }
        location {
          latitude
          longitude
        }
        role
        address
      }
      location {
        latitude
        longitude
      }
      images
    }
  }
`;

const RECEIVE_TRANSACTION = gql`
  mutation ReceiveTransaction($id: ID!, $images: [String!]) {
    receiveTransaction(id: $id, images: $images) {
      id
      status
      updatedAt
      images
    }
  }
`;

const CANCEL_TRANSACTION = gql`
  mutation CancelTransaction($id: ID!) {
    cancelTransaction(id: $id)
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

// Add this helper function before the TransactionDetailPage component
const parseTransactionDetails = (details: string | null | undefined) => {
  if (!details) return null;

  try {
    return JSON.parse(details);
  } catch (error) {
    console.error("Error parsing transaction details:", error);
    return null;
  }
};

// Add this component before TransactionDetailPage to display JSON data nicely
interface JsonViewerProps {
  data: any;
  level?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, level = 0 }) => {
  const { t } = useTranslation();

  if (data === null || data === undefined) {
    return (
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontStyle: "italic" }}
      >
        {t("common.null", "null")}
      </Typography>
    );
  }

  if (typeof data !== "object") {
    return (
      <Typography variant="body2" sx={{ color: "text.primary" }}>
        {String(data)}
      </Typography>
    );
  }

  if (Array.isArray(data)) {
    return (
      <Box sx={{ pl: level * 2 }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: "medium", color: "text.secondary" }}
            >
              [{index}]:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <JsonViewer data={item} level={level + 1} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ pl: level * 2 }}>
      {Object.entries(data).map(([key, value]) => (
        <Box key={key} sx={{ mb: 1 }}>
          <Typography
            variant="body2"
            component="span"
            sx={{ fontWeight: "medium", color: "primary.main" }}
          >
            {key}:
          </Typography>{" "}
          {typeof value === "object" ? (
            <Box sx={{ mt: 0.5 }}>
              <JsonViewer data={value} level={level + 1} />
            </Box>
          ) : (
            <Typography
              variant="body2"
              component="span"
              sx={{ color: "text.primary" }}
            >
              {String(value)}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

// Add this helper function for action button descriptions
const getActionButtonDescription = (
  t: any,
  action: string,
  status: TransactionStatus,
): string => {
  const actionDescriptionMap: Record<string, string> = {
    approve: t(
      "transactions.actionApproveDescription",
      "Click this after reviewing the requestor's information and deciding to proceed with the exchange.",
    ),
    transfer: t(
      "transactions.actionTransferDescription",
      "Click this only AFTER you have physically handed over the item to the requestor at the exchange location.",
    ),
    receive: t(
      "transactions.actionReceiveDescription",
      "Click this after inspecting the item's condition. You can optionally take photos to document the item's state at receipt.",
    ),
    cancel:
      status === TransactionStatus.Pending
        ? t(
          "transactions.actionCancelPendingDescription",
          "Cancel this transaction request. The item will remain with the current holder.",
        )
        : t(
          "transactions.actionCancelApprovedDescription",
          "Cancel this approved transaction. Use this if you can no longer proceed with the exchange.",
        ),
  };

  return actionDescriptionMap[action] || "";
};

const pageContainerSx = { py: 4 };
const headerRowSx = { display: "flex", alignItems: "center", mb: 3 };
const backIconButtonSx = { mr: 2 };
const headerTitleSx = { flexGrow: 1 };
const headerShareButtonSx = { mr: 2 };
const qrWrapperSx = {
  display: "flex",
  justifyContent: "center",
  mb: 3,
  p: 3,
  bgcolor: semanticTokens.color.bgSurface,
  borderRadius: 2,
  border: 1,
  borderColor: "divider",
};
const sectionPaperSx = { p: 3, mb: 3 };
const sectionTitleSx = { mb: 2 };
const currentStatusBoxSx = { mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 };
const boldSubtitleSx = { mb: 1, fontWeight: "bold" };
const inlineIconRowSx = { display: "flex", alignItems: "center", gap: 1 };
const actionsColumnSx = { display: "flex", flexDirection: "column", gap: 2, mt: 3 };
const actionHintSx = { display: "block", mt: 0.5, px: 1 };
const compactDividerSx = { my: 1 };
const headingWithIconSx = { mb: 2, display: "flex", alignItems: "center" };
const iconStartSx = { mr: 1 };
const listItemNoPaddingSx = { px: 0 };
const loadingCenterSx = { display: "flex", justifyContent: "center", py: 4 };
const mt1Sx = { mt: 1 };
const participantCardBaseSx = {
  border: 1,
  height: "100%",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "action.hover",
  },
};
const participantTitlePrimarySx = {
  mb: 1,
  color: "primary.main",
  fontWeight: "bold",
};
const participantTitleSecondarySx = {
  mb: 1,
  color: "secondary.main",
  fontWeight: "bold",
};
const participantTitleInfoSx = {
  mb: 1,
  color: "info.main",
  fontWeight: "bold",
};
const itemCardSx = { border: 1, borderColor: "divider" };
const itemMediaSx = { objectFit: "cover" };
const itemDescriptionSx = { mt: 1 };
const itemCategoriesWrapSx = { mt: 2 };
const categoryChipSx = { mr: 1, mb: 1 };
const mapContainerBoxSx = {
  height: 300,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
};
const flowFrameSx = {
  width: "100%",
  maxWidth: "900px",
  mx: "auto",
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  p: 2,
  bgcolor: "background.default",
};
const flowImageStyle: React.CSSProperties = { width: "100%", height: "auto" };
const receiptImageListSx = { width: "100%", maxHeight: 500 };
const receiptImageStyle: React.CSSProperties = {
  objectFit: "cover",
  width: "100%",
  height: "100%",
  cursor: "pointer",
};
const locationPromptModalSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxWidth: 400,
  width: "90%",
};
const locationPromptActionsSx = {
  display: "flex",
  gap: 2,
  justifyContent: "flex-end",
};

const TransactionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user } = useOutletContext<OutletContext>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add state for receipt image upload dialog
  const [receiptImageDialogOpen, setReceiptImageDialogOpen] = useState(false);

  // Add state for share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Simplified auth state
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultSignUp, setAuthDefaultSignUp] = useState(false);
  const [pendingReceiveAction, setPendingReceiveAction] = useState(false);

  // State for location prompt dialog
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    transaction: Transaction;
  }>(GET_TRANSACTION, {
    variables: { id: transactionId! },
    skip: !transactionId,
  });

  const [receiveTransaction] = useMutation(RECEIVE_TRANSACTION);
  const [cancelTransaction] = useMutation(CANCEL_TRANSACTION);

  const handleBack = useNavigateBack("/transactions");

  const handleAction = async (action: string, mutation: any) => {
    if (!transactionId) return;

    setActionLoading(action);
    try {
      await mutation({
        variables: { id: transactionId },
      });
      await refetch();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getStatusIcon = (status: TransactionStatus): React.ReactElement => {
    const statusIconMap: Partial<
      Record<TransactionStatus, React.ReactElement>
    > = {
      [TransactionStatus.Pending]: <ScheduleIcon color="warning" />,
      [TransactionStatus.Approved]: <CheckCircleIcon color="success" />,
      [TransactionStatus.Transfered]: <LocalShippingIcon color="primary" />,
      [TransactionStatus.Completed]: <DoneIcon color="success" />,
      [TransactionStatus.Cancelled]: <CancelIcon color="error" />,
    };

    return statusIconMap[status] || <SwapHorizIcon />;
  };

  const getStatusColor = (status: TransactionStatus) => {
    const palette = getTransactionStatusChipProps(status);
    return {
      backgroundColor: palette.bgColor,
      color: palette.color,
      borderColor: palette.borderColor,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ownerId = data?.transaction?.item?.ownerId;
  const holderId = data?.transaction?.item?.holderId;
  const requestorId = data?.transaction?.requestor?.id;
  const receiverId = data?.transaction?.receiver?.id;
  const isExchangePointTransaction =
    (data?.transaction?.receiver &&
      data?.transaction?.receiver.role === Role.ExchangePointAdmin) ||
    (data?.transaction?.requestor &&
      data?.transaction?.requestor.role === Role.ExchangePointAdmin);
  const isOwner = user && user?.id === ownerId;
  const isHolder = holderId ? user && user?.id === holderId : isOwner;
  const isRequestor = user && user.id === requestorId;
  const isReceiver = user && user.id === receiverId;
  const isQuickExchange =
    (data?.transaction?.receiver === null ||
      data?.transaction?.receiver === undefined) &&
    (ownerId === requestorId || holderId === requestorId);
  const isAdmin =
    user?.role === Role.Admin ||
    user?.role === Role.Moderator ||
    user?.role === Role.ExchangePointAdmin;

  if (loading) {
    return (
      <Container maxWidth="md" sx={pageContainerSx}>
        <Box sx={loadingCenterSx}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !data?.transaction) {
    return (
      <Container maxWidth="md" sx={pageContainerSx}>
        <Box sx={headerRowSx}>
          <IconButton onClick={handleBack} sx={backIconButtonSx}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {t("transactions.detail", "Record")}
          </Typography>
        </Box>
        <Alert severity="error">
          {error
            ? `${t(
              "transactions.errorLoading",
              "Error loading transaction",
            )}: ${error.message}`
            : t("transactions.notFound", "Transaction not found")}
        </Alert>
      </Container>
    );
  }

  const transaction = data.transaction;
  const location = transaction.location || transaction.item?.location;
  const holder = transaction.item?.holderId
    ? { id: transaction.item.holderId }
    : null;

  // Parse transaction details
  const transactionDetails = parseTransactionDetails(transaction.details);

  // Update the receive handler to open dialog instead of direct mutation
  const handleReceiveClick = () => {
    if (isQuickExchange && !user) {
      setAuthDefaultSignUp(false); // Default to sign in
      setAuthDialogOpen(true);
      setPendingReceiveAction(true);
      return;
    }

    if (user && (!user.location?.latitude || !user.location?.longitude)) {
      setLocationPromptOpen(true);
      return;
    }

    setReceiptImageDialogOpen(true);
  };

  const handleConfirmReceive = async (images: string[]) => {
    if (!transactionId) return;

    setActionLoading("receive");
    try {
      await receiveTransaction({
        variables: {
          id: transactionId,
          images: images.length > 0 ? images : null,
        },
      });
      await refetch();
      setReceiptImageDialogOpen(false);
      setPendingReceiveAction(false);
    } catch (err) {
      console.error("Error confirming receipt:", err);
      alert(t("transactions.receiveError", "Failed to confirm receipt"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseReceiptDialog = () => {
    if (actionLoading !== "receive") {
      setReceiptImageDialogOpen(false);
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);

    setTimeout(() => {
      if (pendingReceiveAction) {
        setReceiptImageDialogOpen(true);
      }
    }, 500);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
    setPendingReceiveAction(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthDefaultSignUp(!authDefaultSignUp);
  };

  const handleGoToProfile = () => {
    setLocationPromptOpen(false);
    navigate("/profile");
  };

  // Generate the full transaction URL
  const transactionUrl = `${window.location.origin}/transaction/${transactionId}`;

  const workflowState: TransactionWorkflowState = buildTransactionWorkflowState({
    status: transaction.status,
    isOwner: isOwner || false,
    isHolder: isHolder || false,
    isRequestor: isRequestor || false,
    isReceiver: isReceiver || false,
    isQuickExchange: isQuickExchange || false,
    isAdmin,
    translate: (key, fallback) => t(key, fallback),
  });

  // Determine transaction type
  const getTransactionType = ():
    | "faceToFace"
    | "directExchange"
    | "exchangePoint"
    | null => {

    if (!transaction) return null;

    // Check if it's an exchange point transaction
    if (isExchangePointTransaction) return "exchangePoint";

    // Check if it's a face-to-face quick exchange
    if (isQuickExchange) return "faceToFace";

    // Default to direct exchange
    return "directExchange";
  };

  const transactionType = getTransactionType();

  return (
    <Container maxWidth="md" sx={pageContainerSx}>
      {/* Header */}
      <Box sx={headerRowSx}>
        <IconButton onClick={handleBack} sx={backIconButtonSx}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={headerTitleSx}>
          {t("transactions.details", "Transaction Detail")}
        </Typography>

        {/* Share Button - Add to header */}
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={() => setShareDialogOpen(true)}
          sx={headerShareButtonSx}
        >
          {t("transactions.share", "Share")}
        </Button>

        <Chip
          icon={getStatusIcon(transaction.status)}
          label={t(
            `transactions.status.${transaction.status.toLowerCase()}`,
            transaction.status,
          )}
          size="medium"
          sx={{
            ...getStatusColor(transaction.status),
            border: `1px solid ${getTransactionStatusChipProps(transaction.status).borderColor}`,
            fontWeight: 700,
            ".MuiChip-icon": {
              color: getTransactionStatusChipProps(transaction.status).color,
            },
          }}
        />
      </Box>

      <Alert
        severity={workflowState.severity}
        icon={<PersonIcon />}
        sx={sectionTitleSx}
      >
        <Typography variant="subtitle2" sx={boldSubtitleSx}>
          {t(
            `transactions.workflow.${workflowState.role}Heading`,
            workflowState.heading,
          )}
        </Typography>
        <Typography variant="body2">
          {workflowState.description}
        </Typography>
      </Alert>

      <Box sx={qrWrapperSx}>
        <QRCodeSVG
          value={transactionUrl}
          size={200}
          level="H"
          includeMargin={true}
        />
      </Box>

      {/* Action Buttons - Enhanced with descriptions */}
      <Paper elevation={1} sx={sectionPaperSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          {t("transactions.actions", "Actions")}
        </Typography>

        {/* Current Status Indicator */}
        <Box sx={currentStatusBoxSx}>
          <Typography variant="subtitle2" sx={boldSubtitleSx}>
            {t("transactions.currentStatus", "Current Status")}:
          </Typography>
          <Box sx={inlineIconRowSx}>
            {getStatusIcon(transaction.status)}
            <Typography variant="body1" sx={boldSubtitleSx}>
              {t(
                `transactions.status.${transaction.status.toLowerCase()}`,
                transaction.status,
              )}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={mt1Sx}>
            {workflowState.description}
          </Typography>
        </Box>

        <Box sx={actionsColumnSx}>
          {workflowState.primaryAction === "approve" && (isOwner || isRequestor) && (
            <Alert severity="info" icon={<CheckCircleIcon />}>
              {t(
                "transactions.workflow.approveHint",
                "Approval is current next step. Use transaction workflow controls available in your current release.",
              )}
            </Alert>
          )}

          {workflowState.primaryAction === "handoff" && (isOwner || isHolder) && (
            <Alert severity="info" icon={<LocalShippingIcon />}>
              {t(
                "transactions.workflow.handoffHint",
                "Handoff is current next step. Record transfer with workflow controls available in your current release.",
              )}
            </Alert>
          )}

          {(isOwner || isRequestor) &&
            (transaction.status === TransactionStatus.Pending ||
              transaction.status === TransactionStatus.Approved) && (
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleAction("cancel", cancelTransaction)}
                  disabled={actionLoading === "cancel"}
                  startIcon={
                    actionLoading === "cancel" ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CancelIcon />
                    )
                  }
                  fullWidth
                >
                  {t("transactions.cancel", "Cancel")}
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={actionHintSx}
                >
                  {getActionButtonDescription(t, "cancel", transaction.status)}
                </Typography>
              </Box>
            )}

          {/* Receive Button - Transferred */}
          {!isHolder &&
            !isOwner &&
            (isRequestor || isReceiver || isQuickExchange) &&
            transaction.status === TransactionStatus.Transfered && (
              <>
                <Box>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleReceiveClick}
                    disabled={actionLoading === "receive"}
                    startIcon={actionLoading === "receive" ? (<CircularProgress size={20} />) : (<DoneIcon />)}
                    fullWidth
                  >
                    {t("transactions.receive", "Confirm and document condition photos")}
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={actionHintSx}
                  >
                    {getActionButtonDescription(t, "receive", transaction.status)}
                  </Typography>
                </Box>

                {isQuickExchange && !user && (
                  <Alert severity="info">
                    {t("transactions.signInToConfirm",
                      "Please sign in or create an account to confirm receipt of this item.")}
                  </Alert>
                )}
              </>
            )}

          {/* No actions available */}
          {!(
            (isOwner &&
              (transaction.status === TransactionStatus.Pending ||
                transaction.status === TransactionStatus.Approved)) ||
            (isRequestor &&
              (transaction.status === TransactionStatus.Pending ||
                transaction.status === TransactionStatus.Transfered)) ||
            (isHolder &&
              (transaction.status === TransactionStatus.Pending ||
                transaction.status === TransactionStatus.Transfered)) ||
            ((isReceiver || isQuickExchange || isHolder) &&
              transaction.status === TransactionStatus.Transfered)
          ) && (
              <Alert severity="info">
                {t("transactions.noActionsAvailable", "No actions available for this transaction.")}
              </Alert>
            )}

          {/* Share Button - Always available */}
          <Divider sx={compactDividerSx} />
          <Box>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => setShareDialogOpen(true)}
              fullWidth
            >
              {t("transactions.share", "Share Transaction")}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={actionHintSx}
            >
              {t(
                "transactions.shareDescription",
                "Share this transaction link with the other party for easy access and coordination.",
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Transaction Info */}
      <Paper elevation={1} sx={sectionPaperSx}>
        <Typography
          variant="h6"
          sx={headingWithIconSx}
        >
          <SwapHorizIcon sx={iconStartSx} />
          {t("transactions.transactionInfo", "Transaction Information")}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ListItem sx={listItemNoPaddingSx}>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("transactions.created", "Created")}
                secondary={formatDate(transaction.createdAt)}
              />
            </ListItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ListItem sx={listItemNoPaddingSx}>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("transactions.lastUpdated", "Last Updated")}
                secondary={formatDate(transaction.updatedAt)}
              />
            </ListItem>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            {transactionDetails &&
              Object.entries(transactionDetails).map(([key, value]) => (
                <ListItem key={key} sx={listItemNoPaddingSx}>
                  <ListItemText
                    primary={t(`transactions.transactionDetails.${key}`, key)}
                    secondary={String(value)}
                  />
                </ListItem>
              ))}
          </Grid>
        </Grid>
      </Paper>

      {/* Participants Info */}
      <Paper elevation={1} sx={sectionPaperSx}>
        <Typography
          variant="h6"
          sx={headingWithIconSx}
        >
          <PersonIcon sx={iconStartSx} />
          {t("transactions.participants", "Participants")}
        </Typography>

        <Grid container spacing={2}>
          {/* Requestor */}
          <Grid size={{ xs: 12, md: transaction.receiver ? 4 : 6 }}>
            <Card
              elevation={0}
              sx={{ ...participantCardBaseSx, borderColor: "primary.light" }}
              onClick={() =>
                handleNavigate(`/user/${transaction.requestor?.id}`)
              }
              title={t("user.viewProfile", "View user profile")}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={participantTitlePrimarySx}
                >
                  {t("transactions.requestorInfo", "Requested by")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t(
                    "transactions.requestorRelationship",
                    "This person initiated the exchange request.",
                  )}
                </Typography>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("user.nickname", "Nickname")}
                    secondary={
                      transaction.requestor?.nickname ||
                      t("user.notSet", "Not set")
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("user.email", "Email")}
                    secondary={
                      workflowState.showSensitiveDetails
                        ? transaction.requestor?.email
                        : t("transactions.privateContact", "Private contact")
                    }
                  />
                </ListItem>
                {workflowState.showSensitiveDetails && transaction.requestor?.address && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <HomeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t("user.address", "Address")}
                      secondary={transaction.requestor.address}
                    />
                  </ListItem>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Receiver (if different from requestor) */}
          {transaction.receiver &&
            transaction.receiver.id !== transaction.requestor?.id && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{ ...participantCardBaseSx, borderColor: "secondary.light" }}
                  onClick={() =>
                    handleNavigate(`/user/${transaction.receiver?.id}`)
                  }
                  title={t("user.viewProfile", "View user profile")}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      sx={participantTitleSecondarySx}
                    >
                      {t("transactions.receiverInfo", "Will receive the item")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t(
                        "transactions.receiverRelationship",
                        "This person is the intended recipient of the handoff.",
                      )}
                    </Typography>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <PersonAddIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t("user.nickname", "Nickname")}
                        secondary={
                          transaction.receiver?.nickname ||
                          t("user.notSet", "Not set")
                        }
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <EmailIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t("user.email", "Email")}
                        secondary={
                          workflowState.showSensitiveDetails
                            ? transaction.receiver?.email
                            : t("transactions.privateContact", "Private contact")
                        }
                      />
                    </ListItem>
                    {workflowState.showSensitiveDetails && transaction.receiver?.address && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <HomeIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={t("user.address", "Address")}
                          secondary={transaction.receiver.address}
                        />
                      </ListItem>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

          {/* Current Holder/Owner */}
          <Grid size={{ xs: 12, md: transaction.receiver ? 4 : 6 }}>
            <Card
              elevation={0}
              sx={{ ...participantCardBaseSx, borderColor: "info.light" }}
              onClick={() =>
                handleNavigate(`/user/${transaction.item.ownerId}`)
              }
              title={t("user.viewProfile", "View user profile")}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={participantTitleInfoSx}
                >
                  {t("transactions.holderInfo", "Currently holding the item")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t(
                    "transactions.holderRelationship",
                    "This person is currently responsible for the item until the exchange progresses.",
                  )}
                </Typography>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <AccountBoxIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={holder ? t("item.holder", "Holder") : t("item.owner", "Owner")}
                    secondary={holder ? t("transactions.holderIsRequestor", "Requestor has the item") : t("transactions.ownerHasItem", "Owner is holding the item")}
                  />
                </ListItem>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Item Info */}
      <Paper elevation={1} sx={sectionPaperSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          {t("transactions.itemInfo", "Item Information")}
        </Typography>

        <Card elevation={0} sx={itemCardSx}>
          <CardActionArea
            onClick={() => handleNavigate(`/item/${transaction.item.id}`)}
            title={t("item.viewDetail", "View item detail")}
          >
            <Grid container>
              {transaction.item?.images?.[0] && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      transaction.item.thumbnails?.[0] ||
                      transaction.item.images[0]
                    }
                    alt={transaction.item.name}
                    sx={itemMediaSx}
                  />
                </Grid>
              )}
              <Grid
                size={{ xs: 12, sm: transaction.item?.images?.[0] ? 8 : 12 }}
              >
                <CardContent>
                  <Typography variant="h6" component="h3">
                    {transaction.item?.name}
                  </Typography>
                  {transaction.item?.description && (
                    <DetailSectionCard
                      title={t("item.description", "Description")}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={itemDescriptionSx}
                      >
                        {transaction.item.description}
                      </Typography>
                    </DetailSectionCard>
                  )}
                  {transaction.item?.category && (
                    <Box sx={itemCategoriesWrapSx}>
                      {transaction.item.category.map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          size="small"
                          sx={categoryChipSx}
                        />
                      ))}
                    </Box>
                  )}
                  {transaction.item?.condition && (
                    <Typography variant="body2" sx={itemDescriptionSx}>
                      <strong>{t("item.condition", "Condition")}:</strong>{" "}
                      {transaction.item.condition}
                    </Typography>
                  )}
                </CardContent>
              </Grid>
            </Grid>
          </CardActionArea>
        </Card>
      </Paper>

      {/* Exchange Location Map */}
      {location && (
        <Paper elevation={1} sx={sectionPaperSx}>
          <Typography
            variant="h6"
            sx={headingWithIconSx}
          >
            <LocationOnIcon sx={iconStartSx} />
            {t("transactions.proposedExchangeLocation", "Proposed Exchange Location")}
          </Typography>

          <Box sx={mapContainerBoxSx}>
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>
                  <Typography variant="body2">
                    {t("transactions.exchangePoint", "Exchange Point")}
                    <br />
                    {transaction.item.name}
                  </Typography>
                </Popup>
              </Marker>
            </MapContainer>
          </Box>
        </Paper>
      )}

      {/* Transaction Flow Diagram - NEW SECTION */}
      {transactionType && (
        <Paper elevation={1} sx={sectionPaperSx}>
          <Typography
            variant="h6"
            sx={headingWithIconSx}
          >
            <InfoIcon sx={iconStartSx} />
            {t("transactions.transactionFlow", "Transaction Flow")}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {transactionType === "faceToFace" &&
                t(
                  "transactions.flowDescriptionFaceToFace",
                  "This is a Face-to-Face Quick Exchange. Review the flow diagram below to understand the steps involved.",
                )}
              {transactionType === "directExchange" &&
                t(
                  "transactions.flowDescriptionDirectExchange",
                  "This is a Direct Exchange at an agreed location. Review the flow diagram below to understand the steps involved.",
                )}
              {transactionType === "exchangePoint" &&
                t(
                  "transactions.flowDescriptionExchangePoint",
                  "This is an Exchange via Public Exchange Point. This involves two separate phases. Review the flow diagram below to understand the steps involved.",
                )}
            </Typography>
          </Alert>

          <Box sx={flowFrameSx}>
            {transactionType === "faceToFace" && (
              <img
                src={"/images/Face-to-Face.jpg"}
                alt={t(
                  "transactions.faceToFaceDiagramAlt",
                  "Face-to-Face Transaction Diagram",
                )}
                style={flowImageStyle}
              />
            )}
            {transactionType === "directExchange" && (
              <img
                src={"/images/Direct-exchange.jpg"}
                alt={t(
                  "transactions.directExchangeDiagramAlt",
                  "Direct Exchange Diagram",
                )}
                style={flowImageStyle}
              />
            )}
            {transactionType === "exchangePoint" && (
              <img
                src={"/images/Public-Exchange.jpg"}
                alt={t(
                  "transactions.exchangePointDiagramAlt",
                  "Exchange Point Diagram",
                )}
                style={flowImageStyle}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Add Receipt Images Section - Show when completed */}
      {transaction.status === TransactionStatus.Completed &&
        transaction.images &&
        transaction.images.length > 0 && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={headingWithIconSx}
            >
              <ImageIcon sx={iconStartSx} />
              {t("transactions.receiptImages", "Item Condition at Receipt")}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("transactions.receiptImagesDescription", "Photos taken when the item was received, documenting its condition.")}
            </Typography>

            <ImageList
              sx={receiptImageListSx}
              cols={3}
              rowHeight={200}
            >
              {transaction.images.map((image, index) => (
                <ImageListItem key={index}>
                  <img
                    src={image}
                    alt={`Receipt ${index + 1}`}
                    loading="lazy"
                    style={receiptImageStyle}
                    onClick={() => window.open(image, "_blank")}
                  />
                  <ImageListItemBar
                    title={t(
                      "transactions.receiptImage",
                      "Receipt Image {{number}}",
                      { number: index + 1 },
                    )}
                    subtitle={t("common.clickToEnlarge", "Click to enlarge")}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Paper>
        )}

      {/* Unified Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleCloseAuthDialog}
        onSuccess={handleAuthSuccess}
        onForgotPassword={() => {
          alert(t("auth.resetPasswordInfo", "Please contact support to reset your password."));
        }}
        defaultIsSignUp={authDefaultSignUp}
      />

      {/* Receipt Image Upload Dialog */}
      <ReceiptImageUploadDialog
        open={receiptImageDialogOpen}
        onClose={handleCloseReceiptDialog}
        onConfirm={handleConfirmReceive}
        loading={actionLoading === "receive"}
      />

      {/* Location Prompt Dialog */}
      <Modal
        open={locationPromptOpen}
        onClose={() => setLocationPromptOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={locationPromptOpen}>
          <Box sx={locationPromptModalSx}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("item.locationRequired", "Location Required")}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {t(
                "item.locationRequiredDescription",
                "Please set your location in your profile before receiving an item. This helps us match you with nearby items.",
              )}
            </Typography>
            <Box sx={locationPromptActionsSx}>
              <Button onClick={() => setLocationPromptOpen(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToProfile}
                startIcon={<LocationOnIcon />}
              >
                {t("item.goToProfile", "Go to Profile")}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Share Transaction Dialog */}
      <ShareTransactionDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        transactionUrl={transactionUrl}
        itemName={transaction.item?.name || ""}
      />
    </Container>
  );
};

export default TransactionDetailPage;
