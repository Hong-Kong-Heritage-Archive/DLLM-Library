import React, { useEffect, useMemo, useState } from "react";
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
  Modal,
  Backdrop,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  Card,
  CardContent,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  SwapHoriz as TransferIcon,
  PushPin as PinIcon, // Add this import
  ChevronRight as ChevronRightIcon,
  Article as ArticleIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Item,
  User,
  Role,
  NewsStatus,
  TransactionLocation,
  CategoryMap,
  HostConfig,
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
import ImageGalleryModal from "./ImageGalleryModal";
import { translateCategory } from "../utils/categoryTranslation";
import NewsForm from "./NewsForm";
import ItemShareDialog from "./ItemShareDialog";
import { getContentRatingOption } from "../utils/contentRating";
import NewsSummary from "./NewsSummary";
import { SimpleNews } from "./NewsSummary";

const ITEM_RELATED_NEWS_QUERY = gql`
  query ItemNewsRelatedPosts(
    $limit: Int
    $offset: Int
    $newsStatus: NewsStatus
    $itemId: ID
  ) {
    newsRecentPosts(
      limit: $limit
      offset: $offset
      newsStatus: $newsStatus
      itemId: $itemId
    ) {
      id
      title
      createdAt
      images
      tags
    }
  }
`;

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
      isbn
      contentRating
      contentRatingChecked
      shadowBanned
    }
  }
`;

const CONTACT_HOLDER_MUTATION = gql`
  mutation ContactHolder(
    $itemId: ID!
    $location: TransactionLocation!
    $locationIndex: Int
    $subject: String!
    $emailContent: String!
    $details: String!
  ) {
    contactHolder(
      itemId: $itemId
      location: $location
      locationIndex: $locationIndex
      subject: $subject
      emailContent: $emailContent
      details: $details
    )
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

const UPDATE_BOOKLIST_MUTATION = gql`
  mutation UpdateBooklist($id: ID!, $relatedItemIds: [ID!]) {
    updateNewsPost(id: $id, relatedItemIds: $relatedItemIds) {
      id
      relatedItems {
        id
      }
    }
  }
`;

const ADD_ITEM_TO_NEWS_POST_MUTATION = gql`
  mutation AddItemToNewsPost($id: ID!, $itemId: ID!, $comment: String) {
    addItemToNewsPost(id: $id, itemId: $itemId, comment: $comment) {
      id
      relatedItems {
        id
      }
    }
  }
`;

const BOOKLIST_RECENT_POSTS_QUERY = gql`
  query BooklistRecentPosts(
    $limit: Int
    $offset: Int
    $newsStatus: NewsStatus
  ) {
    newsRecentPosts(limit: $limit, offset: $offset, newsStatus: $newsStatus) {
      id
      title
      relatedItems {
        id
      }
    }
  }
`;

interface BooklistRecentPostsQueryData {
  newsRecentPosts: Array<{
    id: string;
    title: string;
    relatedItems?: Array<{
      id: string;
    }> | null;
  }>;
}

interface ItemDetailProps {
  itemId: string | null;
  user?: User | null;
  onBack?: () => void;
  hostConfig?: HostConfig | null;
}

const ItemDetail: React.FC<ItemDetailProps> = ({
  itemId,
  user,
  onBack,
  hostConfig,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State for request dialog and notifications
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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

  // Add state for news form dialog
  const [newsFormOpen, setNewsFormOpen] = useState(false);

  const [booklistDialogOpen, setBooklistDialogOpen] = useState(false);
  const [selectedNewsPostId, setSelectedNewsPostId] = useState("");
  const [comment, setComment] = useState("");

  // State for location prompt dialog
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const itemShareUrl = useMemo(() => {
    if (!itemId || typeof window === "undefined") return "";
    return `${window.location.origin}/item/${itemId}`;
  }, [itemId]);

  const { data, loading, error, refetch } = useQuery<{ item: Item }>(
    ITEM_DETAIL_QUERY,
    {
      variables: { itemId: itemId! },
      skip: !itemId,
    },
  );

  const newsRecent = useQuery<BooklistRecentPostsQueryData>(
    BOOKLIST_RECENT_POSTS_QUERY,
    {
      variables: {
        limit: 20,
        offset: 0,
        newsStatus: NewsStatus.CoEditing,
      },
    },
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
    variables: { userId: data?.item?.ownerId },
    skip: !data?.item?.ownerId,
  });

  // Query for related news details
  const itemNewsPosts = useQuery(ITEM_RELATED_NEWS_QUERY, {
    variables: { itemId: data?.item?.id },
    skip: !data?.item?.id,
  });

  // Query for holder details (if different from owner)
  const { data: holderData } = useQuery(USER_QUERY, {
    variables: { userId: data?.item?.holderId },
    skip: !data?.item?.holderId || data?.item?.holderId === data?.item?.ownerId,
  });

  const [contactHolder, { loading: contactHolderLoading }] = useMutation(
    CONTACT_HOLDER_MUTATION,
    {
      onCompleted: (data) => {
        setRequestDialogOpen(false);
        setSuccessSnackbarOpen(true);
        console.log("Transaction created:", data.contactHolder);
      },
      onError: (error) => {
        setRequestDialogOpen(false);
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
        console.error("Transaction creation error:", error);
      },
    },
  );

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
      if (data?.item?.ownerId) {
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
        if (data?.item?.ownerId) {
          refetchOwner(); // Use refetchOwner instead of refetch
        }
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
      },
    },
  );

  const [updateBooklist, { loading: updateBooklistLoading }] = useMutation(
    UPDATE_BOOKLIST_MUTATION,
    {
      onCompleted: () => {
        setBooklistDialogOpen(false);
        setSelectedNewsPostId("");
        setSuccessMessage(t("item.addBooklistSuccess", "Added to booklist"));
        setSuccessSnackbarOpen(true);
        newsRecent.refetch();
      },
      onError: (mutationError) => {
        setErrorMessage(mutationError.message);
        setErrorSnackbarOpen(true);
      },
    },
  );

  const [addItemToNewsPost, { loading: addItemToNewsPostLoading }] =
    useMutation(ADD_ITEM_TO_NEWS_POST_MUTATION, {
      onCompleted: () => {
        setBooklistDialogOpen(false);
        setSelectedNewsPostId("");
        setComment("");
        setSuccessMessage(t("item.addBooklistSuccess", "Added to booklist"));
        setSuccessSnackbarOpen(true);
        newsRecent.refetch();
      },
      onError: (mutationError) => {
        setErrorMessage(mutationError.message);
        setErrorSnackbarOpen(true);
      },
    });

  const availableBooklists = useMemo(() => {
    if (!itemId || !newsRecent.data?.newsRecentPosts) {
      return [];
    }

    return newsRecent.data.newsRecentPosts;
  }, [itemId, newsRecent.data?.newsRecentPosts]);

  const isOwner = user && data?.item?.ownerId === user.id;
  const isAdmin = user && user.role === Role.Admin;
  const isHolder =
    user &&
    (data?.item?.holderId === user.id ||
      (isOwner && data?.item?.holderId === null));
  const canCreateTransaction = user && !isHolder;

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
      holder.user.location.longitude,
    );

    const formattedDistance = formatDistance(distance);
    return distance <= 2
      ? t("item.here", "In the neighborhood")
      : distance > 100
        ? t("item.moreThanDistance", "More than 100km away")
        : t("item.awayDistance", { distance: formattedDistance });
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

    if (!user.location?.latitude || !user.location?.longitude) {
      setLocationPromptOpen(true);
      return;
    }

    setRequestDialogOpen(true);
  };

  const handleAddToBooklistClick = () => {
    if (availableBooklists.length === 0) {
      setErrorMessage(
        t(
          "item.noAvailableBooklists",
          "No recent booklists are available for this item",
        ),
      );
      setErrorSnackbarOpen(true);
      return;
    }

    setSelectedNewsPostId(availableBooklists[0]?.id ?? "");
    setBooklistDialogOpen(true);
  };

  const handleCloseBooklistDialog = () => {
    if (updateBooklistLoading) {
      return;
    }

    setBooklistDialogOpen(false);
    setSelectedNewsPostId("");
  };

  const handleConfirmAddToBooklist = async () => {
    if (!itemId || !selectedNewsPostId) {
      return;
    }

    const selectedNewsPost = availableBooklists.find(
      (newsPost) => newsPost.id === selectedNewsPostId,
    );

    if (!selectedNewsPost) {
      setErrorMessage(
        t("item.invalidBooklistSelection", "Please choose a valid booklist"),
      );
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      await addItemToNewsPost({
        variables: {
          id: selectedNewsPostId,
          itemId,
          comment,
        },
      });
    } catch (mutationError) {
      console.error("Error adding item to news post:", mutationError);
    }
    /*
    const relatedItemIds = Array.from(
      new Set([
        ...(selectedNewsPost.relatedItems?.map(
          (relatedItem) => relatedItem.id,
        ) ?? []),
        itemId,
      ]),
    );

    try {
      await updateBooklist({
        variables: {
          id: selectedNewsPost.id,
          relatedItemIds,
        },
      });
    } catch (mutationError) {
      console.error("Error updating booklist:", mutationError);
    }
*/
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);

    setTimeout(() => {
      if (pendingRequestAction) {
        setRequestDialogOpen(true);
      }
    }, 500);
  };

  const handleGoToProfile = () => {
    setLocationPromptOpen(false);
    navigate("/profile");
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
    setPendingRequestAction(false);
  };

  const handleFaceToFaceClick = () => {
    setFaceToFaceDialogOpen(true);
  };

  const handleCreateNewsClick = () => {
    setNewsFormOpen(true);
  };

  const handleConfirmRequest = async (
    location: TransactionLocation,
    locationIndex?: number,
  ) => {
    if (!itemId) return;

    try {
      const details = buildDetailsString();
      await contactHolder({
        variables: {
          itemId,
          location,
          locationIndex: locationIndex || 0,
          subject: "",
          emailContent: "",
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
    setSuccessMessage("");
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
        prev === 0 ? images.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    const images = data?.item?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const StatusBox = ({ status }: { status: string }) => {
    const STATUS_BOX_VARIANTS = {
      AVAILABLE: {
        icon: "🎉",
        badgeColor: "success.main",
        backgroundColor: "success.light",
        borderColor: "success.main",
        titleKey: "item.availableMessage",
        descriptionKey: "item.availableDescription",
      },
      EXCHANGEABLE: {
        icon: "🔄",
        badgeColor: "info.main",
        backgroundColor: "info.light",
        borderColor: "info.main",
        titleKey: "item.exchangeableMessage",
        descriptionKey: "item.exchangeableDescription",
      },
      GIFT: {
        icon: "🎁",
        badgeColor: "warning.main",
        backgroundColor: "warning.light",
        borderColor: "warning.main",
        titleKey: "item.gift",
        descriptionKey: "item.giftDescription",
      },
    } as const;

    const variant =
      STATUS_BOX_VARIANTS[status as keyof typeof STATUS_BOX_VARIANTS];

    if (!variant) return null;

    return (
      <Box
        // sx={{
        //   mb: 2,
        //   display: "flex",
        //   alignItems: "center",
        //   gap: 2,
        //   p: 2.5,
        //   backgroundColor: "white",
        //   borderRadius: 2,
        //   border: "1px solid",
        //   borderColor: "grey.200",
        // }}
        sx={{
          my: 4,
          p: 3,
          backgroundColor: variant.backgroundColor,
          borderRadius: 2,
          border: "2px solid",
          borderColor: variant.borderColor,
        }}
      >
        <Box
        // sx={{
        //   width: 40,
        //   height: 40,
        //   borderRadius: "50%",
        //   backgroundColor: variant.badgeColor,
        //   display: "flex",
        //   alignItems: "center",
        //   justifyContent: "center",
        //   flexShrink: 0,
        // }}
        >
          <Typography sx={{ fontSize: "1.2rem", lineHeight: 1 }}>
            {variant.icon}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            {t(variant.titleKey)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(variant.descriptionKey)}
          </Typography>
        </Box>
      </Box>
    );
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

  const handleNewsItemClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  // Check if item is pinned by the current user (owner)
  const isItemPinned = () => {
    if (!user || !isOwner || !ownerData?.user?.pinItems) {
      return false;
    }
    return ownerData.user.pinItems.some(
      (pinItem: Item) => pinItem.id === itemId,
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
      <>
        {/* <Box sx={{ mb: 2 }}>
          <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.5, display: "block" }}
        >
          {t("item.classification", "Classification")}:
        </Typography> */}
        {/* <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        > */}
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
                      i18n.language,
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
                <Box sx={{ mx: 1, color: "text.secondary" }}>/</Box>
              )}
            </Box>
          );
        })}
        {/* </Box> */}
        {/* </Box> */}
      </>
    );
  };

  // Redirect to not-found when item query resolved but returned null (censored or missing)
  useEffect(() => {
    if (!loading && !error && data && !data.item) {
      navigate("/not-found", {
        replace: true,
        state: { reason: user ? "rating" : "login" },
      });
    }
  }, [loading, error, data, user, navigate]);

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
                    } `}
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
                      } `}
                      color="secondary"
                      size="small"
                      sx={{ ml: 2, cursor: "pointer" }}
                      onClick={() => handleUserClick(holderData.user.id)}
                    />
                  )}
                <Chip
                  label={`${t("item.deposit", "deposit")}: ${
                    data.item.deposit
                  } `}
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
        {data?.item && (
          <IconButton
            color="primary"
            onClick={() => setShareDialogOpen(true)}
            aria-label={t("item.shareItem", "Share item")}
            sx={{ ml: 1 }}
          >
            <ShareIcon />
          </IconButton>
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
        <Paper
          elevation={1}
          sx={{ p: 4 }}
          //  sx={{ p: 4, backgroundColor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {t("item.categories", "Categories")}:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {renderClassificationPath(data.item.clssfctns)}
              {data.item.category && data.item.category.length > 0 && (
                <>
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
                </>
              )}
            </Box>
          </Box>

          {/* Description */}
          {data.item.description && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  backgroundColor: "white",
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                {convertLinksToClickable(
                  data.item.description?.replace(/#Uncategorized\b/gi, "") ||
                    "",
                )}
              </Typography>
            </Box>
          )}

          {/* IMAGES — visual first */}
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
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img
                        src={image}
                        alt={`${data.item.name} - Thumbnail ${index + 1} `}
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

          {/* ITEM INFO GRID */}
          <Card
            elevation={0}
            sx={{
              mb: 4,
              backgroundColor: "white",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.status", "Status")}:</strong>{" "}
                    <Chip
                      label={t(
                        `shortStatus.${data.item.status} `,
                        data.item.status,
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
                {user && getDistanceToOwner() && (
                  <Grid size={6}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>{t("item.distance")}:</strong>{" "}
                      <Chip
                        label={getDistanceToOwner()}
                        color="info"
                        size="small"
                        sx={{ ml: 1 }}
                        icon={<LocationOnIcon fontSize="small" />}
                      />
                    </Typography>
                  </Grid>
                )}
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
                {/* <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.deposit", "Deposit")}:</strong> {data.item.deposit}
                  </Typography>
                </Grid> */}
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
                <Grid size={user && getDistanceToOwner() ? 6 : 6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.addedOn")}:</strong>{" "}
                    {new Date(data.item.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                {(data.item as any).contentRating != null &&
                  (isOwner || !(data.item as any).contentRatingChecked) && (
                    <Grid size={12}>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        component="div"
                      >
                        <strong>
                          {t("contentRating.label", "Content Rating")}:
                        </strong>{" "}
                        {(() => {
                          const opt = getContentRatingOption(
                            (data.item as any).contentRating,
                          );
                          return opt ? (
                            <Chip
                              label={t(opt.labelKey, opt.labelKey)}
                              color={opt.color as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          ) : null;
                        })()}
                      </Typography>
                    </Grid>
                  )}
              </Grid>
            </CardContent>
          </Card>

          {/* STATUS + PRIMARY ACTION — "can I get this?" */}
          <StatusBox status={data.item.status} />

          {(canCreateTransaction || !user) && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleRequestClick}
              sx={{
                mb: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 2,
              }}
              disabled={contactHolderLoading}
            >
              {contactHolderLoading ? (
                <CircularProgress size={20} sx={{ mr: 1, color: "inherit" }} />
              ) : null}
              {t("item.request")}
            </Button>
          )}

          {/* 7. SECONDARY ACTIONS */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {(isOwner || isHolder) && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleFaceToFaceClick}
                disabled={quickTransactionLoading}
                startIcon={<TransferIcon />}
              >
                {t("item.faceToFaceTransfer", "Face-to-Face Transfer")}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleCreateNewsClick}
                startIcon={<ArticleIcon />}
              >
                {t("item.createNews", "Create News")}
              </Button>
            )}

            {user && availableBooklists.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleAddToBooklistClick}
                disabled={newsRecent.loading || updateBooklistLoading}
                startIcon={<ArticleIcon />}
              >
                {t("item.addbooklist", "Add to Booklist")}
              </Button>
            )}

            {(isOwner || isAdmin) && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setEditDialogOpen(true)}
              >
                {t("item.editItem")}
              </Button>
            )}
          </Box>
          {/* related news */}
          {itemNewsPosts?.data?.newsRecentPosts &&
            itemNewsPosts?.data?.newsRecentPosts.length > 0 && (
              <List
                sx={{
                  whiteSpace: "pre-wrap",
                  backgroundColor: "grey.50",
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                {itemNewsPosts.data.newsRecentPosts.map((news: SimpleNews) => (
                  <NewsSummary
                    key={news.id}
                    news={news}
                    onClick={handleNewsItemClick}
                  />
                ))}
              </List>
            )}
        </Paper>
      )}
      {/* Edit Item Dialog */}
      {user && (
        <ItemForm
          open={editDialogOpen}
          user={user}
          onClose={() => setEditDialogOpen(false)}
          item={data?.item || null}
          onItemUpdated={handleEditSuccess}
          onError={handleEditError}
        />
      )}
      {/* Location Prompt Dialog */}
      <Modal
        open={locationPromptOpen}
        onClose={() => setLocationPromptOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={locationPromptOpen}>
          <Box
            sx={{
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
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("item.locationRequired", "Location Required")}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {t(
                "item.locationRequiredDescription",
                "Please set your location in your profile before requesting an item. This helps us match you with nearby items.",
              )}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
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

      {/* Unified Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleCloseAuthDialog}
        onSuccess={handleAuthSuccess}
        onForgotPassword={() => {
          alert(
            t(
              "auth.resetPasswordInfo",
              "Please contact support to reset your password.",
            ),
          );
        }}
        defaultIsSignUp={authDefaultSignUp}
      />

      {/* Request Confirmation Dialog - Pass transactions data */}
      <RequestConfirmationDialog
        open={requestDialogOpen}
        onClose={handleCloseRequestDialog}
        onConfirm={handleConfirmRequest}
        loading={contactHolderLoading}
        item={data?.item || null}
        owner={ownerData?.user || null}
        holder={holderData?.user || null}
        requestor={user || null}
      />

      {/* Face-to-Face Confirmation Dialog */}
      <FaceToFaceConfirmDialog
        open={faceToFaceDialogOpen}
        onClose={handleCloseFaceToFaceDialog}
        onConfirm={handleConfirmFaceToFace}
        loading={quickTransactionLoading}
        itemName={data?.item?.name || ""}
      />

      <Dialog
        open={booklistDialogOpen}
        onClose={handleCloseBooklistDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("item.addbooklist", "Add to Booklist")}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="booklist-select-label">
                {t("item.booklist", "Booklist")}
              </InputLabel>
              <Select
                labelId="booklist-select-label"
                value={selectedNewsPostId}
                label={t("item.booklist", "Booklist")}
                onChange={(event) =>
                  setSelectedNewsPostId(event.target.value as string)
                }
              >
                {availableBooklists.map((newsPost) => (
                  <MenuItem key={newsPost.id} value={newsPost.id}>
                    {newsPost.title}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label={t("item.comment", "Comment")}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                fullWidth
                multiline
                rows={3}
                sx={{ mt: 2 }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseBooklistDialog}
            disabled={addItemToNewsPostLoading || updateBooklistLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirmAddToBooklist}
            variant="contained"
            disabled={
              !selectedNewsPostId ||
              addItemToNewsPostLoading ||
              updateBooklistLoading
            }
          >
            {addItemToNewsPostLoading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            {t("common.add", "Add")}
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
          {successMessage || t("item.requestSuccess")}
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
      <ImageGalleryModal
        open={imageModalOpen}
        onClose={handleCloseModal}
        images={data?.item?.images || []}
        selectedIndex={selectedImageIndex}
        onPrev={handlePrevImage}
        onNext={handleNextImage}
        itemName={data?.item?.name}
      />
      {data?.item && (
        <Box sx={{ mt: 4 }}>
          <ItemComments itemId={itemId!} currentUser={user} />
        </Box>
      )}

      {data?.item && (
        <ItemShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          itemName={data.item.name}
          itemUrl={itemShareUrl}
          adminTemplates={hostConfig?.itemShareMessageTemplates ?? []}
        />
      )}

      {/* News Form Dialog - For admins to create news related to the item */}
      {user && isAdmin && (
        <NewsForm
          open={newsFormOpen}
          onClose={() => setNewsFormOpen(false)}
          relatedItem={data?.item || null}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      )}
    </Container>
  );
};

export default ItemDetail;
