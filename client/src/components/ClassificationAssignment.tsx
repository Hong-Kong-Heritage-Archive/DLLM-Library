import React, { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  IconButton,
  TextField,
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  PlaylistAdd as AddCategoryIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Item, CategoryMap } from "../generated/graphql";

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

const UPDATE_ITEM_CLASSIFICATION = gql`
  mutation UpdateItemClassification($id: ID!, $classifications: [String!]) {
    updateItem(id: $id, classifications: $classifications) {
      id
      clssfctns
    }
  }
`;

const UPSERT_CATEGORY_MAP = gql`
  mutation UpsertCategoryMap(
    $en: String!
    $categoryMaps: [CategoryMapInput!]!
  ) {
    upsertCategoryMap(en: $en, categoryMaps: $categoryMaps) {
      language
      value
    }
  }
`;

const ADD_CATEGORY_TREE = gql`
  mutation AddCategoryTree($parentPath: String, $leafCategory: String!) {
    addCategoryTree(parentPath: $parentPath, leafCategory: $leafCategory)
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

interface CategoryTreeNode {
  path: string;
  level: number;
  value: string;
  children: string[];
}

interface NewCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  parentPath: string;
  onSuccess: () => void;
}

const NewCategoryDialog: React.FC<NewCategoryDialogProps> = ({
  open,
  onClose,
  parentPath,
  onSuccess,
}) => {
  const { t } = useTranslation();
  // Define supported languages
  const languages = ["en", "zh-TW", "zh-CN"];
  const [translations, setTranslations] = useState<{ [key: string]: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [upsertCategoryMap] = useMutation(UPSERT_CATEGORY_MAP);
  const [addCategoryTree] = useMutation(ADD_CATEGORY_TREE);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTranslations({});
      setError(null);
    }
  }, [open]);

  const handleTranslationChange = (lang: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [lang]: value }));
    setError(null); // Clear error when user types
  };

  const handleSubmit = async () => {
    // Validate English is present (used as key)
    if (!translations["en"]) {
      setError(
        t(
          "classification.englishRequired",
          "English name is required as the system key"
        )
      );
      return;
    }

    // Validate that English value doesn't contain special characters
    const englishValue = translations["en"].trim();
    if (!/^[a-zA-Z0-9\s-]+$/.test(englishValue)) {
      setError(
        t(
          "classification.invalidEnglishFormat",
          "English name can only contain letters, numbers, spaces, and hyphens"
        )
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryKey = englishValue; // Use English as the key

      // 1. Prepare Category Map Input (excluding English since it's passed separately)
      const categoryMapInput = Object.entries(translations)
        .filter(([lang]) => lang !== "en") // Exclude 'en' as it's passed as the 'en' parameter
        .map(([lang, value]) => ({
          language: lang,
          value: value.trim(),
        }));

      // 2. Call Upsert Category Map
      // The 'en' parameter is the English value (document ID/key)
      // The categoryMaps array contains translations for other languages
      await upsertCategoryMap({
        variables: {
          en: categoryKey,
          categoryMaps: categoryMapInput,
        },
      });

      // 3. Call Add Category Tree
      // Pass parentPath (can be null/undefined for root) and the leaf category
      await addCategoryTree({
        variables: {
          parentPath: parentPath || null,
          leafCategory: categoryKey,
        },
      });

      // Success!
      onSuccess();
      onClose();
      setTranslations({});
    } catch (err: any) {
      console.error("Error creating category:", err);
      setError(err.message || t("common.error", "Error creating category"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTranslations({});
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("classification.addNewCategory", "Add New Category")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {parentPath
              ? t("classification.addingUnder", "Adding under: {{path}}", {
                path: parentPath,
              })
              : t("classification.addingRoot", "Adding as root category")}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {languages.map((lang) => (
              <Grid size={{ xs: 12 }} key={lang}>
                <TextField
                  fullWidth
                  label={`${t(`languages.${lang}`, lang)} (${lang})`}
                  value={translations[lang] || ""}
                  onChange={(e) =>
                    handleTranslationChange(lang, e.target.value)
                  }
                  required={lang === "en"}
                  error={lang === "en" && error !== null && !translations["en"]}
                  helperText={
                    lang === "en"
                      ? t(
                        "classification.keyHelper",
                        "Used as system key (letters, numbers, spaces, and hyphens only)"
                      )
                      : t(
                        "classification.translationHelper",
                        "Translation for this language"
                      )
                  }
                  disabled={loading}
                  autoFocus={lang === "en"}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !translations["en"]}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading
            ? t("common.submitting", "Submitting...")
            : t("common.submit", "Submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  open,
  item,
  onClose,
  onClassificationUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const [classifications, setClassifications] = useState<string[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);
  const [availableOptions, setAvailableOptions] = useState<string[][]>([]);

  // New Category State
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryParentPath, setNewCategoryParentPath] = useState("");

  const {
    data: configData,
    loading: configLoading,
    refetch: refetchConfig,
  } = useQuery<{
    itemConfig: {
      defaultCategoryTrees: string[];
      categoryMaps: CategoryMap[][];
    };
  }>(GET_ITEM_CONFIG);

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

  // Parse category trees into hierarchical structure
  const parseCategoryTrees = (): CategoryTreeNode[] => {
    if (!configData?.itemConfig?.defaultCategoryTrees) return [];

    const trees: CategoryTreeNode[] = [];
    const treeMap = new Map<string, CategoryTreeNode>();

    configData.itemConfig.defaultCategoryTrees.forEach((treePath) => {
      const parts = treePath.split("/");
      let currentPath = "";

      parts.forEach((part, level) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!treeMap.has(currentPath)) {
          const node: CategoryTreeNode = {
            path: currentPath,
            level,
            value: part,
            children: [],
          };
          treeMap.set(currentPath, node);
          trees.push(node);

          // Add to parent's children
          if (parentPath && treeMap.has(parentPath)) {
            const parent = treeMap.get(parentPath)!;
            if (!parent.children.includes(part)) {
              parent.children.push(part);
            }
          }
        }
      });
    });

    return trees;
  };

  // Translate category using categoryMaps
  const translateCategory = (category: string): string => {
    if (!configData?.itemConfig?.categoryMaps) return category;

    const currentLang = i18n.language;

    for (const mapGroup of configData.itemConfig.categoryMaps) {
      const enMap = mapGroup.find((m) => m.language === "en");
      if (enMap?.value === category) {
        const translatedMap = mapGroup.find((m) => m.language === currentLang);
        return translatedMap?.value || category;
      }
    }

    return category;
  };

  // Get root level categories (level 0)
  const getRootCategories = (): string[] => {
    const trees = parseCategoryTrees();
    const roots = trees.filter((node) => node.level === 0);
    return [...new Set(roots.map((node) => node.value))];
  };

  // Get children for a given path
  const getChildrenForPath = (path: string): string[] => {
    const trees = parseCategoryTrees();
    const children = trees
      .filter((node) => {
        const nodeParts = node.path.split("/");
        const pathParts = path.split("/");
        return (
          nodeParts.length === pathParts.length + 1 &&
          node.path.startsWith(path + "/")
        );
      })
      .map((node) => node.value);

    return [...new Set(children)];
  };

  // Initialize available options when dialog opens
  useEffect(() => {
    if (open && item) {
      setClassifications(item.clssfctns || []);
      setCurrentSelection([]);
      setAvailableOptions([getRootCategories()]);
    }
  }, [open, item, configData]);

  // Handle selection change at any level
  const handleLevelChange = (level: number, value: string) => {
    const newSelection = [...currentSelection.slice(0, level), value];
    setCurrentSelection(newSelection);

    // Build path from selection
    const currentPath = newSelection.join("/");
    const children = getChildrenForPath(currentPath);

    // Update available options
    if (children.length > 0) {
      setAvailableOptions([...availableOptions.slice(0, level + 1), children]);
    } else {
      setAvailableOptions(availableOptions.slice(0, level + 1));
    }
  };

  // Add current selection to classifications
  const handleAddClassification = () => {
    if (currentSelection.length === 0) return;
    setClassifications(currentSelection);
    // Reset selection
    setCurrentSelection([]);
    setAvailableOptions([getRootCategories()]);
  };

  // Remove classification
  const handleRemoveClassification = (index: number) => {
    setClassifications(classifications.filter((_, i) => i !== index));
  };

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

  // New Category Handlers
  const handleOpenNewCategoryDialog = (level: number) => {
    // Determine parent path based on level
    // If level is 0, parent is empty (root)
    // If level is 1, parent is currentSelection[0]
    const parentPath = currentSelection.slice(0, level).join("/");
    setNewCategoryParentPath(parentPath);
    setShowNewCategoryDialog(true);
  };

  const handleNewCategorySuccess = async () => {
    // Refetch config to get new trees and maps
    await refetchConfig();

    // Re-calculate available options for the current level
    // We need to wait for refetch to complete, then update options
    // The useEffect dependency on configData will handle the root reset,
    // but we might want to preserve current selection state if possible.
    // For simplicity, the useEffect might reset, but let's try to maintain context.

    // Actually, since configData changes, the component re-renders.
    // We need to ensure the options update dynamically.

    // Let's manually trigger an update of the options for the current level
    const level = currentSelection.length; // The level we were at or next level
    // If we added a child to the current selection path
    const currentPath = currentSelection.join("/");

    // If we added to root (level 0)
    if (newCategoryParentPath === "") {
      // This will be handled by the useEffect or next render cycle if we call getRootCategories
    } else {
      // If we added to a specific path
      // We need to refresh the children of that path
    }
  };

  // Effect to refresh options when configData updates (after adding new category)
  useEffect(() => {
    if (configData && open) {
      // If we have a selection, refresh the children of the last selected item
      // to show the newly added category
      if (currentSelection.length > 0) {
        const currentPath = currentSelection.join("/");
        const children = getChildrenForPath(currentPath);
        if (children.length > 0) {
          // Update the next level options
          const level = currentSelection.length;
          const newOptions = [...availableOptions];
          // Ensure array is big enough
          if (newOptions.length <= level) {
            newOptions.push(children);
          } else {
            newOptions[level] = children;
          }
          setAvailableOptions(newOptions);
        }
      } else {
        // Refresh root options
        setAvailableOptions([getRootCategories()]);
      }
    }
  }, [configData]); // React to config changes

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
    <>
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
                <Chip label={t(`item.conditions.${item.condition}`, item.condition)} size="small" sx={{ mt: 0.5 }} />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("item.status", "Status")}
                </Typography>
                <Chip label={t(`item.statuses.${item.status}`, item.status)} size="small" sx={{ mt: 0.5 }} />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("item.language", "Language")}
                </Typography>
                <Chip label={t(`languages.${item.language}`, item.language)} size="small" sx={{ mt: 0.5 }} />
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
            <Typography variant="body2">
              {formatDate(item.updatedAt)}
            </Typography>
          </Paper>

          {/* Classification Assignment UI */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper" }}>
            <Typography variant="h6" gutterBottom>
              {t(
                "classification.assignClassifications",
                "Assign Classifications"
              )}
            </Typography>

            {configLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!configLoading && (
              <>
                {/* Current Classifications */}
                {classifications.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {t(
                        "classification.currentClassifications",
                        "Current Classifications"
                      )}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {classifications.map((cls, index) => {
                        const parts = cls.split("/");
                        const translatedParts = parts.map(translateCategory);
                        const displayText = translatedParts.join(" → ");

                        return (
                          <Chip
                            key={index}
                            label={displayText}
                            onDelete={() => handleRemoveClassification(index)}
                            color="primary"
                            sx={{ mb: 1 }}
                            deleteIcon={<DeleteIcon />}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Category Selection */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("classification.selectCategory", "Select Category Path")}
                  </Typography>

                  <Stack spacing={2}>
                    {availableOptions.map((options, level) => (
                      <Box
                        key={level}
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <FormControl fullWidth size="small">
                          <InputLabel>
                            {t("classification.level", "Level")} {level + 1}
                          </InputLabel>
                          <Select
                            value={currentSelection[level] || ""}
                            onChange={(e: SelectChangeEvent) =>
                              handleLevelChange(level, e.target.value)
                            }
                            label={`${t("classification.level", "Level")} ${level + 1
                              }`}
                          >
                            <MenuItem value="">
                              <em>{t("common.selectOption", "Select...")}</em>
                            </MenuItem>
                            {options.map((option) => (
                              <MenuItem key={option} value={option}>
                                {translateCategory(option)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Add New Category Button */}
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenNewCategoryDialog(level)}
                          title={t(
                            "classification.addNewCategory",
                            "Add new category at this level"
                          )}
                          sx={{ mt: 0.5 }}
                        >
                          <AddCategoryIcon />
                        </IconButton>
                      </Box>
                    ))}

                    {/* Add Sub-Category Button - Only show when user has selected a category at the last level and no children exist */}
                    {currentSelection.length > 0 &&
                      currentSelection.length === availableOptions.length && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<AddCategoryIcon />}
                            onClick={() =>
                              handleOpenNewCategoryDialog(
                                currentSelection.length
                              )
                            }
                            size="small"
                            color="secondary"
                          >
                            {t(
                              "classification.addSubCategory",
                              "Add Sub-Category Under Selected Path"
                            )}
                          </Button>
                        </Box>
                      )}
                  </Stack>

                  {/* Current Selection Preview */}
                  {currentSelection.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t(
                          "classification.currentSelection",
                          "Current Selection"
                        )}
                        :
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {currentSelection.map(translateCategory).join(" → ")}
                      </Typography>
                    </Box>
                  )}

                  {/* Add Button */}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddClassification}
                    disabled={currentSelection.length === 0}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {t(
                      "classification.addClassification",
                      "Add Classification"
                    )}
                  </Button>
                </Box>

                {classifications.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t(
                      "classification.noClassificationsYet",
                      "No classifications assigned yet. Select categories above and click 'Add Classification'."
                    )}
                  </Alert>
                )}
              </>
            )}
          </Paper>
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

      {/* New Category Dialog */}
      <NewCategoryDialog
        open={showNewCategoryDialog}
        onClose={() => setShowNewCategoryDialog(false)}
        parentPath={newCategoryParentPath}
        onSuccess={handleNewCategorySuccess}
      />
    </>
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
