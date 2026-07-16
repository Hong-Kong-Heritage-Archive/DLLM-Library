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
  TransactionStatus,
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
import DetailSectionCard from "../styles/DetailSectionCard";

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

const ITEM_TRANSACTIONS_QUERY = gql`
  query ItemTransactions($itemId: ID!) {
    transactionsByItem(itemId: $itemId) {
      id
      status
      createdAt
      updatedAt
      requestor {
        id
        nickname
        email
      }
      receiver {
        id
        nickname
        email
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

const pageContainerSx = {
  py: { xs: 1.5, sm: 4 },
  px: { xs: 1, sm: 2 },
  bgcolor: "var(--color-bg-canvas)",
};
const headerRowSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 2,
};
const backIconButtonSx = {
  bgcolor: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-subtle)",
  width: 40,
  height: 40,
};
const loadingBlockSx = { display: "flex", justifyContent: "center", p: 6 };
const shareIconButtonSx = {
  bgcolor: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-subtle)",
  width: 40,
  height: 40,
};
const oldPaperSectionSx = {
  p: { xs: 2, sm: 4 },
  borderRadius: 3,
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
};
const paperSectionSx = {
  p: 4,
};
const headerTitleGrowSx = { flexGrow: 1 };
const sectionMb4Sx = { mb: 4 };
const flexWrapRowSx = { display: "flex", gap: 1, flexWrap: "wrap" };
const heroRowSx = {
  display: "grid",
  gridTemplateColumns: { xs: "96px 1fr", sm: "140px 1fr" },
  gap: 2,
  mb: 2,
  alignItems: "start",
};
const heroImagePaperSx = {
  overflow: "hidden",
  borderRadius: 2,
  border: "1px solid var(--color-border-subtle)",
  cursor: "pointer",
};
const heroImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "3/4",
  objectFit: "cover",
  display: "block",
};
const heroMetaRowSx = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 1,
  mb: 1,
};
const heroMetaItemSx = { minWidth: 0 };
const heroMetaLabelSx = {
  fontSize: "0.72rem",
  color: "var(--color-text-muted)",
  lineHeight: 1.2,
};
const heroFallbackImageSx = {
  ...heroImageStyle,
  backgroundColor: "var(--color-bg-subtle)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-text-muted)",
  fontSize: "0.85rem",
};
const heroTitleSx = {
  fontSize: { xs: "1.85rem", sm: "2.2rem" },
  fontWeight: 800,
  lineHeight: 1.12,
  color: "var(--color-text-primary)",
  mb: 1,
};
const tinyMetaChipSx = {
  height: 22,
  backgroundColor: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border-subtle)",
  color: "var(--color-text-secondary)",
  "& .MuiChip-label": { px: 1, fontSize: "0.72rem" },
};
const tagsListSx = {
  display: "flex",
  gap: 0.75,
  flexWrap: "wrap",
  mb: 3,
};
const tagChipSx = {
  height: 24,
  borderRadius: 1,
  backgroundColor: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border-subtle)",
  color: "var(--color-text-secondary)",
  "& .MuiChip-label": { px: 1.25, fontSize: "0.75rem" },
};
const descriptionBoxSx = {
  whiteSpace: "pre-wrap",
  backgroundColor: "transparent",
  p: 0,
  borderRadius: 2,
  color: "var(--color-text-body)",
  fontSize: "1.03rem",
  lineHeight: 1.55,
};
const sectionTitleSx = {
  fontWeight: 700,
  color: "var(--color-text-primary)",
  mb: 1,
};
const ownerPinButtonSx = { ml: 0.5 };
const pinIconSx = (pinned: boolean) => ({
  color: pinned ? "var(--color-brand-primary)" : "var(--color-text-muted)",
  transform: pinned ? "rotate(45deg)" : "rotate(0deg)",
  transition: "transform 0.2s ease-in-out",
});
const descriptionContentSx = (expanded: boolean) => ({
  ...descriptionBoxSx,
  display: expanded ? "block" : "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: expanded ? "unset" : 4,
  overflow: "hidden",
});
const descriptionToggleButtonSx = {
  mt: 0.5,
  px: 0,
  minWidth: 0,
  textDecoration: "underline",
  color: "var(--color-text-primary)",
  fontWeight: 700,
};
const thumbnailPaperSx = {
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.2s",
  "&:hover": { transform: "scale(1.05)" },
};
const thumbnailImageStyle: React.CSSProperties = {
  width: "100%",
  height: "120px",
  objectFit: "cover",
};
const infoCardSx = {
  mb: 3,
  backgroundColor: "white",
  border: "1px solid",
  borderColor: "var(--color-border-subtle)",
  borderRadius: 2,
};
const primaryActionButtonSx = {
  py: 1.35,
  fontSize: "1.05rem",
  fontWeight: 700,
  borderRadius: 2.2,
};
const addBookshelfButtonSx = {
  py: 1.5,
  fontSize: "1.05rem",
  fontWeight: 700,
  borderRadius: 2.2,
};
const twoColumnGridTemplateColumns = { xs: "1fr 1fr", sm: "1fr 1fr" };
const inheritProgressSx = { mr: 1, color: "inherit" };
const secondaryActionsRowSx = {
  display: "flex",
  justifyContent: "flex-start",
  gap: 1,
  flexWrap: "wrap",
  mt: 1.5,
};
const primaryActionsRowSx = {
  mt: 3,
  display: "grid",
  gridTemplateColumns: twoColumnGridTemplateColumns,
  gap: 1.5,
};
const relatedNewsListSx = {
  whiteSpace: "pre-wrap",
  backgroundColor: "var(--color-bg-subtle)",
  p: 3,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "var(--color-border-subtle)",
};
const historySectionSx = { my: 4 };
const historyLineWrapSx = {
  position: "relative",
  pl: 2.5,
};
const historyLineSx = {
  position: "absolute",
  left: 6,
  top: 2,
  bottom: 2,
  width: "1px",
  backgroundColor: "var(--color-border-default)",
};
const historyRowSx = { position: "relative", mb: 1.5 };
const historyDotSx = {
  position: "absolute",
  left: -13,
  top: 5,
  width: 9,
  height: 9,
  borderRadius: "50%",
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-text-muted)",
};
const historyDotActiveSx = {
  ...historyDotSx,
  backgroundColor: "#000000",
  borderColor: "#000000",
};
const historyTitleSx = {
  fontSize: "1.65rem",
  fontWeight: 800,
  lineHeight: 1.2,
  color: "var(--color-text-primary)",
  mb: 1,
};
const historyItemTextSx = {
  color: "var(--color-text-primary)",
  fontSize: "1.1rem",
  fontWeight: 600,
  lineHeight: 1.2,
};
const historyDateTextSx = {
  color: "var(--color-text-secondary)",
  fontSize: "0.92rem",
};
const infoStatusChipBaseSx = { ml: 1, borderWidth: 1, borderStyle: "solid", fontSize: "10px", fontWeight: 500, borderRadius: "4px" };
const infoStatusChipSx = (status: string) => {
  if (status === "AVAILABLE") {
    return {
      ...infoStatusChipBaseSx,
      backgroundColor: "var(--color-success-bg)",
      color: "var(--color-success)",
      borderColor: "var(--color-success)",
    };
  }

  if (status === "EXCHANGEABLE") {
    return {
      ...infoStatusChipBaseSx,
      backgroundColor: "var(--color-info-bg)",
      color: "var(--color-info)",
      borderColor: "var(--color-info)",
    };
  }

  if (status === "GIFT") {
    return {
      ...infoStatusChipBaseSx,
      backgroundColor: "var(--color-warning-bg)",
      color: "var(--color-warning)",
      borderColor: "var(--color-warning)",
    };
  }

  return {
    ...infoStatusChipBaseSx,
    backgroundColor: "var(--color-bg-subtle)",
    color: "var(--color-text-secondary)",
    borderColor: "var(--color-border-subtle)",
  };
};
const statusBoxContainerSx = {
  my: 3,
  p: 2,
  display: "flex",
  gap: 1.5,
  alignItems: "flex-start",
  backgroundColor: "var(--color-text-secondary)",
  borderRadius: 2,
};
const statusBoxIconSx = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  backgroundColor: "var(--color-text-primary)",
  color: "var(--color-text-inverse)",
  fontSize: "0.75rem",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mt: 0.35,
  flexShrink: 0,
};
const statusBoxIconTextSx = { fontSize: "0.75rem", lineHeight: 1, fontWeight: 700 };
const statusBoxTitleSx = { color: "var(--color-bg-surface)" };
const statusBoxBodySx = { color: "var(--color-bg-surface)", opacity: 0.95 };
const mb4Sx = { mb: 4 };
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
const dialogTopPaddingSx = { pt: 1 };
const mt2Sx = { mt: 2 };
const progressMr1Sx = { mr: 1 };
const fullWidthSx = { width: "100%" };
const commentsWrapSx = { mt: 4 };

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
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  const itemTransactions = useQuery<{
    transactionsByItem: Array<{
      id: string;
      status: TransactionStatus;
      createdAt: string;
      updatedAt: string;
      requestor: { id: string; nickname?: string | null; email: string };
      receiver?: { id: string; nickname?: string | null; email: string } | null;
    }>;
  }>(ITEM_TRANSACTIONS_QUERY, {
    variables: { itemId: itemId! },
    skip: !itemId,
    fetchPolicy: "cache-and-network",
  });

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
  const canBorrowBook = user && !isHolder;
  const canReturnBook = user && !isOwner && isHolder;

  const hasAddToBooklistButton = Boolean(user && availableBooklists.length > 0);
  const hasRequestButton = Boolean(canBorrowBook || canReturnBook || !user);
  const primaryActionButtonCount =
    Number(hasAddToBooklistButton) + Number(hasRequestButton);
  const primaryActionsRowSxDynamic = {
    ...primaryActionsRowSx,
    gridTemplateColumns:
      primaryActionButtonCount === 2
        ? twoColumnGridTemplateColumns
        : "1fr",
  };
  const primaryActionButtonGridItemSx = {
    gridColumn: primaryActionButtonCount === 1 ? "1 / -1" : undefined,
  };

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
    subject?: string,
    emailContent?: string,
  ) => {
    if (!itemId) return;

    try {
      const details = buildDetailsString();
      await contactHolder({
        variables: {
          itemId,
          location,
          locationIndex: locationIndex || 0,
          subject: subject || "",
          emailContent: emailContent || "",
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
        titleKey: "item.availableMessage",
        descriptionKey: "item.availableDescription",
      },
      EXCHANGEABLE: {
        icon: "🔄",
        titleKey: "item.exchangeableMessage",
        descriptionKey: "item.exchangeableDescription",
      },
      GIFT: {
        icon: "🎁",
        titleKey: "item.gift",
        descriptionKey: "item.giftDescription",
      },
    } as const;

    const variant =
      STATUS_BOX_VARIANTS[status as keyof typeof STATUS_BOX_VARIANTS];

    if (!variant) return null;

    return (
      <Box sx={statusBoxContainerSx}>
        <Box sx={statusBoxIconSx}>
          <Typography sx={statusBoxIconTextSx}>
            {variant.icon}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={statusBoxTitleSx}>
            {t(variant.titleKey)}
          </Typography>
          <Typography variant="body2" sx={statusBoxBodySx}>
            {t(variant.descriptionKey)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const formatHistoryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      <Container maxWidth="md" sx={pageContainerSx}>
        <Box sx={headerRowSx}>
          <IconButton onClick={handleBack} sx={backIconButtonSx}>
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
                    variant="filled"
                    sx={{
                      ...tagChipSx,
                      fontWeight: segIndex === segments.length - 1 ? 600 : 400,
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

  const heroPreviewImage =
    data?.item?.thumbnails?.[0] || data?.item?.images?.[0] || "";
  const normalizedDescription =
    data?.item?.description?.replace(/#Uncategorized\b/gi, "") || "";
  const shouldShowReadMore = normalizedDescription.length > 180;

  const handoverEvents = useMemo(() => {
    if (!data?.item) {
      return [] as Array<{ id: string; text: string; date: string; active?: boolean }>;
    }

    const ownerName = ownerData?.user?.nickname || ownerData?.user?.email || t("item.unknownOwner", "Owner");
    const ownerEvent = {
      id: `owner-${data.item.id}`,
      text: t("item.historyOwnedBy", "Owned by {{name}}", { name: ownerName }),
      date: data.item.createdAt,
    };

    const transactions = (itemTransactions.data?.transactionsByItem || [])
      .slice()
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

    const latestHandedTo = transactions
      .slice()
      .reverse()
      .find((tx) =>
        (tx.status === TransactionStatus.Completed ||
          tx.status === TransactionStatus.Transfered) &&
        (tx.receiver?.nickname || tx.receiver?.email),
      );

    const latestRequestedBy = transactions
      .slice()
      .reverse()
      .find((tx) => tx.requestor?.nickname || tx.requestor?.email);

    const events: Array<{ id: string; text: string; date: string; active?: boolean }> = [ownerEvent];

    if (latestHandedTo) {
      events.push({
        id: latestHandedTo.id,
        text: t("item.historyHandedTo", "Handed to {{name}}", {
          name: latestHandedTo.receiver?.nickname || latestHandedTo.receiver?.email,
        }),
        date: latestHandedTo.updatedAt,
        active: true,
      });
    } else if (latestRequestedBy) {
      events.push({
        id: latestRequestedBy.id,
        text: t("item.historyRequestedBy", "Requested by {{name}}", {
          name: latestRequestedBy.requestor?.nickname || latestRequestedBy.requestor?.email,
        }),
        date: latestRequestedBy.createdAt,
      });
    }

    return events;
  }, [data?.item, itemTransactions.data?.transactionsByItem, ownerData?.user, t]);

  return (
    <Container maxWidth="md" sx={pageContainerSx}>
      {/* Header with Back Button */}
      <Box sx={headerRowSx}>
        <IconButton onClick={handleBack} sx={backIconButtonSx}>
          <ArrowBack />
        </IconButton>
        {data?.item ? (
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {data.item.name}
            <>
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
                      color: isItemPinned()
                        ? "primary.main"
                        : "action.disabled",
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
                      label={t(
                        "item.pinnedItemsStatus",
                        "Pinned: {{count}}/5",
                        {
                          count: ownerData.user.pinItems.length,
                        },
                      )}
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
                      label={`${t("item.owner", "Owner")}: ${ownerData.user.nickname || ownerData.user.email
                        } `}
                      color="primary"
                      size="small"
                      sx={{ ml: 2, cursor: "pointer" }}
                      onClick={() => handleUserClick(ownerData.user.id)}
                    />
                  )}
                </>
              )}

              <>
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
                      label={`${t("item.holder", "Holder")}: ${holderData.user.nickname || holderData.user.email
                        } `}
                      color="secondary"
                      size="small"
                      sx={{ ml: 2, cursor: "pointer" }}
                      onClick={() => handleUserClick(holderData.user.id)}
                    />
                  )}
                <Chip
                  label={`${t("item.deposit", "deposit")}: ${data.item.deposit
                    } `}
                  color="secondary"
                  size="small"
                  sx={{ ml: 2, cursor: "pointer" }}
                />
              </>
            </>
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
            sx={shareIconButtonSx}
          >
            <ShareIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={loadingBlockSx}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={sectionMb4Sx}>
          {t("item.errorLoading")}: {error.message}
        </Alert>
      )}

      {/* Item Content */}
      {data?.item && (
        <Paper
          elevation={1}
          sx={paperSectionSx}
        >
          <Box sx={heroRowSx}>
            <Paper
              elevation={0}
              sx={heroImagePaperSx}
              onClick={() => {
                if (heroPreviewImage) {
                  handleThumbnailClick(0);
                }
              }}
            >
              {heroPreviewImage ? (
                <img
                  src={heroPreviewImage}
                  alt={data.item.name}
                  style={heroImageStyle}
                />
              ) : (
                <Box sx={heroFallbackImageSx}>
                  {t("item.noImage", "Image")}
                </Box>
              )}
            </Paper>

            <Box>
              <Box sx={heroMetaRowSx}>
                <Box sx={heroMetaItemSx}>
                  <Typography variant="body1" color="text.secondary" sx={heroMetaLabelSx}>
                    {t("item.status", "Status")}
                  </Typography>
                  <Chip
                    label={t(`shortStatus.${data.item.status} `, data.item.status)}
                    size="small"
                    sx={infoStatusChipSx(data.item.status)}
                  />
                </Box>
                <Box sx={heroMetaItemSx}>
                  <Typography sx={heroMetaLabelSx}>
                    {t("item.condition", "Condition")}
                  </Typography>
                  <Chip
                    label={t(`item.conditions.${data.item.condition}`, data.item.condition)}
                    color="default"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Box sx={heroMetaItemSx}>
                  <Typography sx={heroMetaLabelSx}>
                    {t("item.deposit", "Deposit")}
                  </Typography>
                  <Chip
                    label={data?.item.deposit ? `${data.item.deposit} AUD` : t("common.none", "None")}
                    size="small"
                    sx={tinyMetaChipSx}
                  />
                </Box>
              </Box>

              <Typography sx={heroTitleSx}>{data.item.name}</Typography>

              <Box sx={flexWrapRowSx}>
                {isOwner ? (
                  <>
                    <Chip
                      label={t("item.owner", "Owner")}
                      size="small"
                      sx={tagChipSx}
                    />
                    <IconButton
                      onClick={handlePinToggle}
                      disabled={pinLoading || unpinLoading}
                      sx={ownerPinButtonSx}
                      title={
                        isItemPinned()
                          ? t("item.unpinItem", "Unpin item")
                          : t("item.pinItem", "Pin item")
                      }
                    >
                      {pinLoading || unpinLoading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <PinIcon sx={pinIconSx(isItemPinned())} />
                      )}
                    </IconButton>
                  </>
                ) : (
                  <>
                    {ownerData?.user && (
                      <Chip
                        label={`${t("item.owner", "Owner")}: ${ownerData.user.nickname || ownerData.user.email}`}
                        size="small"
                        sx={tagChipSx}
                        onClick={() => handleUserClick(ownerData.user.id)}
                      />
                    )}
                    {!isHolder &&
                      holderData?.user &&
                      data.item.holderId !== data.item.ownerId && (
                        <Chip
                          label={`${t("item.holder", "Holder")}: ${holderData.user.nickname || holderData.user.email}`}
                          size="small"
                          sx={tagChipSx}
                          onClick={() => handleUserClick(holderData.user.id)}
                        />
                      )}
                  </>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={sectionMb4Sx}>
            <Typography
              variant="subtitle1"
              sx={sectionTitleSx}
            >
              {t("item.tags", "Tags")}
            </Typography>
            <Box sx={tagsListSx}>
              {renderClassificationPath(data.item.clssfctns)}
              {data.item.category && data.item.category.length > 0 && (
                <>
                  {data.item.category.map((category, index) => (
                    <Chip
                      key={index}
                      label={category}
                      variant="filled"
                      sx={tagChipSx}
                    />
                  ))}
                </>
              )}
            </Box>
          </Box>

          {/* Description */}
          {normalizedDescription && (
            <DetailSectionCard
              title={t("item.description", "Book Description")}
            >
              <Typography variant="body1" sx={descriptionContentSx(showFullDescription)}>
                {convertLinksToClickable(
                  normalizedDescription,
                )}
              </Typography>
              {shouldShowReadMore && (
                <Button
                  variant="text"
                  sx={descriptionToggleButtonSx}
                  onClick={() => setShowFullDescription((prev) => !prev)}
                >
                  {showFullDescription
                    ? t("common.showLess", "Show less")
                    : t("common.readMore", "Read more")}
                </Button>
              )}
            </DetailSectionCard>
          )}

          <Box sx={historySectionSx}>
            <Typography sx={historyTitleSx}>
              {t("item.handoverHistory", "Handover History")}
            </Typography>
            <Box sx={historyLineWrapSx}>
              <Box sx={historyLineSx} />
              {handoverEvents.map((event) => (
                <Box key={event.id} sx={historyRowSx}>
                  <Box sx={event.active ? historyDotActiveSx : historyDotSx} />
                  <Typography sx={historyItemTextSx}>{event.text}</Typography>
                  <Typography sx={historyDateTextSx}>
                    {formatHistoryDate(event.date)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* IMAGES — visual first */}
          {((data.item.thumbnails && data.item.thumbnails.length > 0) ||
            (data.item.images && data.item.images.length > 0)) && (
              <Box sx={mb4Sx}>
                <Box sx={sectionMb4Sx}>
                  <Grid container spacing={2}>
                    {(data.item.thumbnails && data.item.thumbnails.length > 0
                      ? data.item.thumbnails
                      : data.item.images || []
                    ).map((image, index) => (
                      <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
                        <Paper
                          elevation={2}
                          sx={thumbnailPaperSx}
                          onClick={() => handleThumbnailClick(index)}
                        >
                          <img
                            src={image}
                            alt={`${data.item.name} - Thumbnail ${index + 1} `}
                            style={thumbnailImageStyle}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}

          {/* ITEM INFO GRID */}
          <Card
            elevation={0}
            sx={infoCardSx}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.status", "Status")}:</strong>{" "}
                    <Chip
                      label={t(`shortStatus.${data.item.status} `, data.item.status)}
                      size="small"
                      sx={infoStatusChipSx(data.item.status)}
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

          <Box sx={primaryActionsRowSxDynamic}>
            {hasAddToBooklistButton ? (
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={handleAddToBooklistClick}
                disabled={newsRecent.loading || updateBooklistLoading}
                startIcon={<ArticleIcon />}
                sx={{ ...addBookshelfButtonSx, ...primaryActionButtonGridItemSx }}
              >
                {t("item.addbooklist", "Add to Bookshelf")}
              </Button>
            ) : null}

            {hasRequestButton ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth={primaryActionButtonCount === 1}
                onClick={handleRequestClick}
                sx={{ ...primaryActionButtonSx, ...primaryActionButtonGridItemSx }}
                disabled={contactHolderLoading}
              >
                {contactHolderLoading ? (
                  <CircularProgress size={20} sx={inheritProgressSx} />
                ) : null}
                {canReturnBook
                  ? t("item.return")
                  : t("item.requestToBorrow", "Request To Borrow")}
              </Button>
            ) : null}
          </Box>

          {/* 7. SECONDARY ACTIONS */}
          <Box sx={secondaryActionsRowSx}>
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
                sx={relatedNewsListSx}
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
      )
      }
      {/* Edit Item Dialog */}
      {
        user && (
          <ItemForm
            open={editDialogOpen}
            user={user}
            onClose={() => setEditDialogOpen(false)}
            item={data?.item || null}
            onItemUpdated={handleEditSuccess}
            onError={handleEditError}
          />
        )
      }
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
                "Please set your location in your profile before requesting an item. This helps us match you with nearby items.",
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
          <Box sx={dialogTopPaddingSx}>
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
                sx={mt2Sx}
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
              <CircularProgress size={20} sx={progressMr1Sx} />
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
          sx={fullWidthSx}
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
          sx={fullWidthSx}
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
      {
        data?.item && (
          <Box sx={commentsWrapSx}>
            <ItemComments itemId={itemId!} currentUser={user} />
          </Box>
        )
      }

      {
        data?.item && (
          <ItemShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            itemName={data.item.name}
            itemUrl={itemShareUrl}
            adminTemplates={hostConfig?.itemShareMessageTemplates ?? []}
          />
        )
      }

      {/* News Form Dialog - For admins to create news related to the item */}
      {
        user && isAdmin && (
          <NewsForm
            open={newsFormOpen}
            onClose={() => setNewsFormOpen(false)}
            relatedItem={data?.item || null}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
          />
        )
      }
    </Container >
  );
};

export default ItemDetail;
