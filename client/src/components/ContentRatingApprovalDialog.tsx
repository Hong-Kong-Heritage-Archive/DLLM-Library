import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Close as CloseIcon, CheckCircle as ApproveIcon } from "@mui/icons-material";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Item } from "../generated/graphql";
import {
  getContentRatingOption,
  CONTENT_RATING_OPTIONS,
} from "../utils/contentRating";

const PENDING_CONTENT_RATING_QUERY = gql`
  query PendingContentRatingItems($limit: Int) {
    recentItemsContentRatingNotChecked(limit: $limit) {
      id
      name
      category
      condition
      status
      images
      thumbnails
      contentRating
      contentRatingChecked
      shadowBanned
      ownerId
    }
  }
`;

const UPDATE_ITEM_MUTATION = gql`
  mutation ApproveContentRating($id: ID!, $contentRating: Int, $contentRatingChecked: Boolean, $shadowBanned: Boolean) {
    updateItem(id: $id, contentRating: $contentRating, contentRatingChecked: $contentRatingChecked, shadowBanned: $shadowBanned) {
      id
      contentRating
      contentRatingChecked
      shadowBanned
    }
  }
`;

interface ContentRatingApprovalDialogProps {
  open: boolean;
  onClose: () => void;
}

const ContentRatingApprovalDialog: React.FC<ContentRatingApprovalDialogProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  // Per-item selected rating: itemId -> rating value
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  // Per-item shadowBanned toggle: itemId -> boolean
  const [shadowBannedMap, setShadowBannedMap] = useState<Record<string, boolean>>({});

  const getSelectedRating = (item: any): number =>
    selectedRatings[item.id] ?? item.contentRating ?? 1;

  const getShadowBanned = (item: any): boolean =>
    shadowBannedMap[item.id] ?? item.shadowBanned ?? false;

  const { data, loading, error, refetch } = useQuery<{
    recentItemsContentRatingNotChecked: Item[];
  }>(PENDING_CONTENT_RATING_QUERY, {
    variables: { limit: 100 },
    skip: !open,
    fetchPolicy: "network-only",
  });

  const [updateItem] = useMutation(UPDATE_ITEM_MUTATION, {
    onCompleted: () => {
      setApprovingId(null);
      refetch();
    },
    onError: () => setApprovingId(null),
  });

  const pendingItems = data?.recentItemsContentRatingNotChecked ?? [];

  const handleConfirm = (item: any) => {
    const rating = getSelectedRating(item);
    const shadowBanned = getShadowBanned(item);
    setApprovingId(item.id);
    updateItem({
      variables: {
        id: item.id,
        contentRatingChecked: true,
        shadowBanned,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {t("contentRating.approvalDialog", "Content Rating Approval")}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {!loading && !error && pendingItems.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            {t("contentRating.noItemsPending", "No items pending approval.")}
          </Typography>
        )}

        {!loading && pendingItems.length > 0 && (
          <List disablePadding>
            {pendingItems.map((item: any) => {
              const selectedRating = getSelectedRating(item);
              const selectedOpt = getContentRatingOption(selectedRating);
              const thumbnail = item.thumbnails?.[0] ?? item.images?.[0];
              const shadowBanned = getShadowBanned(item);

              return (
                <ListItem
                  key={item.id}
                  divider
                  sx={{ py: 2, alignItems: "flex-start", gap: 2 }}
                >
                  {/* Thumbnail */}
                  {thumbnail && (
                    <Box
                      component="img"
                      src={thumbnail}
                      alt={item.name}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 1,
                        flexShrink: 0,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  )}
                  {!thumbnail && (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 1,
                        flexShrink: 0,
                        bgcolor: "action.hover",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">
                        {t("common.noImage", "No image")}
                      </Typography>
                    </Box>
                  )}

                  {/* Item info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      component="a"
                      href={`/item/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                    >
                      {item.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                      {item.category?.map((cat: string) => (
                        <Chip key={cat} label={cat} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  {/* Controls */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    {/* <TextField
                      select
                      size="small"
                      label={t("contentRating.label", "Content Rating")}
                      value={selectedRating}
                      onChange={(e) =>
                        setSelectedRatings((prev) => ({
                          ...prev,
                          [item.id]: Number(e.target.value),
                        }))
                      }
                      sx={{ minWidth: 180 }}
                    >
                      {CONTENT_RATING_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey, opt.labelKey)}
                        </MenuItem>
                      ))}
                    </TextField> */}

                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={shadowBanned}
                          color="warning"
                          onChange={(e) =>
                            setShadowBannedMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                        />
                      }
                      label={
                        <Typography variant="caption" color={shadowBanned ? "warning.main" : "text.secondary"}>
                          {t("contentRating.shadowBan", "Shadow ban")}
                        </Typography>
                      }
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={
                          approvingId === item.id ? (
                            <CircularProgress size={14} />
                          ) : (
                            <ApproveIcon />
                          )
                        }
                        disabled={approvingId === item.id}
                        onClick={() => handleConfirm(item)}
                      >
                        {t("contentRating.approve", "Approve")}
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{t("common.close", "Close")}</Button>
        <Button onClick={() => refetch()} disabled={loading}>
          {t("common.refresh", "Refresh")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContentRatingApprovalDialog;
