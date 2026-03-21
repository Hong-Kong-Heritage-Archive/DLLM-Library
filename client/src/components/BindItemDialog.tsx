import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormLabel,
  RadioGroup,
  FormControl,
  Radio,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  BinderPath,
  BindType,
  Binder,
  Item,
  User,
  BindInput,
  Role,
} from "../generated/graphql";
import {
  FolderOpen as FolderIcon,
  CreateNewFolder as NewFolderIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";

const GET_BINDER_PATHS = gql`
  query BinderPathsByUser($userId: ID!) {
    binderPathsByUser(userId: $userId) {
      id
      path
    }
  }
`;

const ADD_BIND_TO_BINDER = gql`
  mutation AddBindToBinder(
    $parentId: ID!
    $newBinderName: String
    $bind: BindInput!
    $beforeBindId: ID
  ) {
    addBindToBinder(
      parentId: $parentId
      newBinderName: $newBinderName
      bind: $bind
      beforeBindId: $beforeBindId
    ) {
      id
      name
      binds {
        id
        type
        name
      }
      updatedAt
    }
  }
`;

interface BindItemDialogProps {
  open: boolean;
  onClose: () => void;
  source: Item | Binder; // Can be either Item or Binder
  sourceType: "item" | "binder"; // Explicitly specify the type
  user: User;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const BindItemDialog: React.FC<BindItemDialogProps> = ({
  open,
  onClose,
  source,
  sourceType,
  user,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation();
  const [selectedBinderId, setSelectedBinderId] = useState<string>("");
  const [bindMode, setBindMode] = useState<"existing" | "new">("existing");
  const [newBinderName, setNewBinderName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Query binder paths for the user
  const {
    data: binderPathsData,
    loading: binderPathsLoading,
    error: binderPathsError,
  } = useQuery<{ binderPathsByUser: BinderPath[] }>(GET_BINDER_PATHS, {
    variables: { userId: user.id },
    skip: !open || !user.id,
    fetchPolicy: "cache-and-network",
  });

  // Mutation to add bind to binder
  const [addBindToBinder, { loading: addBindLoading }] = useMutation<
    { addBindToBinder: Binder },
    {
      parentId: string;
      newBinderName?: string;
      bind: { type: BindType; id: string; name: string };
      beforeBindId?: string;
    }
  >(ADD_BIND_TO_BINDER, {
    onCompleted: () => {
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      const errorMsg =
        error.message ||
        t(
          sourceType === "item"
            ? "binder.bindItemError"
            : "binder.bindBinderError",
          sourceType === "item"
            ? "Failed to bind item"
            : "Failed to bind binder",
        );
      setErrorMessage(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBinderId("");
      setBindMode("existing");
      setNewBinderName("");
      setErrorMessage(null);
    }
  }, [open]);

  // Auto-select first binder if only one exists
  useEffect(() => {
    if (
      binderPathsData?.binderPathsByUser &&
      binderPathsData.binderPathsByUser.length === 1 &&
      !selectedBinderId
    ) {
      setSelectedBinderId(binderPathsData.binderPathsByUser[0].id);
    }
  }, [binderPathsData, selectedBinderId]);

  // Filter out the source binder itself when binding a binder
  const availableBinders =
    binderPathsData?.binderPathsByUser?.filter((binderPath) => {
      // If binding a binder, exclude the source binder and its sub-binders
      if (sourceType === "binder") {
        const sourceBinder = source as Binder;
        console.log("Filtering binder:", binderPath.path, sourceBinder.name);
        if (binderPath.path.includes(sourceBinder.name)) {
          return false;
        }
      }
      return true;
    }) || [];

  const handleClose = () => {
    setSelectedBinderId("");
    setBindMode("existing");
    setNewBinderName("");
    setErrorMessage(null);
    onClose();
  };

  const handleBindModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBindMode(event.target.value as "existing" | "new");
    setErrorMessage(null);
  };

  const handleBinderSelect = (binderId: string) => {
    setSelectedBinderId(binderId);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    setErrorMessage(null);

    // Validate inputs
    if (
      bindMode === "existing" &&
      !selectedBinderId &&
      hasNoBinders === false
    ) {
      setErrorMessage(t("binder.selectBinderError", "Please select a binder"));
      return;
    }

    if (bindMode === "new" && !newBinderName.trim()) {
      setErrorMessage(
        t(
          "binder.newBinderNameError",
          "Please enter a name for the new binder",
        ),
      );
      return;
    }

    if (bindMode === "new" && !selectedBinderId) {
      setErrorMessage(
        t(
          "binder.selectParentBinderError",
          "Please select a parent binder to create the new binder in",
        ),
      );
      return;
    }

    try {
      const variables: {
        parentId: string;
        newBinderName?: string;
        bind: { type: BindType; id: string; name: string };
        beforeBindId?: string;
      } = {
        parentId: selectedBinderId,
        bind: {
          type: sourceType === "item" ? BindType.Item : BindType.Binder,
          id: source.id,
          name: source.name,
        },
      };

      if (bindMode === "new") {
        variables.newBinderName = newBinderName.trim();
      }

      if (hasNoBinders) {
        variables.newBinderName = user.nickname + "'s Root Binder";
      }

      await addBindToBinder({ variables });
    } catch (error) {
      console.error("Error binding:", error);
    }
  };

  const hasNoBinders = !binderPathsLoading && availableBinders.length === 0;

  // Get appropriate icon and labels based on source type
  const getSourceIcon = () => {
    return sourceType === "item" ? <FileIcon /> : <FolderIcon />;
  };

  const getSourceTypeLabel = () => {
    return sourceType === "item"
      ? t("binder.item", "Item")
      : t("binder.binder", "Binder");
  };

  const getDialogTitle = () => {
    return sourceType === "item"
      ? t("binder.bindItem", "Bind Item to Binder")
      : t("binder.bindBinder", "Bind Binder to Another Binder");
  };

  const getSourceDescription = () => {
    return sourceType === "item"
      ? t("binder.bindingItem", "Binding Item")
      : t("binder.bindingBinder", "Binding Binder");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getSourceIcon()}
          {getDialogTitle()}
        </Box>
      </DialogTitle>

      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {binderPathsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("binder.loadError", "Failed to load binders")}:{" "}
            {binderPathsError.message}
          </Alert>
        )}

        {/* Source Info */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: sourceType === "item" ? "grey.50" : "primary.light",
            borderRadius: 1,
            border: 1,
            borderColor: sourceType === "item" ? "grey.200" : "primary.main",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            {getSourceIcon()}
            <Typography variant="subtitle2" color="text.secondary">
              {getSourceDescription()}:
            </Typography>
            <Chip
              label={getSourceTypeLabel()}
              size="small"
              color={sourceType === "item" ? "default" : "primary"}
            />
          </Box>
          <Typography variant="h6">{source?.name}</Typography>
          {source?.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mt: 0.5,
              }}
            >
              {source.description}
            </Typography>
          )}
        </Box>

        {binderPathsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : hasNoBinders ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {sourceType === "item"
              ? t(
                  "binder.noBindersYet",
                  "You don't have any binders yet. A root binder will be created automatically when you bind your first item.",
                )
              : t(
                  "binder.noOtherBindersYet",
                  "You don't have any other binders. Create a binder first to organize this binder.",
                )}
          </Alert>
        ) : (
          <>
            {/* Bind Mode Selection */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">
                {t("binder.bindMode", "Bind Mode")}
              </FormLabel>
              <RadioGroup value={bindMode} onChange={handleBindModeChange}>
                <FormControlLabel
                  value="existing"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FolderIcon fontSize="small" />
                      {t("binder.bindToExisting", "Bind to existing binder")}
                    </Box>
                  }
                />
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <NewFolderIcon fontSize="small" />
                      {t(
                        "binder.createNewAndBind",
                        "Create new binder and bind",
                      )}
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ mb: 3 }} />

            {/* Binder Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>
                {bindMode === "existing"
                  ? t("binder.selectBinder", "Select Binder")
                  : t("binder.selectParentBinder", "Select Parent Binder")}
              </FormLabel>
              <RadioGroup
                value={selectedBinderId}
                onChange={(e) => handleBinderSelect(e.target.value)}
              >
                {availableBinders.map((binderPath) => (
                  <FormControlLabel
                    key={binderPath.id}
                    value={binderPath.id}
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body1">
                          {binderPath.path}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {binderPath.id}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor:
                        selectedBinderId === binderPath.id
                          ? "primary.main"
                          : "divider",
                      borderRadius: 1,
                      mb: 1,
                      px: 2,
                      py: 1,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* New Binder Name Input */}
            {bindMode === "new" && (
              <TextField
                fullWidth
                label={t("binder.newBinderName", "New Binder Name")}
                placeholder={t(
                  "binder.newBinderNamePlaceholder",
                  "Enter name for new binder",
                )}
                value={newBinderName}
                onChange={(e) => setNewBinderName(e.target.value)}
                required
                helperText={t(
                  "binder.newBinderHelp",
                  "A new binder will be created inside the selected parent binder",
                )}
                sx={{ mt: 2 }}
              />
            )}
          </>
        )}

        {/* Warning for binding binder to binder */}
        {sourceType === "binder" && !hasNoBinders && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t(
              "binder.nestedBinderInfo",
              "This binder will become a sub-binder of the selected parent binder.",
            )}
          </Alert>
        )}
      </DialogContent>

      {/* Only show actions if user is verified and is an admin */}
      {user && user.isVerified && user.role === Role.Admin && (
        <DialogActions>
          <Button onClick={handleClose} disabled={addBindLoading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={
              addBindLoading ||
              binderPathsLoading ||
              (!hasNoBinders &&
                ((bindMode === "existing" && !selectedBinderId) ||
                  (bindMode === "new" &&
                    (!selectedBinderId || !newBinderName.trim()))))
            }
          >
            {addBindLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {t("common.binding", "Binding...")}
              </>
            ) : bindMode === "new" ? (
              t("binder.createAndBind", "Create & Bind")
            ) : (
              t("common.bind", "Bind")
            )}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BindItemDialog;
