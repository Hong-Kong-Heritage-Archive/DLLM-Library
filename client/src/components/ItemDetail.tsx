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
  List,
  Card,
  CardContent,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  SwapHoriz as TransferIcon,
  PushPin as PinIcon, // Add this import
  ChevronRight as ChevronRightIcon,
  Article as ArticleIcon,
  Share as ShareIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon,
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
import TransferOwnershipConfirmDialog from "./TransferOwnershipConfirmDialog";
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
import AddToBooklistDialog from "./AddToBooklistDialog";
import DetailSectionCard from "../styles/DetailSectionCard";
import { semanticTokens } from "../styles/semanticTokens";
import {
  getItemStatusChipIcon,
  getItemStatusChipProps,
} from "../utils/itemStatusChip";

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
      updatedAt
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

const CREATE_TRANSACTION_MUTATION = gql`
  mutation CreateTransaction(
    $itemId: ID!
    $location: TransactionLocation!
    $locationIndex: Int
    $details: String
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

const TRANSFER_OWNERSHIP_MUTATION = gql`
  mutation TransferOwnership($itemId: ID!) {
    transferOwnership(itemId: $itemId) {
      id
      ownerId
      holderId
      updatedAt
    }
  }
`;

const CONFIRM_RETURN_MUTATION = gql`
  mutation ConfirmReturn($itemId: ID!, $details: String) {
    confirmReturn(itemId: $itemId, details: $details) {
      id
      status
      createdAt
      updatedAt
    }
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

const REQUEST_QUEUE_PAGE_SIZE = 5;

const INCOMPLETE_REQUESTS_QUERY = gql`
  query IncompleteRequestsByItem($itemId: ID!, $limit: Int, $offset: Int) {
    incompleteRequestsByItem(itemId: $itemId, limit: $limit, offset: $offset) {
      totalCount
      requests {
        id
        requestorName
        requestorEmail
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_INCOMPLETE_REQUEST_MUTATION = gql`
  mutation DeleteIncompleteRequest($id: ID!) {
    deleteIncompleteRequest(id: $id)
  }
`;

const DELETE_INCOMPLETE_REQUESTS_MUTATION = gql`
  mutation DeleteIncompleteRequests($ids: [ID!]!) {
    deleteIncompleteRequests(ids: $ids)
  }
`;

type IncompleteRequestRow = {
  id: string;
  requestorName: string;
  requestorEmail: string;
  createdAt: string | number;
  updatedAt: string | number;
};

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
  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
  gap: { xs: 1.25, sm: 1 },
  mb: 1.5,
  alignItems: "start",
};
const heroMetaItemSx = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 0.5,
  overflow: "hidden",
};
const heroMetaLabelSx = {
  fontSize: { xs: "0.68rem", sm: "0.72rem" },
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
  backgroundColor: semanticTokens.color.bgSurface,
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
  width: "100%",
  flexBasis: "100%",
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
  backgroundColor: semanticTokens.color.textPrimary,
  borderColor: semanticTokens.color.textPrimary,
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
const queueMetaTextSx = {
  color: "var(--color-text-secondary)",
  fontSize: "0.92rem",
  display: "block",
};
const queueActionsRowSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  alignItems: "center",
  mb: 1.5,
};
const queuePaginationRowSx = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  mt: 2,
};
const queueEmptyTextSx = {
  color: "var(--color-text-secondary)",
  fontSize: "0.95rem",
};
const infoStatusChipBaseSx = {
  ml: 1,
  borderWidth: 1,
  borderStyle: "solid",
  fontSize: "10px",
  fontWeight: 700,
  borderRadius: "4px",
  lineHeight: 1.4,
  px: 1,
  py: 0.5,
};
const infoStatusChipSx = (status: string) => {
  const palette = getItemStatusChipProps(status);

  return {
    ...infoStatusChipBaseSx,
    backgroundColor: palette.bgColor,
    color: palette.color,
    borderColor: palette.borderColor,
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
const statusBoxIconTextSx = {
  fontSize: "0.75rem",
  lineHeight: 1,
  fontWeight: 700,
};
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
  const [transferOwnershipDialogOpen, setTransferOwnershipDialogOpen] =
    useState(false);
  const [confirmReturnDialogOpen, setConfirmReturnDialogOpen] = useState(false);
  const [confirmReturnDetails, setConfirmReturnDetails] = useState("");

  // Add state for news form dialog
  const [newsFormOpen, setNewsFormOpen] = useState(false);

  const [booklistDialogMode, setBooklistDialogMode] = useState<
    "collaborative" | "personal" | null
  >(null);

  // State for location prompt dialog
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [queuePageNumber, setQueuePageNumber] = useState(1);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [queueDeleteConfirmIds, setQueueDeleteConfirmIds] = useState<
    string[] | null
  >(null);

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

  const canViewRequestQueue = Boolean(
    user &&
      data?.item &&
      (data.item.ownerId === user.id ||
        data.item.holderId === user.id ||
        (data.item.ownerId === user.id && data.item.holderId == null)),
  );
  const canManageRequestQueue = Boolean(
    user && data?.item && data.item.ownerId === user.id,
  );

  const incompleteRequestsQuery = useQuery<{
    incompleteRequestsByItem: {
      totalCount: number;
      requests: IncompleteRequestRow[];
    };
  }>(INCOMPLETE_REQUESTS_QUERY, {
    variables: {
      itemId: itemId!,
      limit: REQUEST_QUEUE_PAGE_SIZE,
      offset: (queuePageNumber - 1) * REQUEST_QUEUE_PAGE_SIZE,
    },
    skip: !itemId || !canViewRequestQueue,
    fetchPolicy: "cache-and-network",
  });

  const [deleteIncompleteRequest, { loading: deleteQueueLoading }] =
    useMutation(DELETE_INCOMPLETE_REQUEST_MUTATION);
  const [deleteIncompleteRequests, { loading: deleteQueueBatchLoading }] =
    useMutation(DELETE_INCOMPLETE_REQUESTS_MUTATION);

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
      onError: (error) => {
        // Email notify is best-effort after createTransaction succeeds.
        console.error("Error contacting holder:", error);
      },
    },
  );

  const [createTransaction, { loading: createTransactionLoading }] =
    useMutation(CREATE_TRANSACTION_MUTATION, {
      onCompleted: () => {
        setRequestDialogOpen(false);
        setSuccessMessage(t("item.requestSubmitted"));
        setSuccessSnackbarOpen(true);
        incompleteRequestsQuery.refetch().catch(() => undefined);
        itemTransactions.refetch().catch(() => undefined);
      },
      onError: (error) => {
        console.error("Error creating transaction:", error);
        setErrorMessage(error.message);
        setErrorSnackbarOpen(true);
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

  const [transferOwnership, { loading: transferOwnershipLoading }] =
    useMutation(TRANSFER_OWNERSHIP_MUTATION, {
      onCompleted: () => {
        setTransferOwnershipDialogOpen(false);
        setSuccessMessage(
          t("item.transferOwnershipSuccess", "Ownership transferred"),
        );
        setSuccessSnackbarOpen(true);
        refetch();
      },
      onError: (mutationError) => {
        setErrorMessage(mutationError.message);
        setErrorSnackbarOpen(true);
      },
    });

  const [confirmReturn, { loading: confirmReturnLoading }] = useMutation(
    CONFIRM_RETURN_MUTATION,
    {
      onCompleted: () => {
        setConfirmReturnDialogOpen(false);
        setConfirmReturnDetails("");
        setSuccessMessage(
          t("item.confirmReturnSuccess", "Item return confirmed"),
        );
        setSuccessSnackbarOpen(true);
        refetch();
      },
      onError: (mutationError) => {
        setErrorMessage(mutationError.message);
        setErrorSnackbarOpen(true);
      },
    },
  );

  const isOwner = user && data?.item?.ownerId === user.id;
  const isAdmin = user && user.role === Role.Admin;
  const isHolder =
    user &&
    (data?.item?.holderId === user.id ||
      (isOwner && data?.item?.holderId === null));
  const canBorrowBook = user && !isHolder;
  const canReturnBook = user && !isOwner && isHolder;
  const canTransferOwnership = Boolean(
    isOwner && data?.item?.holderId && data.item.holderId !== data.item.ownerId,
  );

  const hasAddToBooklistButton = Boolean(user);
  const hasRequestButton = Boolean(canBorrowBook || canReturnBook || !user);
  const primaryActionButtonCount =
    Number(hasAddToBooklistButton) + Number(hasRequestButton);
  const primaryActionsRowSxDynamic = {
    ...primaryActionsRowSx,
    gridTemplateColumns:
      primaryActionButtonCount === 2 ? twoColumnGridTemplateColumns : "1fr",
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
    setBooklistDialogMode("collaborative");
  };

  const handleAddToPersonalBooklistClick = () => {
    setBooklistDialogMode("personal");
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

  const handleTransferOwnershipClick = async () => {
    if (!itemId) return;
    setTransferOwnershipDialogOpen(true);
  };

  const handleConfirmTransferOwnership = async () => {
    if (!itemId) return;

    try {
      await transferOwnership({ variables: { itemId } });
    } catch (error) {
      console.error("Error transferring ownership:", error);
    }
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
      // Persist the borrow request into Firestore so it appears in the request queue.
      await createTransaction({
        variables: {
          itemId,
          location,
          locationIndex: locationIndex || 0,
          details: details,
        },
      });
      // Keep the existing email notification path (best-effort; do not fail the request).
      try {
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
      } catch (emailError) {
        console.error("Transaction created but email notify failed:", emailError);
      }
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

  const handleCloseTransferOwnershipDialog = () => {
    if (transferOwnershipLoading) return;
    setTransferOwnershipDialogOpen(false);
  };

  const handleConfirmReturnClick = () => {
    setConfirmReturnDetails("");
    setConfirmReturnDialogOpen(true);
  };

  const handleCloseConfirmReturnDialog = () => {
    if (confirmReturnLoading) return;
    setConfirmReturnDialogOpen(false);
    setConfirmReturnDetails("");
  };

  const handleConfirmReturn = async () => {
    if (!itemId) return;

    try {
      await confirmReturn({
        variables: {
          itemId,
          details: confirmReturnDetails || undefined,
        },
      });
    } catch (error) {
      console.error("Error confirming return:", error);
    }
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

  // const StatusBox = ({ status }: { status: string }) => {
  //   const STATUS_BOX_VARIANTS = {
  //     AVAILABLE: {
  //       icon: "🎉",
  //       titleKey: "item.availableMessage",
  //       descriptionKey: "item.availableDescription",
  //     },
  //     EXCHANGEABLE: {
  //       icon: "🔄",
  //       titleKey: "item.exchangeableMessage",
  //       descriptionKey: "item.exchangeableDescription",
  //     },
  //     GIFT: {
  //       icon: "🎁",
  //       titleKey: "item.gift",
  //       descriptionKey: "item.giftDescription",
  //     },
  //   } as const;

  //   const variant =
  //     STATUS_BOX_VARIANTS[status as keyof typeof STATUS_BOX_VARIANTS];

  //   if (!variant) return null;

  //   return (
  //     <Box sx={statusBoxContainerSx}>
  //       <Box sx={statusBoxIconSx}>
  //         <Typography sx={statusBoxIconTextSx}>{variant.icon}</Typography>
  //       </Box>
  //       <Box>
  //         <Typography
  //           variant="subtitle2"
  //           fontWeight={700}
  //           sx={statusBoxTitleSx}
  //         >
  //           {t(variant.titleKey)}
  //         </Typography>
  //         <Typography variant="body2" sx={statusBoxBodySx}>
  //           {t(variant.descriptionKey)}
  //         </Typography>
  //       </Box>
  //     </Box>
  //   );
  // };

  const formatHistoryDate = (dateString: string | number) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    setQueuePageNumber(1);
    setSelectedQueueIds([]);
  }, [itemId]);

  const queuePage = incompleteRequestsQuery.data?.incompleteRequestsByItem;
  const queueRequests = queuePage?.requests ?? [];
  const queueTotalCount = queuePage?.totalCount ?? 0;
  const queueTotalPages =
    queueTotalCount > 0
      ? Math.max(1, Math.ceil(queueTotalCount / REQUEST_QUEUE_PAGE_SIZE))
      : null;
  const queueHasNextPage =
    queueTotalCount > 0
      ? queuePageNumber * REQUEST_QUEUE_PAGE_SIZE < queueTotalCount
      : queueRequests.length === REQUEST_QUEUE_PAGE_SIZE;
  const canShowQueuePagination =
    queuePageNumber > 1 ||
    queueHasNextPage ||
    (queueTotalPages != null && queueTotalPages > 1);
  const queueDeleting = deleteQueueLoading || deleteQueueBatchLoading;

  const handleQueuePageChange = (
    _: React.ChangeEvent<unknown> | null,
    value: number,
  ) => {
    setQueuePageNumber(value);
    setSelectedQueueIds([]);
  };

  const toggleQueueSelection = (requestId: string) => {
    setSelectedQueueIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId],
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = queueRequests.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedQueueIds.includes(id));
    if (allSelected) {
      setSelectedQueueIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedQueueIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const refreshRequestQueue = async () => {
    await incompleteRequestsQuery.refetch();
    setSelectedQueueIds([]);
  };

  const handleConfirmQueueDelete = async () => {
    if (!queueDeleteConfirmIds || queueDeleteConfirmIds.length === 0) return;
    try {
      if (queueDeleteConfirmIds.length === 1) {
        await deleteIncompleteRequest({
          variables: { id: queueDeleteConfirmIds[0] },
        });
      } else {
        await deleteIncompleteRequests({
          variables: { ids: queueDeleteConfirmIds },
        });
      }
      setSuccessMessage(
        t("item.requestQueue.deleteSuccess", "Request(s) removed from queue"),
      );
      setSuccessSnackbarOpen(true);
      setQueueDeleteConfirmIds(null);
      // If the last item on this page was deleted, step back a page.
      const remainingOnPage =
        queueRequests.length - queueDeleteConfirmIds.length;
      if (remainingOnPage <= 0 && queuePageNumber > 1) {
        setQueuePageNumber((prev) => Math.max(1, prev - 1));
      }
      await refreshRequestQueue();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : t("item.requestQueue.deleteError", "Failed to delete request(s)"),
      );
      setErrorSnackbarOpen(true);
      setQueueDeleteConfirmIds(null);
    }
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
  // check number of characters > 100 or 3 line breaks to determine if "Read More" should be shown
  const shouldShowReadMore =
    normalizedDescription.length > 100 ||
    (normalizedDescription.match(/\n/g) || []).length >= 3;

  const handoverEvents = useMemo(() => {
    if (!data?.item) {
      return [] as Array<{
        id: string;
        text: string;
        date: string;
        active?: boolean;
      }>;
    }

    const ownerName =
      ownerData?.user?.nickname ||
      ownerData?.user?.email ||
      t("item.unknownOwner", "Owner");
    const ownerEvent = {
      id: `owner-${data.item.id}`,
      text: t("item.historyOwnedBy", "Owned by {{name}}", { name: ownerName }),
      date: data.item.createdAt,
    };

    const transactions = (itemTransactions.data?.transactionsByItem || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );

    const latestHandedTo = transactions
      .slice()
      .reverse()
      .find(
        (tx) =>
          (tx.status === TransactionStatus.Completed ||
            tx.status === TransactionStatus.Transfered) &&
          (tx.receiver?.nickname || tx.receiver?.email),
      );

    const latestRequestedBy = transactions
      .slice()
      .reverse()
      .find((tx) => tx.requestor?.nickname || tx.requestor?.email);

    const events: Array<{
      id: string;
      text: string;
      date: string;
      active?: boolean;
    }> = [ownerEvent];

    if (latestHandedTo) {
      events.push({
        id: latestHandedTo.id,
        text: t("item.historyHandedTo", "Handed to {{name}}", {
          name:
            latestHandedTo.receiver?.nickname || latestHandedTo.receiver?.email,
        }),
        date: latestHandedTo.updatedAt,
        active: true,
      });
    } else if (latestRequestedBy) {
      events.push({
        id: latestRequestedBy.id,
        text: t("item.historyRequestedBy", "Requested by {{name}}", {
          name:
            latestRequestedBy.requestor?.nickname ||
            latestRequestedBy.requestor?.email,
        }),
        date: latestRequestedBy.createdAt,
      });
    }

    return events;
  }, [
    data?.item,
    itemTransactions.data?.transactionsByItem,
    ownerData?.user,
    t,
  ]);

  return (
    <Container maxWidth="md" sx={pageContainerSx}>
      {/* Header with Back Button */}
      <Box sx={headerRowSx}>
        <IconButton onClick={handleBack} sx={backIconButtonSx}>
          <ArrowBack />
        </IconButton>
        {data?.item && (
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {data.item.name}
            {/* Show holder name if user is not the holder and holder is different from owner */}
            {isHolder && (
              <Chip
                label={t("item.holder", "Holder")}
                color="secondary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
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
        <Paper elevation={1} sx={paperSectionSx}>
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
                <Box sx={heroFallbackImageSx}>{t("item.noImage", "Image")}</Box>
              )}
            </Paper>

            <Box>
              <Box sx={heroMetaRowSx}>
                <Box sx={heroMetaItemSx}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={heroMetaLabelSx}
                  >
                    {t("item.status", "Status")}
                  </Typography>
                  <Chip
                    icon={getItemStatusChipIcon(data.item.status)}
                    label={t(
                      `shortStatus.${data.item.status}`,
                      data.item.status,
                    )}
                    size="small"
                    sx={{
                      ...infoStatusChipSx(data.item.status),
                      "& .MuiChip-icon": {
                        color: "inherit",
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </Box>
                <Box sx={heroMetaItemSx}>
                  <Typography sx={heroMetaLabelSx}>
                    {t("item.condition", "Condition")}
                  </Typography>
                  <Chip
                    label={t(
                      `item.conditions.${data.item.condition}`,
                      data.item.condition,
                    )}
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
                    label={
                      data?.item.deposit
                        ? `${data.item.deposit} AUD`
                        : t("common.none", "None")
                    }
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
                        // label={t("item.owner", "Owner")}
                        color="primary"
                        size="small"
                        sx={{ ml: 2 }}
                        //   sx={tagChipSx}
                        onClick={() =>
                          isOwner
                            ? undefined
                            : handleUserClick(ownerData.user.id)
                        }
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
            <Typography variant="subtitle1" sx={sectionTitleSx}>
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
              <Typography
                variant="body1"
                sx={descriptionContentSx(showFullDescription)}
              >
                {convertLinksToClickable(normalizedDescription)}
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

          {canViewRequestQueue && (
            <Box sx={historySectionSx}>
              <Typography sx={historyTitleSx}>
                {t("item.requestQueue.title", "Request Queue")}
              </Typography>
              {canManageRequestQueue && queueRequests.length > 0 && (
                <Box sx={queueActionsRowSx}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={
                          queueRequests.length > 0 &&
                          queueRequests.every((r) =>
                            selectedQueueIds.includes(r.id),
                          )
                        }
                        indeterminate={
                          selectedQueueIds.some((id) =>
                            queueRequests.some((r) => r.id === id),
                          ) &&
                          !queueRequests.every((r) =>
                            selectedQueueIds.includes(r.id),
                          )
                        }
                        onChange={toggleSelectAllOnPage}
                        disabled={queueDeleting}
                      />
                    }
                    label={t("item.requestQueue.selectAll", "Select page")}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    disabled={
                      selectedQueueIds.length === 0 || queueDeleting
                    }
                    onClick={() =>
                      setQueueDeleteConfirmIds([...selectedQueueIds])
                    }
                  >
                    {t("item.requestQueue.deleteSelected", "Delete selected")}
                    {selectedQueueIds.length > 0
                      ? ` (${selectedQueueIds.length})`
                      : ""}
                  </Button>
                </Box>
              )}
              {incompleteRequestsQuery.error ? (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {t(
                    "item.requestQueue.loadError",
                    "Failed to load request queue: {{message}}",
                    { message: incompleteRequestsQuery.error.message },
                  )}
                </Alert>
              ) : incompleteRequestsQuery.loading && !queuePage ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : queueRequests.length === 0 ? (
                <Typography sx={queueEmptyTextSx}>
                  {t(
                    "item.requestQueue.empty",
                    "No incomplete borrow requests.",
                  )}
                </Typography>
              ) : (
                <Box sx={historyLineWrapSx}>
                  <Box sx={historyLineSx} />
                  {queueRequests.map((request) => (
                    <Box key={request.id} sx={historyRowSx}>
                      <Box sx={historyDotSx} />
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        {canManageRequestQueue && (
                          <Checkbox
                            size="small"
                            checked={selectedQueueIds.includes(request.id)}
                            onChange={() => toggleQueueSelection(request.id)}
                            disabled={queueDeleting}
                            sx={{ p: 0.25, mt: 0.25 }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={historyItemTextSx}>
                            {request.requestorName}
                          </Typography>
                          <Typography sx={queueMetaTextSx}>
                            {request.requestorEmail}
                          </Typography>
                          <Typography sx={historyDateTextSx}>
                            {formatHistoryDate(request.updatedAt)}
                          </Typography>
                        </Box>
                        {canManageRequestQueue && (
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={t(
                              "item.requestQueue.deleteOne",
                              "Delete request",
                            )}
                            disabled={queueDeleting}
                            onClick={() =>
                              setQueueDeleteConfirmIds([request.id])
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              {canShowQueuePagination && (
                <Box sx={queuePaginationRowSx}>
                  <Button
                    variant="outlined"
                    disabled={queuePageNumber <= 1 || queueDeleting}
                    onClick={() =>
                      handleQueuePageChange(null, queuePageNumber - 1)
                    }
                  >
                    {t("common.previous", "Previous")}
                  </Button>
                  <Typography
                    sx={{ display: "flex", alignItems: "center", px: 2 }}
                  >
                    {queueTotalPages != null
                      ? t("common.pageOfTotal", "Page {{page}} of {{total}}", {
                          page: queuePageNumber,
                          total: queueTotalPages,
                        })
                      : t("item.currentPage", "Page {{page}}", {
                          page: queuePageNumber,
                        })}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={
                      !queueHasNextPage ||
                      queueDeleting ||
                      incompleteRequestsQuery.loading
                    }
                    onClick={() =>
                      handleQueuePageChange(null, queuePageNumber + 1)
                    }
                  >
                    {t("common.next", "Next")}
                  </Button>
                </Box>
              )}
            </Box>
          )}

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
          <Card elevation={0} sx={infoCardSx}>
            <CardContent>
              <Grid container spacing={3}>
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
                <Grid size={5}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("common.language")}:</strong>{" "}
                    {data.item.language}
                  </Typography>
                </Grid>
                <Grid size={user && getDistanceToOwner() ? 6 : 6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>{t("item.addedOn")}:</strong>{" "}
                    {new Date(data.item.createdAt).toLocaleDateString()}
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
                {(data.item as any).contentRating != null &&
                  (isOwner || !(data.item as any).contentRatingChecked) && (
                    <Grid size={7}>
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
          {/* <StatusBox status={data.item.status} /> */}

          <Box sx={primaryActionsRowSxDynamic}>
            {hasAddToBooklistButton ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 1,
                  ...primaryActionButtonGridItemSx,
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={handleAddToBooklistClick}
                  startIcon={<ArticleIcon />}
                  sx={{ ...addBookshelfButtonSx, flex: 1 }}
                >
                  {t("item.addbooklist", "Add to Bookshelf")}
                </Button>
                <IconButton
                  color="secondary"
                  onClick={handleAddToPersonalBooklistClick}
                  aria-label={t("item.addToMyBooklist", "Add to My Booklist")}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
                >
                  <FavoriteBorderIcon />
                </IconButton>
              </Box>
            ) : null}

            {hasRequestButton ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth={primaryActionButtonCount === 1}
                onClick={handleRequestClick}
                sx={{
                  ...primaryActionButtonSx,
                  ...primaryActionButtonGridItemSx,
                }}
                disabled={
                  contactHolderLoading || createTransactionLoading
                }
              >
                {contactHolderLoading || createTransactionLoading ? (
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
            {canTransferOwnership && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleTransferOwnershipClick}
                disabled={transferOwnershipLoading}
                startIcon={<TransferIcon />}
              >
                {t("item.transferOwnership.title", "Transfer Ownership")}
              </Button>
            )}
            {isOwner &&
              data?.item?.holderId &&
              data.item.holderId !== data.item.ownerId && (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={handleConfirmReturnClick}
                  disabled={confirmReturnLoading}
                  startIcon={<TransferIcon />}
                >
                  {t("item.confirmReturn", "Confirm Return")}
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

            {/* related news */}
            {itemNewsPosts?.data?.newsRecentPosts &&
              itemNewsPosts?.data?.newsRecentPosts.length > 0 && (
                <List sx={relatedNewsListSx}>
                  <Typography variant="h6">
                    {t("item.relatedNews", "Related News")}
                  </Typography>
                  {itemNewsPosts.data.newsRecentPosts.map(
                    (news: SimpleNews) => (
                      <NewsSummary
                        key={news.id}
                        news={news}
                        onClick={handleNewsItemClick}
                      />
                    ),
                  )}
                </List>
              )}
          </Box>
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
        loading={contactHolderLoading || createTransactionLoading}
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

      <TransferOwnershipConfirmDialog
        open={transferOwnershipDialogOpen}
        onClose={handleCloseTransferOwnershipDialog}
        onConfirm={handleConfirmTransferOwnership}
        loading={transferOwnershipLoading}
        itemName={data?.item?.name || ""}
      />

      {/* Request queue delete confirmation */}
      <Dialog
        open={queueDeleteConfirmIds !== null}
        onClose={() => (queueDeleting ? null : setQueueDeleteConfirmIds(null))}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {t("item.requestQueue.deleteTitle", "Remove from queue")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {queueDeleteConfirmIds && queueDeleteConfirmIds.length > 1
              ? t(
                  "item.requestQueue.deleteBatchConfirm",
                  "Delete {{count}} selected request(s) from the queue?",
                  { count: queueDeleteConfirmIds.length },
                )
              : t(
                  "item.requestQueue.deleteOneConfirm",
                  "Delete this borrow request from the queue?",
                )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setQueueDeleteConfirmIds(null)}
            disabled={queueDeleting}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirmQueueDelete}
            variant="contained"
            color="error"
            disabled={queueDeleting}
          >
            {queueDeleting ? (
              <CircularProgress size={20} sx={progressMr1Sx} />
            ) : null}
            {t("item.requestQueue.deleteConfirm", "Delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Return Dialog */}
      <Dialog
        open={confirmReturnDialogOpen}
        onClose={handleCloseConfirmReturnDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("item.confirmReturn", "Confirm Return")}</DialogTitle>
        <DialogContent>
          <Box sx={dialogTopPaddingSx}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t(
                "item.confirmReturnDescription",
                "Are you sure you want to confirm the return of {{name}}? This will mark the item as returned and notify the holder.",
                { name: data?.item?.name || "" },
              )}
            </Typography>
            <TextField
              label={t("item.details1", "Details (optional)")}
              value={confirmReturnDetails}
              onChange={(event) => setConfirmReturnDetails(event.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseConfirmReturnDialog}
            disabled={confirmReturnLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirmReturn}
            variant="contained"
            color="success"
            disabled={confirmReturnLoading}
          >
            {confirmReturnLoading ? (
              <CircularProgress size={20} sx={progressMr1Sx} />
            ) : null}
            {t("common.confirm", "Confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <AddToBooklistDialog
        open={booklistDialogMode !== null}
        mode={booklistDialogMode ?? "collaborative"}
        itemId={itemId ?? ""}
        userId={user?.id ?? ""}
        nickname={user?.nickname ?? ""}
        onClose={() => setBooklistDialogMode(null)}
        onAdded={() => {
          setBooklistDialogMode(null);
          setSuccessMessage(t("item.addBooklistSuccess", "Added to booklist"));
          setSuccessSnackbarOpen(true);
        }}
        onError={(message) => {
          setErrorMessage(message);
          setErrorSnackbarOpen(true);
        }}
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
      {data?.item && (
        <Box sx={commentsWrapSx}>
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
