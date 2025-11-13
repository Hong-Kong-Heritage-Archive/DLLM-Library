import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
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
  ContentCopy as ContentCopyIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { User, Transaction, TransactionStatus } from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReceiptImageUploadDialog from "./ReceiptImageUploadDialog";
import { AuthDialog } from "./Auth";

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

const APPROVE_TRANSACTION = gql`
  mutation ApproveTransaction($id: ID!) {
    approveTransaction(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const TRANSFER_TRANSACTION = gql`
  mutation TransferTransaction($id: ID!) {
    transferTransaction(id: $id) {
      id
      status
      updatedAt
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

interface ShareTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transactionUrl: string;
  itemName: string;
}

const ShareTransactionDialog: React.FC<ShareTransactionDialogProps> = ({
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(transactionUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = transactionUrl;
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
    window.open(url, "_blank");
  };

  const shareViaTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      transactionUrl
    )}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      transactionUrl
    )}`;
    window.open(url, "_blank");
  };

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      transactionUrl
    )}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
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
                    fontFamily: "monospace",
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
                  startIcon={<TwitterIcon sx={{ color: "#1DA1F2" }} />}
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
        onClose={() => setCopySuccess(false)}
        message={t("transactions.linkCopied", "Link copied to clipboard!")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
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

  // Add state for showing raw JSON
  const [showRawJson, setShowRawJson] = useState(false);

  // Simplified auth state
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultSignUp, setAuthDefaultSignUp] = useState(false);
  const [pendingReceiveAction, setPendingReceiveAction] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    transaction: Transaction;
  }>(GET_TRANSACTION, {
    variables: { id: transactionId! },
    skip: !transactionId,
  });

  const [approveTransaction] = useMutation(APPROVE_TRANSACTION);
  const [transferTransaction] = useMutation(TRANSFER_TRANSACTION);
  const [receiveTransaction] = useMutation(RECEIVE_TRANSACTION);
  const [cancelTransaction] = useMutation(CANCEL_TRANSACTION);

  const handleBack = () => {
    navigate(-1);
  };

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

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending:
        return <ScheduleIcon color="warning" />;
      case TransactionStatus.Approved:
        return <CheckCircleIcon color="success" />;
      case TransactionStatus.Transfered:
        return <LocalShippingIcon color="primary" />;
      case TransactionStatus.Completed:
        return <DoneIcon color="success" />;
      case TransactionStatus.Cancelled:
        return <CancelIcon color="error" />;
      default:
        return <SwapHorizIcon />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending:
        return "warning";
      case TransactionStatus.Approved:
        return "success";
      case TransactionStatus.Transfered:
        return "primary";
      case TransactionStatus.Completed:
        return "success";
      case TransactionStatus.Cancelled:
        return "error";
      default:
        return "default";
    }
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

  const isOwner = user?.id === data?.transaction?.item?.ownerId;
  const isRequestor = user && user.id === data?.transaction?.requestor?.id;
  const isReceiver = user && user.id === data?.transaction?.receiver?.id;
  const isQuickExchange =
    data?.transaction?.receiver === null ||
    data?.transaction?.receiver === undefined;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !data?.transaction) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {t("transactions.transactionDetail", "Transaction Detail")}
          </Typography>
        </Box>
        <Alert severity="error">
          {error
            ? `${t(
              "transactions.errorLoading",
              "Error loading transaction"
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

  // Generate the full transaction URL
  const transactionUrl = `${window.location.origin}/transaction/${transactionId}`;
  console.log("transactionDetails:", transactionDetails);
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t("transactions.transactionDetail", "Transaction Detail")}
        </Typography>

        {/* Share Button - Add to header */}
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={() => setShareDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          {t("transactions.share", "Share")}
        </Button>

        <Chip
          icon={getStatusIcon(transaction.status)}
          label={t(
            `transactions.status.${transaction.status.toLowerCase()}`,
            transaction.status
          )}
          color={getStatusColor(transaction.status) as any}
          size="medium"
        />
      </Box>

      {/* Transaction Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, display: "flex", alignItems: "center" }}
        >
          <SwapHorizIcon sx={{ mr: 1 }} />
          {t("transactions.transactionInfo", "Transaction Information")}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("transactions.created", "Created")}
                secondary={formatDate(transaction.createdAt)}
              />
            </ListItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("transactions.lastUpdated", "Last Updated")}
                secondary={formatDate(transaction.updatedAt)}
              />
            </ListItem>
          </Grid>

          <Grid>
            {transactionDetails &&
              Object.entries(transactionDetails).map(([key, value]) => (
                <ListItem key={key} sx={{ px: 0 }}>
                  <ListItemText
                    primary={t(`transactions.transactionDetails.${key}`, key)}
                    secondary={String(value)}
                  />
                </ListItem>
              ))}</Grid>
        </Grid>
      </Paper>

      {/* Transaction Details Section - Add this new section */}
      {/* {transactionDetails && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
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
              sx={{ display: "flex", alignItems: "center" }}
            >
              <AccountBoxIcon sx={{ mr: 1 }} />
              {t("transactions.details", "Transaction Details")}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson
                ? t("transactions.showFormatted", "Show Formatted")
                : t("transactions.showRaw", "Show Raw JSON")}
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {showRawJson ? (
            <Box
              sx={{
                bgcolor: "grey.100",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 400,
              }}
            >
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  m: 0,
                }}
              >
                {JSON.stringify(transactionDetails, null, 2)}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: "background.default",
                p: 2,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              <JsonViewer data={transactionDetails} />
            </Box>
          )}
        </Paper>
      )} */}

      {/* Item Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("transactions.itemInfo", "Item Information")}
        </Typography>

        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
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
                    sx={{ objectFit: "cover" }}
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {transaction.item.description}
                    </Typography>
                  )}
                  {transaction.item?.category && (
                    <Box sx={{ mt: 2 }}>
                      {transaction.item.category.map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  {transaction.item?.condition && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
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

      {/* Participants Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, display: "flex", alignItems: "center" }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          {t("transactions.participants", "Participants")}
        </Typography>

        <Grid container spacing={2}>
          {/* Requestor */}
          <Grid size={{ xs: 12, md: transaction.receiver ? 4 : 6 }}>
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: "primary.light",
                height: "100%",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
              onClick={() =>
                handleNavigate(`/user/${transaction.requestor?.id}`)
              }
              title={t("user.viewProfile", "View user profile")}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, color: "primary.main", fontWeight: "bold" }}
                >
                  {t("transactions.requestorInfo", "Requestor")}
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
                    secondary={transaction.requestor?.email}
                  />
                </ListItem>
                {transaction.requestor?.address && (
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
                  sx={{
                    border: 1,
                    borderColor: "secondary.light",
                    height: "100%",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() =>
                    handleNavigate(`/user/${transaction.receiver?.id}`)
                  }
                  title={t("user.viewProfile", "View user profile")}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1,
                        color: "secondary.main",
                        fontWeight: "bold",
                      }}
                    >
                      {t("transactions.receiverInfo", "Receiver")}
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
                        secondary={transaction.receiver?.email}
                      />
                    </ListItem>
                    {transaction.receiver?.address && (
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
              sx={{
                border: 1,
                borderColor: "info.light",
                height: "100%",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
              onClick={() =>
                handleNavigate(`/user/${transaction.item.ownerId}`)
              }
              title={t("user.viewProfile", "View user profile")}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, color: "info.main", fontWeight: "bold" }}
                >
                  {holder
                    ? t("transactions.holderInfo", "Current Holder")
                    : t("transactions.ownerInfo", "Owner")}
                </Typography>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <AccountBoxIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      holder
                        ? t("item.holder", "Holder")
                        : t("item.owner", "Owner")
                    }
                    secondary={
                      holder
                        ? t(
                          "transactions.holderIsRequestor",
                          "Requestor has the item"
                        )
                        : t("transactions.ownerHasItem", "Owner has the item")
                    }
                  />
                </ListItem>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Exchange Location Map */}
      {
        location && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center" }}
            >
              <LocationOnIcon sx={{ mr: 1 }} />
              {t("transactions.exchangeLocation", "Exchange Location")}
            </Typography>

            <Box
              sx={{
                height: 300,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
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
        )
      }

      {/* Add Receipt Images Section - Show when completed */}
      {
        transaction.status === TransactionStatus.Completed &&
        transaction.images &&
        transaction.images.length > 0 && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center" }}
            >
              <ImageIcon sx={{ mr: 1 }} />
              {t("transactions.receiptImages", "Item Condition at Receipt")}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                "transactions.receiptImagesDescription",
                "Photos taken when the item was received, documenting its condition."
              )}
            </Typography>

            <ImageList
              sx={{ width: "100%", maxHeight: 500 }}
              cols={3}
              rowHeight={200}
            >
              {transaction.images.map((image, index) => (
                <ImageListItem key={index}>
                  <img
                    src={image}
                    alt={`Receipt ${index + 1}`}
                    loading="lazy"
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(image, "_blank")}
                  />
                  <ImageListItemBar
                    title={t(
                      "transactions.receiptImage",
                      "Receipt Image {{number}}",
                      {
                        number: index + 1,
                      }
                    )}
                    subtitle={t("common.clickToEnlarge", "Click to enlarge")}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Paper>
        )
      }

      {/* Action Buttons */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("transactions.actions", "Actions")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Share Button */}
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
          >
            {t("transactions.share", "Share Transaction")}
          </Button>

          {/* Owner Actions */}
          {isOwner && transaction.status === TransactionStatus.Pending && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleAction("approve", approveTransaction)}
                disabled={actionLoading === "approve"}
                startIcon={
                  actionLoading === "approve" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                {t("transactions.approve", "Approve")}
              </Button>
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
              >
                {t("transactions.cancel", "Cancel")}
              </Button>
            </>
          )}

          {transaction.status === TransactionStatus.Approved && (
            <>
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
              >
                {t("transactions.cancel", "Cancel")}
              </Button>
              {isOwner && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleAction("transfer", transferTransaction)}
                  disabled={actionLoading === "transfer"}
                  startIcon={
                    actionLoading === "transfer" ? (
                      <CircularProgress size={20} />
                    ) : (
                      <LocalShippingIcon />
                    )
                  }
                >
                  {t("transactions.transfer", "Mark as Transferred")}
                </Button>
              )}
            </>
          )}

          {/* Receive Button */}
          {(isRequestor || isReceiver || isQuickExchange) &&
            transaction.status === TransactionStatus.Transfered && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleReceiveClick}
                  disabled={actionLoading === "receive"}
                  startIcon={
                    actionLoading === "receive" ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DoneIcon />
                    )
                  }
                >
                  {t("transactions.receive", "Confirm Received")}
                </Button>

                {isQuickExchange && !user && (
                  <Alert severity="info" sx={{ flexBasis: "100%" }}>
                    {t(
                      "transactions.signInToConfirm",
                      "Please sign in or create an account to confirm receipt of this item."
                    )}
                  </Alert>
                )}
              </>
            )}

          {/* Cancel button for requestor when pending */}
          {isRequestor && transaction.status === TransactionStatus.Pending && (
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
            >
              {t("transactions.cancel", "Cancel Request")}
            </Button>
          )}

          {/* No actions available */}
          {!(
            (isOwner &&
              (transaction.status === TransactionStatus.Pending ||
                transaction.status === TransactionStatus.Approved)) ||
            (isRequestor &&
              (transaction.status === TransactionStatus.Pending ||
                transaction.status === TransactionStatus.Transfered)) ||
            ((isReceiver || isQuickExchange) &&
              transaction.status === TransactionStatus.Transfered)
          ) && (
              <Alert severity="info" sx={{ width: "100%" }}>
                {t(
                  "transactions.noActionsAvailable",
                  "No actions available for this transaction."
                )}
              </Alert>
            )}
        </Box>
      </Paper>

      {/* Unified Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleCloseAuthDialog}
        onSuccess={handleAuthSuccess}
        onForgotPassword={() => {
          alert(
            t(
              "auth.resetPasswordInfo",
              "Please contact support to reset your password."
            )
          );
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

      {/* Share Transaction Dialog */}
      <ShareTransactionDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        transactionUrl={transactionUrl}
        itemName={transaction.item?.name || ""}
      />
    </Container >
  );
};

export default TransactionDetailPage;
