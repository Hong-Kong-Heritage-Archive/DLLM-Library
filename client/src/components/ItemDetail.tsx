// ItemDetail.tsx - Updated version
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Container,
  Paper,
  Snackbar,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
  SwapHoriz as TransferIcon,
  GetApp as ReceiveIcon,
  Home as NewHolderIcon,
} from "@mui/icons-material";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Item,
  Transaction,
  User,
  TransactionStatus,
  UpdateItemMutation,
  UpdateItemMutationVariables,
} from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import SafeImage from "./SafeImage";
import RequestConfirmationDialog from "./RequestConfirmationDialog";
import EditItemForm from "./EditItemForm";

const ITEM_DETAIL_QUERY = gql`
  query Item($itemId: ID!) {
    item(id: $itemId) {
      id
      name
      description
      condition
      category
      status
      images
      publishedYear
      language
      createdAt
      ownerId
      holderId
    }
  }
`;

const CREATE_TRANSACTION_MUTATION = gql`
  mutation CreateTransaction($itemId: ID!) {
    createTransaction(itemId: $itemId) {
      id
      status
      createdAt
      updatedAt
    }
  }
`;

const USER_QUERY = gql`
  query User($userId: ID!) {
    user(id: $userId) {
      createdAt
      email
      id
      nickname
      contactMethods {
        type
        value
        isPublic
      }
      address
      location {
        latitude
        longitude
      }
    }
  }
`;

const OPEN_TRANSACTIONS_QUERY = gql`
  query OpenTransactionsByItem($itemId: ID!) {
    openTransactionsByItem(itemId: $itemId) {
      id
      requestor {
        id
        nickname
        email
      }
      status
      createdAt
      updatedAt
    }
  }
`;

const APPROVE_TRANSACTION_MUTATION = gql`
  mutation ApproveTransaction($transactionId: ID!) {
    approveTransaction(id: $transactionId) {
      id
      status
      updatedAt
    }
  }
`;

const CANCEL_TRANSACTION_MUTATION = gql`
  mutation CancelTransaction($transactionId: ID!) {
    cancelTransaction(id: $transactionId)
  }
`;

const TRANSFER_TRANSACTION_MUTATION = gql`
  mutation TransferTransaction($transactionId: ID!) {
    transferTransaction(id: $transactionId) {
      id
      status
      updatedAt
    }
  }
`;

const RECEIVE_TRANSACTION_MUTATION = gql`
  mutation ReceiveTransaction($transactionId: ID!) {
    receiveTransaction(id: $transactionId) {
      id
      status
      updatedAt
    }
  }
`;

interface ItemDetailProps {
  itemId: string | null;
  user?: User | null;
  onBack?: () => void;
}

interface ItemFormProps {
  onItemUpdated?: (data: UpdateItemMutation) => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, user, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for request dialog and notifications
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Add edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data, loading, error } = useQuery<{ item: Item }>(ITEM_DETAIL_QUERY, {
    variables: { itemId: itemId! },
    skip: !itemId,
  });

  // Query for owner details
  const { data: ownerData } = useQuery(USER_QUERY, {
    variables: { userId: data?.item.ownerId },
    skip: !data?.item.ownerId,
  });

  // Query for holder details (if different from owner)
  const { data: holderData } = useQuery(USER_QUERY, {
    variables: { userId: data?.item.holderId },
    skip: !data?.item.holderId || data?.item.holderId === data?.item.ownerId,
  });
  // Query for open transactions
  const {
    data: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery(OPEN_TRANSACTIONS_QUERY, {
    variables: { itemId: itemId! },
    skip: !itemId,
    fetchPolicy: "cache-and-network",
  });

  const [createTransaction, { loading: createTransactionLoading }] =
    useMutation(CREATE_TRANSACTION_MUTATION, {
      onCompleted: (data) => {
        setRequestDialogOpen(false);
        setSuccessSnackbarOpen(true);
        refetchTransactions(); // Refresh transactions after creating new one
        console.log("Transaction created:", data.createTransaction);
      },
      onError: (error) => {
        setRequestDialogOpen(false);
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
        console.error("Transaction creation error:", error);
      },
    });

  const [approveTransaction, { loading: approveLoading }] = useMutation(
    APPROVE_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        refetchTransactions();
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    }
  );

  const [cancelTransaction, { loading: cancelLoading }] = useMutation(
    CANCEL_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        refetchTransactions();
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    }
  );

  // Add the transfer mutation
  const [transferTransaction, { loading: transferLoading }] = useMutation(
    TRANSFER_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        refetchTransactions();
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    }
  );

  // Add the receive transaction mutation
  const [receiveTransaction, { loading: receiveLoading }] = useMutation(
    RECEIVE_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        refetchTransactions();
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    }
  );

  const isOwner = user && data?.item.ownerId === user.id;
  const isHolder =
    user &&
    (data?.item.holderId === user.id ||
      (isOwner && data?.item.holderId === null));
  const canCreateTransaction = user && !isHolder;

  // Get open transactions and find oldest one
  const openTransactions: Transaction[] =
    transactionsData?.openTransactionsByItem || [];
  const oldestTransaction =
    openTransactions && openTransactions.length > 0
      ? openTransactions[0]
      : null;

  const isRequestor = user && oldestTransaction?.requestor?.id === user.id;

  // Calculate distance between user and item owner
  const getDistanceToOwner = (): string | null => {
    const holder = holderData || ownerData;
    if (
      !user?.location?.latitude ||
      !user?.location?.longitude ||
      !holder?.user?.location?.latitude ||
      !holder?.user?.location?.longitude
    ) {
      return null;
    }

    const distance = calculateDistance(
      user.location.latitude,
      user.location.longitude,
      holder.user.location.latitude,
      holder.user.location.longitude
    );

    return formatDistance(distance);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleRequestClick = () => {
    setRequestDialogOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!itemId) return;

    try {
      await createTransaction({
        variables: { itemId },
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      await approveTransaction({
        variables: { transactionId },
      });
    } catch (error) {
      console.error("Error approving transaction:", error);
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    try {
      await cancelTransaction({
        variables: { transactionId },
      });
    } catch (error) {
      console.error("Error rejecting transaction:", error);
    }
  };

  const handleCompleteTransfer = async (transactionId: string) => {
    try {
      await transferTransaction({
        variables: { transactionId },
      });
    } catch (error) {
      console.error("Error completing transfer:", error);
    }
  };

  const handleReceiveItem = async (transactionId: string) => {
    try {
      await receiveTransaction({
        variables: { transactionId },
      });
    } catch (error) {
      console.error("Error receiving item:", error);
    }
  };
  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbarOpen(false);
    setErrorMessage("");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditSuccess = () => {
    setSuccessSnackbarOpen(true);
    // Refetch the item data to show updated information
    window.location.reload(); // Simple refresh, or you could refetch the query
  };

  const handleEditError = (message: string) => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
  };

  // Handle case when itemId is null
  if (!itemId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {t("item.details")}
          </Typography>
        </Box>
        <Alert severity="error">
          {t("item.noItemId")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        {data?.item ? (
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {data.item.name}
            {isOwner ? (
              <Chip
                label={t("item.owner", "Owner")}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            ) : (
              isHolder && (
                <Chip
                  label={t("item.holder", "Holder")}
                  color="secondary"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )
            )}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} />
            <Typography>{t("item.loadItems")}</Typography>
          </Box>
        )}
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("item.errorLoading")}:{" "}
          {error.message}
        </Alert>
      )}

      {/* Item Content */}
      {data?.item && (
        <Paper elevation={1} sx={{ p: 4 }}>
          {/* Pending Transaction Alert for Owner */}
          {isOwner &&
            oldestTransaction?.status === TransactionStatus.Pending && (
              <Card
                sx={{ mb: 4, border: "2px solid", borderColor: "warning.main" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="warning.dark">
                      {t("item.pendingRequest")}
                    </Typography>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>{oldestTransaction?.requestor?.nickname}</strong>
                    {t("item.hasRequested")}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("item.requestedOn", "Requested on")}:{" "}
                    {formatDate(oldestTransaction?.createdAt)}
                  </Typography>

                  {oldestTransaction?.requestor?.email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("item.contact", "Contact")}:{" "}
                      {oldestTransaction?.requestor?.email}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={() =>
                      handleRejectTransaction(oldestTransaction?.id)
                    }
                    disabled={cancelLoading || approveLoading}
                    size="large"
                  >
                    {cancelLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      t("item.reject")
                    )}
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() =>
                      handleApproveTransaction(oldestTransaction?.id)
                    }
                    disabled={approveLoading || cancelLoading}
                    size="large"
                  >
                    {approveLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      t("item.approve")
                    )}
                  </Button>
                </CardActions>
              </Card>
            )}

          {/* Approved Transaction Alert for Holder */}
          {isHolder &&
            oldestTransaction?.status === TransactionStatus.Approved && (
              <Card
                sx={{ mb: 4, border: "2px solid", borderColor: "success.main" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <TransferIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="success.dark">
                      {t("item.approvedTransfer")}
                    </Typography>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>{oldestTransaction?.requestor?.nickname}</strong>
                    {t("item.approvedForTransfer")}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("item.approvedOn")}:{" "}
                    {formatDate(oldestTransaction?.updatedAt)}
                  </Typography>

                  {oldestTransaction?.requestor?.email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("item.contact")}:{" "}
                      {oldestTransaction?.requestor?.email}
                    </Typography>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t("item.transferInstructions")}
                  </Alert>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<TransferIcon />}
                    onClick={() =>
                      handleCompleteTransfer(oldestTransaction?.id)
                    }
                    disabled={transferLoading}
                    size="large"
                  >
                    {transferLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      t("item.completeTransfer")
                    )}
                  </Button>
                </CardActions>
              </Card>
            )}

          {/* Transferred Transaction Alert for Requestor */}
          {isRequestor &&
            oldestTransaction?.status === TransactionStatus.Transfered && (
              <Card
                sx={{ mb: 4, border: "2px solid", borderColor: "info.main" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <ReceiveIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="info.dark">
                      {t("item.readyToReceive")}
                    </Typography>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {t("item.itemTransferred")}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("item.transferredOn")}:{" "}
                    {formatDate(oldestTransaction?.updatedAt)}
                  </Typography>

                  <Alert
                    severity="warning"
                    icon={<NewHolderIcon />}
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      {t("item.importantReminder")}
                    </Typography>
                    <Typography variant="body2">
                      {t("item.receiveInstructions")}
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                      <Typography component="li" variant="body2">
                        {t("item.responsibility1",
                          "Responding to future requests from other users"
                        )}
                      </Typography>
                      <Typography component="li" variant="body2">
                        {t(
                          "item.responsibility2",
                          "Handing over the item to the next requestor when needed"
                        )}
                      </Typography>
                      <Typography component="li" variant="body2">
                        {t(
                          "item.responsibility3",
                          "Returning the item to the original owner if requested"
                        )}
                      </Typography>
                    </Box>
                  </Alert>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t("item.confirmReceiptInstructions")}
                  </Alert>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<ReceiveIcon />}
                    onClick={() => handleReceiveItem(oldestTransaction?.id)}
                    disabled={receiveLoading}
                    size="large"
                  >
                    {receiveLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      t("item.received")
                    )}
                  </Button>
                </CardActions>
              </Card>
            )}

          {/* Categories */}
          {data.item.category && data.item.category.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {data.item.category.map((category, index) => (
                  <Chip
                    key={index}
                    label={category}
                    variant="outlined"
                    sx={{
                      backgroundColor:
                        category === "Comic" ? "primary.light" : "default",
                      color:
                        category === "Comic"
                          ? "primary.contrastText"
                          : "default",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Description */}
          {data.item.description && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  backgroundColor: "grey.50",
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                {data.item.description}
              </Typography>
            </Box>
          )}

          {/* Images */}
          {data.item.images && data.item.images.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                {data.item.images.map((image, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ overflow: "hidden" }}>
                      <img
                        src={image}
                        alt={`${data.item.name} - Image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "250px",
                          objectFit: "cover",
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Item Info Grid */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("item.condition", "Condition")}:</strong>{" "}
                  <Chip
                    label={data.item.condition}
                    color="default"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("item.status", "Status")}:</strong>{" "}
                  <Chip
                    label={data.item.status}
                    color={
                      data.item.status === "AVAILABLE"
                        ? "success"
                        : data.item.status === "EXCHANGEABLE"
                          ? "info"
                          : data.item.status === "GIFT"
                            ? "warning"
                            : "default"
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("common.language")}:</strong>{" "}
                  {data.item.language}
                </Typography>
              </Grid>
              {data.item.publishedYear && (
                <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.publishedYear")}:</strong>{" "}
                    {data.item.publishedYear}
                  </Typography>
                </Grid>
              )}
              <Grid size={user && getDistanceToOwner() ? 6 : 12}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("item.addedOn")}:</strong>{" "}
                  {new Date(data.item.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              {/* Distance Display */}
              {user && getDistanceToOwner() && (
                <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.distance")}:</strong>{" "}
                    <Chip
                      label={`${getDistanceToOwner()} ${t(
                        "item.away",
                        "away"
                      )}`}
                      color="info"
                      size="small"
                      sx={{ ml: 1 }}
                      icon={<LocationOnIcon fontSize="small" />}
                    />
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Status Action Boxes */}
          {data.item.status === "AVAILABLE" && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                backgroundColor: "success.light",
                borderRadius: 2,
                border: "2px solid",
                borderColor: "success.main",
              }}
            >
              <Typography variant="h6" color="success.dark">
                🎉{" "}
                {t("item.availableMessage")}
              </Typography>
              <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
                {t("item.availableDescription")}
              </Typography>
            </Box>
          )}

          {data.item.status === "EXCHANGEABLE" && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                backgroundColor: "info.light",
                borderRadius: 2,
                border: "2px solid",
                borderColor: "info.main",
              }}
            >
              <Typography variant="h6" color="info.dark">
                🔄{" "}
                {t("item.exchangeableMessage")}
              </Typography>
              <Typography variant="body2" color="info.dark" sx={{ mt: 1 }}>
                {t("item.exchangeableDescription")}
              </Typography>
            </Box>
          )}

          {data.item.status === "GIFT" && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                backgroundColor: "warning.light",
                borderRadius: 2,
                border: "2px solid",
                borderColor: "warning.main",
              }}
            >
              <Typography variant="h6" color="warning.dark">
                🎁 {t("item.gift")}
              </Typography>
              <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
                {t("item.giftDescription")}
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            {isOwner && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setEditDialogOpen(true)}
              >
                {t("item.editItem")}
              </Button>
            )}
            {canCreateTransaction && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleRequestClick}
                disabled={createTransactionLoading}
              >
                {createTransactionLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null}
                {t("item.request")}
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Edit Item Dialog */}
      <EditItemForm
        open={editDialogOpen}
        item={data?.item || null}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
      />

      {/* Request Confirmation Dialog - Pass transactions data */}
      <RequestConfirmationDialog
        open={requestDialogOpen}
        onClose={handleCloseRequestDialog}
        onConfirm={handleConfirmRequest}
        loading={createTransactionLoading}
        item={data?.item || null}
        owner={ownerData?.user || null}
        holder={holderData?.user || null}
        existingTransactions={openTransactions}
        transactionsLoading={transactionsLoading}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("item.requestSuccess")}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseErrorSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {t("item.requestError")}: {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ItemDetail;
