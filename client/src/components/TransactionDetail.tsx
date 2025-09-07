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
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { User, Transaction, TransactionStatus } from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
        location {
          latitude
          longitude
        }
      }
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
  mutation ReceiveTransaction($id: ID!) {
    receiveTransaction(id: $id) {
      id
      status
      updatedAt
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

const TransactionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user } = useOutletContext<OutletContext>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  const isRequestor = user?.id === data?.transaction?.requestor?.id;

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
        </Grid>
      </Paper>

      {/* Item Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("transactions.itemInfo", "Item Information")}
        </Typography>

        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
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
            <Grid size={{ xs: 12, sm: transaction.item?.images?.[0] ? 8 : 12 }}>
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
        </Card>
      </Paper>

      {/* Requestor Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, display: "flex", alignItems: "center" }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          {t("transactions.requestorInfo", "Requestor Information")}
        </Typography>

        <List>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("user.nickname", "Nickname")}
              secondary={
                transaction.requestor?.nickname || t("user.notSet", "Not set")
              }
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("user.email", "Email")}
              secondary={transaction.requestor?.email}
            />
          </ListItem>
          {transaction.requestor?.address && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <LocationOnIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("user.address", "Address")}
                secondary={transaction.requestor.address}
              />
            </ListItem>
          )}
        </List>

        {/* Contact Methods - Only show to item owner */}
        {isOwner && transaction.requestor?.contactMethods && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("user.contactMethods", "Contact Methods")}:
            </Typography>
            {transaction.requestor.contactMethods
              .filter((contact) => contact.isPublic)
              .map((contact, index) => (
                <Chip
                  key={index}
                  label={`${contact.type}: ${contact.value}`}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
          </Box>
        )}
      </Paper>

      {/* Exchange Location Map */}
      {transaction.item?.location && (
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
              center={[
                transaction.item.location.latitude,
                transaction.item.location.longitude,
              ]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[
                  transaction.item.location.latitude,
                  transaction.item.location.longitude,
                ]}
              >
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

      {/* Action Buttons */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("transactions.actions", "Actions")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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

          {isOwner && transaction.status === TransactionStatus.Approved && (
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

          {/* Requestor Actions */}
          {isRequestor &&
            transaction.status === TransactionStatus.Transfered && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleAction("receive", receiveTransaction)}
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
                transaction.status === TransactionStatus.Transfered))
          ) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t(
                "transactions.noActionsAvailable",
                "No actions available for this transaction."
              )}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TransactionDetailPage;
