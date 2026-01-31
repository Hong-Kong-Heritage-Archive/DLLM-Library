import React, { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User, HostConfig, CreateNewsPostMutation } from "../generated/graphql";
import TransactionFlowDiagrams from "../components/TransactionFlowDiagrams";
import RecentNewsBanner from "../components/RecentNewsBanner";

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
  hostConfig?: HostConfig;
}

const GET_HOST_CONFIG = gql`
  query GetHostConfig {
    hostConfig {
      chatLink
      aboutUsText
      splashScreenImageUrl
      splashScreenText
    }
  }
`;

const UPDATE_HOST_CONFIG = gql`
  mutation UpdateHostConfig($input: HostConfigInput!) {
    updateHostConfig(input: $input) {
      chatLink
      aboutUsText
      splashScreenImageUrl
      splashScreenText
    }
  }
`;

const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext<OutletContext>();

  const [isEditing, setIsEditing] = useState(false);
  const [chatLink, setChatLink] = useState("");
  const [aboutUsText, setAboutUsText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Query host config
  const { data, loading, error, refetch } = useQuery(GET_HOST_CONFIG, {
    onCompleted: (data) => {
      if (data?.hostConfig) {
        setChatLink(data.hostConfig.chatLink || "");
        setAboutUsText(data.hostConfig.aboutUsText || "");
      }
    },
  });

  // Update mutation
  const [updateHostConfig, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_HOST_CONFIG, {
      onCompleted: () => {
        setIsEditing(false);
        setHasChanges(false);
        setShowSuccess(true);
        refetch();
      },
    });

  const handleChatLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatLink(e.target.value);
    setHasChanges(true);
  };

  const handleAboutUsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutUsText(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateHostConfig({
      variables: {
        input: {
          chatLink: chatLink.trim(),
          aboutUsText: aboutUsText.trim(),
        },
      },
    });
  };

  const handleCancel = () => {
    // Reset to original values
    if (data?.hostConfig) {
      setChatLink(data.hostConfig.chatLink || "");
      setAboutUsText(data.hostConfig.aboutUsText || "");
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {t("news.errorLoading", "Error loading configuration")}:{" "}
          {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <RecentNewsBanner user={user} />
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          {t("news.aboutUs", "About Us")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin
            ? t(
                "news.adminDescription",
                "Manage community information and chat links"
              )
            : t(
                "news.userDescription",
                "Learn more about our community library"
              )}
        </Typography>
      </Box>

      {/* Admin Edit Controls */}
      {isAdmin && !isEditing && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "flex-end",
            position: "sticky",
            top: 70,
            zIndex: 10,
            backgroundColor: "background.default",
            py: 2,
            borderRadius: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: 3,
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            {t("common.edit", "Edit")}
          </Button>
        </Box>
      )}

      {/* Update Error */}
      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("news.errorUpdating", "Error updating configuration")}:{" "}
          {updateError.message}
        </Alert>
      )}

      {/* Save Success Indicator */}
      {showSuccess && (
        <Alert
          severity="success"
          sx={{ mt: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          {t("news.changesSaved", "All changes saved successfully")}
        </Alert>
      )}

      {/* Chat Link Section - Visible to all users */}
      {(chatLink || isAdmin) && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: 2,
            border: "2px solid",
            borderColor: "secondary.main",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {t("news.communityChat", "Community Chat")}
            </Typography>

            {isEditing && isAdmin ? (
              <TextField
                fullWidth
                label={t("news.chatLink", "Chat Link")}
                placeholder={t(
                  "news.chatLinkPlaceholder",
                  "e.g., https://t.me/your-group"
                )}
                value={chatLink}
                onChange={handleChatLinkChange}
                helperText={t(
                  "news.chatLinkHelper",
                  "Enter the link to your community chat (Telegram, Discord, etc.)"
                )}
                disabled={updateLoading}
              />
            ) : (
              <Box>
                {chatLink ? (
                  <Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.6,
                      }}
                    >
                      {t(
                        "news.joinOurChat",
                        "Join our community chat to connect with other members, share ideas, and stay updated!"
                      )}
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      href={chatLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="large"
                      startIcon={<ChatIcon />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        fontSize: "1rem",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: 2,
                        "&:hover": {
                          boxShadow: 4,
                        },
                      }}
                    >
                      {t("news.joinChat", "Join Community Chat")}
                    </Button>
                  </Box>
                ) : isAdmin ? (
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "news.noChatLink",
                      "No community chat link configured yet."
                    )}
                  </Typography>
                ) : null}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* About Us Section */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            {t("news.aboutUs", "About Us")}
          </Typography>

          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={10}
              label={t("news.aboutUsText", "About Us Text")}
              placeholder={t(
                "news.aboutUsPlaceholder",
                "Tell your community about your library, mission, and values..."
              )}
              value={aboutUsText}
              onChange={handleAboutUsChange}
              helperText={t(
                "news.aboutUsHelper",
                "Describe your community library, its purpose, and how it works"
              )}
              disabled={updateLoading}
            />
          ) : (
            <Box>
              {aboutUsText ? (
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                  }}
                >
                  {aboutUsText}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "news.noAboutUsText",
                    "No information available yet. Please check back later."
                  )}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transaction Flow Diagrams Section - Add after About Us */}
      {!isEditing && (
        <Box sx={{ mt: 4 }}>
          <TransactionFlowDiagrams />
        </Box>
      )}

      {/* Edit Action Buttons */}
      {isEditing && (
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={
              updateLoading ? <CircularProgress size={20} /> : <SaveIcon />
            }
            onClick={handleSave}
            disabled={updateLoading || !hasChanges}
          >
            {updateLoading
              ? t("common.saving", "Saving...")
              : t("common.save", "Save Changes")}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={updateLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default NewsPage;
