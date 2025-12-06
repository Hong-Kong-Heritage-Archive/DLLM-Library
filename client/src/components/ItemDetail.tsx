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
  Modal,
  Backdrop,
  Fade,
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
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PushPin as PinIcon, // Add this import
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Item,
  Transaction,
  User,
  TransactionStatus,
  TransactionLocation,
  CategoryMap,
} from "../generated/graphql";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { calculateDistance, formatDistance } from "../utils/geoProcessor";
import RequestConfirmationDialog from "./RequestConfirmationDialog";
import ItemForm from "./ItemForm";
import FaceToFaceConfirmDialog from "./FaceToFaceConfirmDialog";
import ItemComments from "./ItemComments";
import { convertLinksToClickable } from "../utils/helpers";
import { AuthDialog } from "./Auth";
import { translateCategory } from "../utils/categoryTranslation";

const ITEM_DETAIL_QUERY = gql`
  query Item($itemId: ID!) {
    item(id: $itemId) {
      id
      name
      description
      condition
      category
      clssfctns
      status
      images
      thumbnails
      publishedYear
      language
      createdAt
      ownerId
      holderId
      deposit
    }
  }
`;

const CREATE_TRANSACTION_MUTATION = gql`
  mutation CreateTransaction(
    $itemId: ID!
    $location: TransactionLocation!
    $locationIndex: Int
    $details: String!
  ) {
    createTransaction(
      itemId: $itemId
      location: $location
      locationIndex: $locationIndex
      details: $details
    ) {
      id
      status
      createdAt
      updatedAt
    }
  }
`;

const CREATE_QUICK_TRANSACTION_MUTATION = gql`
  mutation CreateQuickTransaction($itemId: ID!, $details: String!) {
    createQuickTransaction(itemId: $itemId, details: $details) {
      id
      status
      createdAt
      updatedAt
    }
  }
`;

const USER_QUERY = gql`
  query GetUserForItem($userId: ID!) {
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
      exchangePoints
      location {
        latitude
        longitude
      }
      pinItems {
        id
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
      details
      status
      createdAt
      updatedAt
    }
  }
`;

const PIN_ITEM_MUTATION = gql`
  mutation PinItem($itemId: ID!) {
    pinItem(itemId: $itemId)
  }
`;

const UNPIN_ITEM_MUTATION = gql`
  mutation UnpinItem($itemId: ID!) {
    unpinItem(itemId: $itemId)
  }
`;

const GET_ITEM_CONFIG = gql`
  query GetItemConfig {
    itemConfig {
      defaultCategoryTrees
      categoryMaps {
        language
        value
      }
    }
  }
`;

interface ItemDetailProps {
  itemId: string | null;
  user?: User | null;
  onBack?: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, user, onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State for request dialog and notifications
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Simplified auth state
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultSignUp, setAuthDefaultSignUp] = useState(false);
  const [pendingRequestAction, setPendingRequestAction] = useState(false);

  // Add edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // State for image popup
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Add state for Face-to-Face dialog
  const [faceToFaceDialogOpen, setFaceToFaceDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ item: Item }>(
    ITEM_DETAIL_QUERY,
    {
      variables: { itemId: itemId! },
      skip: !itemId,
    }
  );

  // Query for item config (for classification translation)
  const { data: configData } = useQuery<{
    itemConfig: {
      defaultCategoryTrees: string[];
      categoryMaps: CategoryMap[][];
    };
  }>(GET_ITEM_CONFIG, { fetchPolicy: "cache-first" });

  // Query for owner details
  const { data: ownerData, refetch: refetchOwner } = useQuery(USER_QUERY, {
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

  const [createQuickTransaction, { loading: quickTransactionLoading }] =
    useMutation(CREATE_QUICK_TRANSACTION_MUTATION, {
      onCompleted: (data) => {
        setFaceToFaceDialogOpen(false);
        setSuccessSnackbarOpen(true);
        // Navigate to the newly created transaction
        navigate(`/transaction/${data.createQuickTransaction.id}`);
      },
      onError: (error) => {
        setFaceToFaceDialogOpen(false);
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
        console.error("Quick transaction creation error:", error);
      },
    });

  const [pinItem, { loading: pinLoading }] = useMutation(PIN_ITEM_MUTATION, {
    onCompleted: () => {
      setSuccessSnackbarOpen(true);
      // Refetch owner data to update pinItems
      if (data?.item.ownerId) {
        refetchOwner(); // Use refetchOwner instead of refetch
      }
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setErrorSnackbarOpen(true);
    },
  });

  const [unpinItem, { loading: unpinLoading }] = useMutation(
    UNPIN_ITEM_MUTATION,
    {
      onCompleted: () => {
        setSuccessSnackbarOpen(true);
        // Refetch owner data to update pinItems
        if (data?.item.ownerId) {
          refetchOwner(); // Use refetchOwner instead of refetch
        }
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

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleRequestClick = () => {
    if (!user) {
      setAuthDefaultSignUp(false); // Default to sign in
      setAuthDialogOpen(true);
      setPendingRequestAction(true);
      return;
    }

    setRequestDialogOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);

    setTimeout(() => {
      if (pendingRequestAction) {
        setRequestDialogOpen(true);
      }
    }, 500);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
    setPendingRequestAction(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthDefaultSignUp(!authDefaultSignUp);
  };

  const handleFaceToFaceClick = () => {
    setFaceToFaceDialogOpen(true);
  };

  const handleConfirmRequest = async (
    location: TransactionLocation,
    locationIndex?: number
  ) => {
    if (!itemId) return;

    try {
      const details = buildDetailsString();
      await createTransaction({
        variables: {
          itemId,
          location,
          locationIndex: locationIndex || 0,
          details: details,
        },
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleConfirmFaceToFace = async () => {
    if (!itemId) return;

    try {
      const details = buildDetailsString();
      await createQuickTransaction({
        variables: { itemId, details: details },
      });
    } catch (error) {
      console.error("Error creating quick transaction:", error);
    }
  };

  const buildDetailsString = () => {
    return JSON.stringify({ deposit: data?.item.deposit });
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
  };

  const handleCloseFaceToFaceDialog = () => {
    setFaceToFaceDialogOpen(false);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbarOpen(false);
    setErrorMessage("");
  };

  // Image handlers
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  const handlePrevImage = () => {
    const images = data?.item?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    const images = data?.item?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
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
    refetch();
    // window.location.reload(); // Simple refresh, or you could refetch the query
  };

  const handleEditError = (message: string) => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
  };

  // Check if item is pinned by the current user (owner)
  const isItemPinned = () => {
    if (!user || !isOwner || !ownerData?.user?.pinItems) {
      return false;
    }
    return ownerData.user.pinItems.some(
      (pinItem: Item) => pinItem.id === itemId
    );
  };

  // Handle pin/unpin toggle
  const handlePinToggle = async () => {
    if (!itemId) return;

    try {
      if (isItemPinned()) {
        await unpinItem({ variables: { itemId } });
      } else {
        await pinItem({ variables: { itemId } });
      }
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  // Handle case when itemId is null
  if (!itemId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">{t("item.details")}</Typography>
        </Box>
        <Alert severity="error">{t("item.noItemId")}</Alert>
      </Container>
    );
  }

  // Update renderClassificationPath to use imported utility
  const renderClassificationPath = (clssfctns: string[] | null | undefined) => {
    if (!clssfctns || clssfctns.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.5, display: "block" }}
        >
          {t("item.classification", "Classification")}:
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {clssfctns.map((pathString, index) => {
            const segments = pathString.split("/").filter((seg) => seg.trim());

            return (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
              >
                {segments.map((segment, segIndex) => (
                  <React.Fragment key={segIndex}>
                    <Chip
                      label={translateCategory(
                        segment,
                        configData?.itemConfig?.categoryMaps,
                        i18n.language
                      )}
                      size="small"
                      variant={
                        segIndex === segments.length - 1 ? "filled" : "outlined"
                      }
                      color="info"
                      sx={{
                        fontWeight:
                          segIndex === segments.length - 1 ? "bold" : "normal",
                        backgroundColor:
                          segIndex === segments.length - 1
                            ? "info.main"
                            : "info.light",
                        "& .MuiChip-label": {
                          color: "white",
                        },
                      }}
                    />
                    {segIndex < segments.length - 1 && (
                      <ChevronRightIcon
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          mx: 0.5,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
                {index < clssfctns.length - 1 && (
                  <Box sx={{ mx: 1, color: "text.secondary" }}>|</Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

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
              <>
                <Chip
                  label={t("item.owner", "Owner")}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                />
                {/* Pin/Unpin Toggle Button */}
                <IconButton
                  onClick={handlePinToggle}
                  disabled={pinLoading || unpinLoading}
                  sx={{
                    ml: 1,
                    color: isItemPinned() ? "primary.main" : "action.disabled",
                    "&:hover": {
                      backgroundColor: isItemPinned()
                        ? "primary.light"
                        : "action.hover",
                    },
                  }}
                  title={
                    isItemPinned()
                      ? t("item.unpinItem", "Unpin item")
                      : t("item.pinItem", "Pin item")
                  }
                >
                  {pinLoading || unpinLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PinIcon
                      sx={{
                        transform: isItemPinned()
                          ? "rotate(45deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease-in-out",
                      }}
                    />
                  )}
                </IconButton>
                {/* Pin Status Indicator */}
                {ownerData?.user?.pinItems && (
                  <Chip
                    label={t("item.pinnedItemsStatus", "Pinned: {{count}}/5", {
                      count: ownerData.user.pinItems.length,
                    })}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </>
            ) : (
              <>
                {/* Show owner name if user is not the owner */}
                {ownerData?.user && (
                  <Chip
                    label={`${t("item.owner", "Owner")}: ${
                      ownerData.user.nickname || ownerData.user.email
                    }`}
                    color="primary"
                    size="small"
                    sx={{ ml: 2, cursor: "pointer" }}
                    onClick={() => handleUserClick(ownerData.user.id)}
                  />
                )}
                {/* Show holder name if user is not the holder and holder is different from owner */}
                {isHolder && (
                  <Chip
                    label={t("item.holder", "Holder")}
                    color="secondary"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
                {!isHolder &&
                  holderData?.user &&
                  data.item.holderId !== data.item.ownerId && (
                    <Chip
                      label={`${t("item.holder", "Holder")}: ${
                        holderData.user.nickname || holderData.user.email
                      }`}
                      color="secondary"
                      size="small"
                      sx={{ ml: 2, cursor: "pointer" }}
                      onClick={() => handleUserClick(holderData.user.id)}
                    />
                  )}
                <Chip
                  label={`${t("item.deposit", "deposit")}: ${
                    data.item.deposit
                  }`}
                  color="secondary"
                  size="small"
                  sx={{ ml: 2, cursor: "pointer" }}
                />
              </>
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
          {t("item.errorLoading")}: {error.message}
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
                      {t("item.contact")}: {oldestTransaction?.requestor?.email}
                    </Typography>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t("item.transferInstructions")}
                  </Alert>
                </CardContent>
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
                        {t(
                          "item.responsibility1",
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
              </Card>
            )}

          {/* Classification Path - NEW: Add before Categories */}
          {renderClassificationPath(data.item.clssfctns)}

          {/* Categories */}
          {data.item.category && data.item.category.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                {t("item.categories", "Categories")}:
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
                {convertLinksToClickable(
                  data.item.description?.replace(/#Uncategorized\b/gi, "") || ""
                )}
              </Typography>
            </Box>
          )}

          {/* Images */}
          {((data.item.thumbnails && data.item.thumbnails.length > 0) ||
            (data.item.images && data.item.images.length > 0)) && (
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                {(data.item.thumbnails && data.item.thumbnails.length > 0
                  ? data.item.thumbnails
                  : data.item.images || []
                ).map((image, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper
                      elevation={2}
                      sx={{
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.05)",
                        },
                      }}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img
                        src={image}
                        alt={`${data.item.name} - Thumbnail ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "120px",
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
                    label={t(
                      `shortStatus.${data.item.status}`,
                      data.item.status
                    )}
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
                  <strong>{t("common.language")}:</strong> {data.item.language}
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
                🎉 {t("item.availableMessage")}
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
                🔄 {t("item.exchangeableMessage")}
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
            {/* Face-to-Face Transfer Button - Show for owner or holder */}
            {(isOwner || isHolder) && (
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={handleFaceToFaceClick}
                disabled={quickTransactionLoading}
                startIcon={<TransferIcon />}
              >
                {t("item.faceToFaceTransfer", "Face-to-Face Transfer")}
              </Button>
            )}

            {isOwner && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => setEditDialogOpen(true)}
                >
                  {t("item.editItem")}
                </Button>
              </>
            )}

            {(canCreateTransaction || !user) && (
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
      <ItemForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        item={data?.item || null}
        onItemUpdated={handleEditSuccess}
        onError={handleEditError}
      />

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

      {/* Request Confirmation Dialog - Pass transactions data */}
      <RequestConfirmationDialog
        open={requestDialogOpen}
        onClose={handleCloseRequestDialog}
        onConfirm={handleConfirmRequest}
        loading={createTransactionLoading}
        item={data?.item || null}
        owner={ownerData?.user || null}
        holder={holderData?.user || null}
        requestor={user || null}
        existingTransactions={openTransactions}
        transactionsLoading={transactionsLoading}
      />

      {/* Face-to-Face Confirmation Dialog */}
      <FaceToFaceConfirmDialog
        open={faceToFaceDialogOpen}
        onClose={handleCloseFaceToFaceDialog}
        onConfirm={handleConfirmFaceToFace}
        loading={quickTransactionLoading}
        itemName={data?.item?.name || ""}
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

      {/* Image Modal */}
      <Modal
        open={imageModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={imageModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Close Button */}
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
              <IconButton onClick={handleCloseModal} color="primary">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Image Navigation */}
            {data?.item && (
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Previous Button */}
                {data.item.images && data.item.images.length > 1 && (
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{ position: "absolute", left: -50, zIndex: 1 }}
                    color="primary"
                  >
                    <PrevIcon />
                  </IconButton>
                )}

                {/* Main Image */}
                <img
                  src={
                    (data.item.images &&
                      data.item.images[selectedImageIndex]) ||
                    ""
                  }
                  alt={`${data.item.name} - Image ${selectedImageIndex + 1}`}
                  style={{
                    maxWidth: "80vw",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />

                {/* Next Button */}
                {data.item.images && data.item.images.length > 1 && (
                  <IconButton
                    onClick={handleNextImage}
                    sx={{ position: "absolute", right: -50, zIndex: 1 }}
                    color="primary"
                  >
                    <NextIcon />
                  </IconButton>
                )}
              </Box>
            )}

            {/* Image Counter */}
            {data?.item && data.item.images && data.item.images.length > 1 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedImageIndex + 1} / {data.item.images.length}
              </Typography>
            )}
          </Box>
        </Fade>
      </Modal>
      {data?.item && (
        <Box sx={{ mt: 4 }}>
          <ItemComments itemId={itemId!} currentUser={user} />
        </Box>
      )}
    </Container>
  );
};

export default ItemDetail;
