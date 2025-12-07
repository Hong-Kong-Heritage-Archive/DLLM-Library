import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlaylistAdd as AddCategoryIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { CategoryMap } from "../generated/graphql";
import { translateCategory } from "../utils/categoryTranslation";

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

interface CategoryTreeNode {
  path: string;
  level: number;
  value: string;
  children: string[];
}

interface ClassificationEditorProps {
  classifications: string[];
  onChange: (classifications: string[]) => void;
  showAddCategoryButton?: boolean;
}

export const ClassificationEditor: React.FC<ClassificationEditorProps> = ({
  classifications,
  onChange,
  showAddCategoryButton = false,
}) => {
  const { t, i18n } = useTranslation();
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);
  const [availableOptions, setAvailableOptions] = useState<string[][]>([]);

  // New Category Dialog State
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryParentPath, setNewCategoryParentPath] = useState("");
  const [translations, setTranslations] = useState<{ [key: string]: string }>(
    {}
  );
  const [dialogError, setDialogError] = useState<string | null>(null);

  const languages = ["en", "zh-TW", "zh-HK"];

  const {
    data: configData,
    loading: configLoading,
    refetch: refetchConfig,
  } = useQuery<{
    itemConfig: {
      defaultCategoryTrees: string[];
      categoryMaps: CategoryMap[][];
    };
  }>(GET_ITEM_CONFIG, { fetchPolicy: "cache-first" });

  const [upsertCategoryMap, { loading: upsertLoading }] =
    useMutation(UPSERT_CATEGORY_MAP);
  const [addCategoryTree, { loading: addTreeLoading }] =
    useMutation(ADD_CATEGORY_TREE);

  const dialogSubmitLoading = upsertLoading || addTreeLoading;

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

  // Initialize available options
  useEffect(() => {
    if (configData) {
      setCurrentSelection([]);
      setAvailableOptions([getRootCategories()]);
    }
  }, [configData]);

  // Effect to refresh options when configData updates
  useEffect(() => {
    if (configData) {
      if (currentSelection.length > 0) {
        const currentPath = currentSelection.join("/");
        const children = getChildrenForPath(currentPath);
        if (children.length > 0) {
          const level = currentSelection.length;
          const newOptions = [...availableOptions];
          if (newOptions.length <= level) {
            newOptions.push(children);
          } else {
            newOptions[level] = children;
          }
          setAvailableOptions(newOptions);
        }
      } else {
        setAvailableOptions([getRootCategories()]);
      }
    }
  }, [configData]);

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

    const newClassificationPath = currentSelection.join("/");

    // Avoid duplicates
    if (!classifications.includes(newClassificationPath)) {
      onChange([...classifications, newClassificationPath]);
    }

    // Reset selection
    setCurrentSelection([]);
    setAvailableOptions([getRootCategories()]);
  };

  // Remove classification
  const handleRemoveClassification = (index: number) => {
    onChange(classifications.filter((_, i) => i !== index));
  };

  // Handle opening new category dialog
  const handleOpenNewCategoryDialog = (level: number) => {
    const parentPath = currentSelection.slice(0, level).join("/");
    setNewCategoryParentPath(parentPath);
    setTranslations({});
    setDialogError(null);
    setShowNewCategoryDialog(true);
  };

  // Handle closing new category dialog
  const handleCloseNewCategoryDialog = () => {
    if (!dialogSubmitLoading) {
      setShowNewCategoryDialog(false);
      setTranslations({});
      setDialogError(null);
      setNewCategoryParentPath("");
    }
  };

  // Handle translation change in dialog
  const handleTranslationChange = (lang: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [lang]: value }));
    setDialogError(null);
  };

  // Handle new category submission
  const handleSubmitNewCategory = async () => {
    // Validate English is present (used as key)
    if (!translations["en"]) {
      setDialogError(
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
      setDialogError(
        t(
          "classification.invalidEnglishFormat",
          "English name can only contain letters, numbers, spaces, and hyphens"
        )
      );
      return;
    }

    try {
      const categoryKey = englishValue;

      // 1. Prepare Category Map Input (excluding English since it's passed separately)
      const categoryMapInput = Object.entries(translations)
        .filter(([lang]) => lang !== "en")
        .map(([lang, value]) => ({
          language: lang,
          value: value.trim(),
        }));

      // 2. Call Upsert Category Map
      await upsertCategoryMap({
        variables: {
          en: categoryKey,
          categoryMaps: categoryMapInput,
        },
      });

      // 3. Call Add Category Tree
      await addCategoryTree({
        variables: {
          parentPath: newCategoryParentPath || null,
          leafCategory: categoryKey,
        },
      });

      // 4. Refetch config to get updated trees
      await refetchConfig();

      // 5. Close dialog
      handleCloseNewCategoryDialog();
    } catch (err: any) {
      console.error("Error creating category:", err);
      setDialogError(
        err.message || t("common.error", "Error creating category")
      );
    }
  };

  if (configLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <>
      <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper" }}>
        <Typography variant="subtitle1" gutterBottom>
          {t("classification.assignClassifications", "Assign Classifications")}
        </Typography>

        {/* Current Classifications */}
        {classifications.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t(
                "classification.currentClassifications",
                "Current Classifications"
              )}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {classifications.map((cls, index) => {
                const parts = cls.split("/");
                const translatedParts = parts.map((part) =>
                  translateCategory(
                    part,
                    configData?.itemConfig?.categoryMaps,
                    i18n.language
                  )
                );
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
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                    label={`${t("classification.level", "Level")} ${level + 1}`}
                  >
                    <MenuItem value="">
                      <em>{t("common.selectOption", "Select...")}</em>
                    </MenuItem>
                    {options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {translateCategory(
                          option,
                          configData?.itemConfig?.categoryMaps,
                          i18n.language
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Add New Category Button */}
                {showAddCategoryButton && (
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
                )}
              </Box>
            ))}

            {/* Add Sub-Category Button */}
            {showAddCategoryButton &&
              currentSelection.length > 0 &&
              currentSelection.length === availableOptions.length && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddCategoryIcon />}
                    onClick={() =>
                      handleOpenNewCategoryDialog(currentSelection.length)
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
                {t("classification.currentSelection", "Current Selection")}:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {currentSelection
                  .map((cat) =>
                    translateCategory(
                      cat,
                      configData?.itemConfig?.categoryMaps,
                      i18n.language
                    )
                  )
                  .join(" → ")}
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
            {t("classification.addClassification", "Add Classification")}
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
      </Paper>

      {/* New Category Dialog */}
      <Dialog
        open={showNewCategoryDialog}
        onClose={handleCloseNewCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("classification.addNewCategory", "Add New Category")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {newCategoryParentPath
                ? t("classification.addingUnder", "Adding under: {{path}}", {
                    path: newCategoryParentPath,
                  })
                : t("classification.addingRoot", "Adding as root category")}
            </Typography>

            {dialogError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {dialogError}
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
                    error={
                      lang === "en" &&
                      dialogError !== null &&
                      !translations["en"]
                    }
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
                    disabled={dialogSubmitLoading}
                    autoFocus={lang === "en"}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseNewCategoryDialog}
            disabled={dialogSubmitLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleSubmitNewCategory}
            variant="contained"
            disabled={dialogSubmitLoading || !translations["en"]}
            startIcon={
              dialogSubmitLoading ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {dialogSubmitLoading
              ? t("common.submitting", "Submitting...")
              : t("common.submit", "Submit")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClassificationEditor;
