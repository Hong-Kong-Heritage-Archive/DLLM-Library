import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  MenuItem,
} from "@mui/material";
import { Close as CloseIcon, CheckCircle as ApproveIcon } from "@mui/icons-material";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Item } from "../generated/graphql";
import { getContentRatingOption, CONTENT_RATING_OPTIONS } from "../utils/contentRating";

const PENDING_CONTENT_RATING_QUERY = gql`
  query PendingContentRatingItems($limit: Int) {
    recentItemsWithoutClassifications(limit: $limit) {
      id
      name
      category
      condition
      status
      images
      thumbnails
      contentRating
      contentRatingChecked
      ownerId
    }
  }
`;

const UPDATE_ITEM_CHECKED_MUTATION = gql`
  mutation ApproveContentRating($id: ID!, $contentRating: Int, $contentRatingChecked: Boolean) {
    updateItem(id: $id, contentRating: $contentRating, contentRatingChecked: $contentRatingChecked) {
      id
      contentRating
      contentRatingChecked
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

  const getSelectedRating = (item: any): number =>
    selectedRatings[item.id] ?? item.contentRating ?? 1;

  const { data, loading, error, refetch } = useQuery<{
    recentItemsWithoutClassifications: Item[];
  }>(PENDING_CONTENT_RATING_QUERY, {
    variables: { limit: 100 },
    skip: !open,
    fetchPolicy: "network-only",
  });

  const [approveItem] = useMutation(UPDATE_ITEM_CHECKED_MUTATION, {
    onCompleted: () => {
      setApprovingId(null);
      refetch();
    },
    onError: () => setApprovingId(null),
  });

  // All items where contentRatingChecked is false
  const pendingItems = (data?.recentItemsWithoutClassifications ?? []).filter(
    (item: any) => !item.contentRatingChecked
  );

  const handleApprove = (item: any) => {
    const rating = getSelectedRating(item);
    setApprovingId(item.id);
    approveItem({ variables: { id: item.id, contentRating: rating, contentRatingChecked: true } });
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
              const opt = getContentRatingOption(item.contentRating);
              const selectedRating = getSelectedRating(item);
              return (
                <ListItem
                  key={item.id}
                  divider
                  sx={{ py: 1.5, alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <Box
                        component="span"
                        sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}
                      >
                        {opt && (
                          <Chip
                            label={t(opt.labelKey, opt.labelKey)}
                            color={opt.color as any}
                            size="small"
                          />
                        )}
                        <Chip
                          label={t("contentRating.pendingApproval", "Pending approval")}
                          color="warning"
                          size="small"
                        />
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                    <TextField
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
                      sx={{ minWidth: 160 }}
                    >
                      {CONTENT_RATING_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey, opt.labelKey)}
                        </MenuItem>
                      ))}
                    </TextField>
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
                      onClick={() => handleApprove(item)}
                    >
                      {t("contentRating.markAsReviewed", "Mark as Reviewed")}
                    </Button>
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
