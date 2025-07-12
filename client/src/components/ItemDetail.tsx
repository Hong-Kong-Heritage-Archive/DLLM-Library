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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Item, User } from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SafeImage from "./SafeImage";

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

interface ItemDetailProps {
  itemId: string | null;
  user?: User | null;
  onBack?: () => void; // Optional callback for custom back behavior
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, user, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for request dialog and notifications
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data, loading, error } = useQuery<{ item: Item }>(ITEM_DETAIL_QUERY, {
    variables: { itemId: itemId! },
    skip: !itemId,
  });

  const [createTransaction, { loading: createTransactionLoading }] =
    useMutation(CREATE_TRANSACTION_MUTATION, {
      onCompleted: (data) => {
        setRequestDialogOpen(false);
        setSuccessSnackbarOpen(true);
        console.log("Transaction created:", data.createTransaction);
      },
      onError: (error) => {
        setRequestDialogOpen(false);
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
        console.error("Transaction creation error:", error);
      },
    });

  const isOwner = user && data?.item.ownerId === user.id;
  const isHolder =
    user && (data?.item.holderId === user.id || data?.item.holderId === null);
  const canCreateTransaction = user && !isHolder;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back to previous page
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
      // Error is handled by onError callback
      console.error("Error creating transaction:", error);
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

  // Handle case when itemId is null
  if (!itemId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {t("item.details", "Item Details")}
          </Typography>
        </Box>
        <Alert severity="error">
          {t("item.noItemId", "No item ID provided")}
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
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {t("item.detailsloading", "Item Loading")}
          </Typography>
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
          {t("item.errorLoading", "Error loading item details")}:{" "}
          {error.message}
        </Alert>
      )}

      {/* Item Content */}
      {data?.item && (
        <Paper elevation={1} sx={{ p: 4 }}>
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
                  <strong>{t("item.language", "Language")}:</strong>{" "}
                  {data.item.language}
                </Typography>
              </Grid>
              {data.item.publishedYear && (
                <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.publishedYear", "Published")}:</strong>{" "}
                    {data.item.publishedYear}
                  </Typography>
                </Grid>
              )}
              <Grid size={12}>
                <Typography variant="body1" color="text.secondary">
                  <strong>{t("item.addedOn", "Added on")}:</strong>{" "}
                  {new Date(data.item.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Description */}
          {data.item.description && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {t("item.description", "Description")}
              </Typography>
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
              <Typography variant="h5" gutterBottom>
                {t("item.images", "Images")}
              </Typography>
              <Grid container spacing={2}>
                {data.item.images.map((image, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ overflow: "hidden" }}>
                      <SafeImage
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

          {/* Categories */}
          {data.item.category && data.item.category.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {t("item.categories", "Categories")}
              </Typography>
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
                {t("item.available", "This item is available for borrowing!")}
              </Typography>
              <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
                {t(
                  "item.availableDescription",
                  "You can contact the owner to borrow this item."
                )}
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
                {t("item.exchangeable", "This item is available for exchange!")}
              </Typography>
              <Typography variant="body2" color="info.dark" sx={{ mt: 1 }}>
                {t(
                  "item.exchangeableDescription",
                  "You can offer another item in exchange for this one."
                )}
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
                🎁 {t("item.gift", "This item is available as a gift!")}
              </Typography>
              <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
                {t(
                  "item.giftDescription",
                  "The owner is giving away this item for free."
                )}
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
                onClick={() => {
                  // TODO: Implement edit item functionality
                  console.log("Edit item clicked");
                }}
              >
                {t("item.editItem", "Edit Item")}
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
                {t("item.request", "Request")}
              </Button>
            )}
          </Box>
        </Paper>
      )}
      {/* Request Confirmation Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={handleCloseRequestDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("item.confirmRequest", "Confirm Request")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              "item.confirmRequestMessage",
              "Are you sure you want to request this item? This will create a transaction between you and the owner."
            )}
          </DialogContentText>
          {data?.item && (
            <Box
              sx={{ mt: 2, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {data.item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("item.condition", "Condition")}: {data.item.condition} |{" "}
                {t("item.status", "Status")}: {data.item.status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseRequestDialog}
            disabled={createTransactionLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirmRequest}
            variant="contained"
            color="primary"
            disabled={createTransactionLoading}
          >
            {createTransactionLoading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            {t("item.confirmRequest", "Confirm Request")}
          </Button>
        </DialogActions>
      </Dialog>

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
          {t(
            "item.requestSuccess",
            "Request submitted successfully! The owner will be notified."
          )}
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
          {t("item.requestError", "Request failed")}: {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ItemDetail;
