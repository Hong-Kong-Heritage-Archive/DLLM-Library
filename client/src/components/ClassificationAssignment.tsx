import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Item } from "../generated/graphql";

import ClassificationEditor from "./ClassificationEditor";

const RECENT_ITEMS_WITHOUT_CLASSIFICATIONS = gql`
  query RecentItemsWithoutClassifications($limit: Int) {
    recentItemsWithoutClassifications(limit: $limit) {
      id
      name
      description
      category
      updatedAt
      images
      thumbnails
      condition
      status
      language
      publishedYear
      clssfctns
    }
  }
`;

const UPDATE_ITEM_CLASSIFICATION = gql`
  mutation UpdateItemClassification($id: ID!, $classifications: [String!]) {
    updateItem(id: $id, classifications: $classifications) {
      id
      clssfctns
    }
  }
`;

interface ClassificationAssignmentProps {
  open: boolean;
  onClose: () => void;
}

interface ItemDetailDialogProps {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onClassificationUpdated: () => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  open,
  item,
  onClose,
  onClassificationUpdated,
}) => {
  const { t } = useTranslation();
  const [classifications, setClassifications] = useState<string[]>([]);

  const [updateItemClassification, { loading: updateLoading }] = useMutation(
    UPDATE_ITEM_CLASSIFICATION,
    {
      onCompleted: () => {
        onClassificationUpdated();
        onClose();
      },
      refetchQueries: [
        {
          query: RECENT_ITEMS_WITHOUT_CLASSIFICATIONS,
          variables: { limit: 50 },
        },
      ],
    }
  );

  // Initialize classifications when dialog opens
  React.useEffect(() => {
    if (open && item) {
      setClassifications(item.clssfctns || []);
    }
  }, [open, item]);

  // Submit classifications
  const handleSubmit = () => {
    if (!item) return;

    updateItemClassification({
      variables: {
        id: item.id,
        classifications: classifications,
      },
    });
  };

  if (!item) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "50vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">{item.name}</Typography>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          size="small"
          color="inherit"
        >
          {t("common.close", "Close")}
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        {/* Item Image */}
        {(item.thumbnails?.[0] || item.images?.[0]) && (
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={item.thumbnails?.[0] || item.images?.[0]}
              alt={item.name}
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </Box>
        )}

        {/* Item Details */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: "action.hover", mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("item.name", "Item Name")}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {item.name}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("item.description", "Description")}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {item.description || t("common.notAvailable", "N/A")}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            <CategoryIcon
              sx={{ verticalAlign: "middle", mr: 1, fontSize: 18 }}
            />
            {t("item.category", "Category")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {item.category && item.category.length > 0 ? (
              item.category.map((cat, index) => (
                <Chip
                  key={index}
                  label={cat}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("common.notAvailable", "N/A")}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Additional Info */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("item.condition", "Condition")}
              </Typography>
              <Chip
                label={t(`item.conditions.${item.condition}`, item.condition)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("item.status", "Status")}
              </Typography>
              <Chip
                label={t(`item.statuses.${item.status}`, item.status)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("item.language", "Language")}
              </Typography>
              <Chip
                label={t(`languages.${item.language}`, item.language)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>

            {item.publishedYear && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("item.publishedYear", "Published Year")}
                </Typography>
                <Chip
                  label={item.publishedYear}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            <CalendarIcon
              sx={{ verticalAlign: "middle", mr: 1, fontSize: 18 }}
            />
            {t("item.lastUpdated", "Last Updated")}
          </Typography>
          <Typography variant="body2">{formatDate(item.updatedAt)}</Typography>
        </Paper>

        {/* Classification Assignment UI */}
        <ClassificationEditor
          classifications={classifications}
          onChange={setClassifications}
          showAddCategoryButton={true}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={updateLoading}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          startIcon={
            updateLoading ? <CircularProgress size={20} /> : <CheckIcon />
          }
          onClick={handleSubmit}
          disabled={updateLoading || classifications.length === 0}
        >
          {t("classification.saveClassifications", "Save Classifications")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ClassificationAssignment: React.FC<ClassificationAssignmentProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemDetailOpen, setItemDetailOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    recentItemsWithoutClassifications: Item[];
  }>(RECENT_ITEMS_WITHOUT_CLASSIFICATIONS, {
    variables: { limit: 50 },
    skip: !open,
  });

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setItemDetailOpen(true);
  };

  const handleItemDetailClose = () => {
    setItemDetailOpen(false);
    setSelectedItem(null);
  };

  const handleClassificationUpdated = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: "80vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {t(
              "classification.recentItemsWithoutClassifications",
              "Items Without Classifications"
            )}
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            size="small"
            color="inherit"
          >
            {t("common.close", "Close")}
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          {/* Loading State */}
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("common.errorLoading", "Error loading data")}: {error.message}
            </Alert>
          )}

          {/* Items List */}
          {!loading && !error && (
            <>
              {data?.recentItemsWithoutClassifications.length === 0 ? (
                <Alert severity="success">
                  {t(
                    "classification.noItemsFound",
                    "All items have been classified! Great job!"
                  )}
                </Alert>
              ) : (
                <List>
                  {data?.recentItemsWithoutClassifications.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => handleItemClick(item)}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          "&:hover": {
                            backgroundColor: "action.hover",
                          },
                        }}
                      >
                        {/* Thumbnail */}
                        {(item.thumbnails?.[0] || item.images?.[0]) && (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={item.thumbnails?.[0] || item.images?.[0]}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                          </Box>
                        )}

                        {/* Item Info */}
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {item.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              {/* Categories */}
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  mb: 0.5,
                                }}
                              >
                                <CategoryIcon
                                  sx={{
                                    fontSize: 16,
                                    color: "text.secondary",
                                    mr: 0.5,
                                  }}
                                />
                                {item.category && item.category.length > 0 ? (
                                  item.category.map((cat, index) => (
                                    <Chip
                                      key={index}
                                      label={cat}
                                      size="small"
                                      sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                  ))
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {t("common.noCategory", "No category")}
                                  </Typography>
                                )}
                              </Box>

                              {/* Last Updated */}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <CalendarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                {t("item.updated", "Updated")}:{" "}
                                {formatDate(item.updatedAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Item Count */}
              {data && data.recentItemsWithoutClassifications.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 2, textAlign: "center" }}
                >
                  {t("classification.itemCount", "Showing {{count}} item(s)", {
                    count: data.recentItemsWithoutClassifications.length,
                  })}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <ItemDetailDialog
        open={itemDetailOpen}
        item={selectedItem}
        onClose={handleItemDetailClose}
        onClassificationUpdated={handleClassificationUpdated}
      />
    </>
  );
};

export default ClassificationAssignment;
