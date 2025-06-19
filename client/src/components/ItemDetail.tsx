import React from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Grid,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { Item, User } from "../generated/graphql";
import { useTranslation } from "react-i18next";
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
    }
  }
`;

interface ItemDetailProps {
  itemId: string | null;
  open: boolean;
  onClose: () => void;
  user?: User | null; // Assuming user is passed for potential future use
}

const ItemDetail: React.FC<ItemDetailProps> = ({
  itemId,
  open,
  onClose,
  user,
}) => {
  const { t } = useTranslation();

  const { data, loading, error } = useQuery<{ item: Item }>(ITEM_DETAIL_QUERY, {
    variables: { itemId: itemId! },
    skip: !itemId,
  });

  const isOwner = user && data?.item.ownerId === user.id;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: "90vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">
          {t("item.details", "item Details")} isOwner: {isOwner ? "Yes" : "No"}
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("item.errorLoading", "Error loading item details")}:{" "}
            {error.message}
          </Alert>
        )}

        {data?.item && (
          <Box>
            <Typography variant="h4" gutterBottom>
              {data.item.name}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("item.condition", "Condition")}:</strong>{" "}
                    {data.item.condition}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("item.status", "Status")}:</strong>{" "}
                    {data.item.status}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("item.language", "Language")}:</strong>{" "}
                    {data.item.language}
                  </Typography>
                </Grid>
                {data.item.publishedYear && (
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t("item.publishedYear", "Published")}:</strong>{" "}
                      {data.item.publishedYear}
                    </Typography>
                  </Grid>
                )}
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("item.addedOn", "Added on")}:</strong>{" "}
                    {new Date(data.item.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {data.item.description && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {t("item.description", "Description")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mb: 3, whiteSpace: "pre-wrap" }}
                >
                  {data.item.description}
                </Typography>
              </>
            )}

            {data.item.images && data.item.images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t("item.images", "Images")}
                </Typography>
                <Grid container spacing={2}>
                  {data.item.images.map((image, index) => (
                    <Grid key={index}>
                      <SafeImage
                        src={image}
                        alt={`${data.item.name} - Image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {data.item.category && data.item.category.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t("item.categories", "Categories")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {data.item.category.map((category, index) => (
                    <Chip
                      key={index}
                      label={category}
                      variant="outlined"
                      sx={{
                        backgroundColor: "default",
                        color: "default",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Action Buttons based on status */}
            {data.item.status === "AVAILABLE" && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "success.light",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="success.dark">
                  🎉{" "}
                  {t("item.available", "This item is available for borrowing!")}
                </Typography>
              </Box>
            )}

            {data.item.status === "EXCHANGEABLE" && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "info.light",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="info.dark">
                  🔄{" "}
                  {t(
                    "item.exchangeable",
                    "This item is available for exchange!"
                  )}
                </Typography>
              </Box>
            )}

            {data.item.status === "GIFT" && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "warning.light",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="warning.dark">
                  🎁 {t("item.gift", "This item is available as a gift!")}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t("common.close", "Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDetail;
