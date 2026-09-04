import React, { useState, useEffect, useRef } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Button,
  Box,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Fab,
  Tooltip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Chat as ChatIcon } from "@mui/icons-material";
import {
  User,
  Item,
  RecommendationType,
  HostConfig,
  NewsStatus,
} from "../generated/graphql";
import RecentItemBanner from "../components/RecentItemBanner";
import { useOutletContext } from "react-router-dom";
import UpdateUser from "../components/UserProfile";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { sendVerificationEmail } from "../firebase";
import ItemForm from "../components/ItemForm";
import RecentNewsBanner from "../components/RecentNewsBanner";
import AddressReminderDialog from "../components/AddressReminderDialog";
import SearchBar from "../components/SearchBar";
import { PageLoader } from "../components/LoadingState";

const RecentCategoriesQuery = gql`
  query RecentCategories($limit: Int!) {
    recentUpdateCategories(limit: $limit)
  }
`;

const HotCategoriesQuery = gql`
  query HotCategories($limit: Int!) {
    hotCategories(limit: $limit)
  }
`;

const RecommendedItemsQuery = gql`
  query RecommendedItems($type: RecommendationType!, $limit: Int!) {
    recommendedItems(type: $type, limit: $limit) {
      id
      name
      category
      status
      images
      thumbnails
      condition
      location {
        latitude
        longitude
      }
      ownerId
    }
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
  hostConfig?: HostConfig;
  onSignOut: () => Promise<void>;
}

const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [showItemForm, setShowItemForm] = useState(false);
  const [recentBannerTab, setRecentBannerTab] = useState<"recent" | "new">(
    "recent",
  );
  const [hotCategorieTab, setHotCategorieTab] = useState<number>(0);
  const { user, emailVerified, email, hostConfig, onSignOut } =
    useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAddressReminder, setShowAddressReminder] = useState(false);
  const [showNewUserVillageDialog, setShowNewUserVillageDialog] =
    useState(false);

  const handleItemCreated = () => {
    setShowItemForm(false);
    recentCategoriesRefetch();
    hotCategoriesRefetch();
    userPickedRefetch();
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  // Query for USER_PICKED recommendations only
  const {
    data: userPickedData,
    loading: userPickedLoading,
    error: userPickedError,
    refetch: userPickedRefetch,
  } = useQuery<{
    recommendedItems: Item[];
  }>(RecommendedItemsQuery, {
    variables: {
      type: RecommendationType.UserPicked,
      limit: 5,
    },
    skip: !user?.isActive,
    errorPolicy: "all",
  });

  // Query for recent categories
  const {
    data: recentCategoriesData,
    loading: recentCategoriesLoading,
    refetch: recentCategoriesRefetch,
  } = useQuery<{
    recentUpdateCategories: string[];
  }>(RecentCategoriesQuery, {
    variables: { limit: 1 },
  });

  // Query for hot categories
  const {
    data: hotCategoriesData,
    loading: hotCategoriesLoading,
    refetch: hotCategoriesRefetch,
  } = useQuery<{
    hotCategories: string[];
  }>(HotCategoriesQuery, {
    variables: { limit: 3 },
  });

  const handleGoToProfile = () => {
    setShowAddressReminder(false);
    setShowCreateUser(true);
  };

  const handleUserCreated = () => {
    setShowCreateUser(false);
    window.location.reload();
  };

  const homeLoading = userPickedLoading || recentCategoriesLoading || hotCategoriesLoading;

  const handleViewAllItems = () => {
    navigate("/item/all");
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleChatClick = () => {
    if (hostConfig?.chatLink) {
      window.open(hostConfig.chatLink, "_blank", "noopener,noreferrer");
    }
  };

  const isProfileIncomplete = (() => {
    if (!user) return false;

    const normalizedNickname = user.nickname?.trim().toLowerCase() ?? "";
    const normalizedEmail = user.email?.trim().toLowerCase() ?? "";
    const normalizedAddress = user.address?.trim() ?? "";

    return (
      !normalizedNickname ||
      normalizedNickname === normalizedEmail ||
      !normalizedAddress
    );
  })();

  const [profileSetupChecklist, setProfileSetupChecklist] = useState({
    nickname: false,
    address: false,
  });

  useEffect(() => {
    if (!user) return;

    const nicknameValue = user.nickname?.trim() ?? "";
    const emailValue = user.email?.trim().toLowerCase() ?? "";
    const nicknameDone =
      Boolean(nicknameValue) && nicknameValue.toLowerCase() !== emailValue;
    const addressDone = Boolean(user.address?.trim());

    setProfileSetupChecklist({
      nickname: nicknameDone,
      address: addressDone,
    });
  }, [user?.nickname, user?.address, user?.email]);

  const handleProfileChecklistChange = (
    key: "nickname" | "address",
    checked: boolean,
  ) => {
    setProfileSetupChecklist((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  return (
    <>
      <List
        sx={{
          px: 2,
          pb: hostConfig?.chatLink ? 8 : 2,
        }}
      >
        {/* Welcome Section */}
        <ListItem>
          <Box sx={{ width: "100%" }}>
            {user?.isVerified ? (
              <Box>
                <Grid container alignItems="center">
                  <Grid size={{ xs: 12, md: 12 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        flexWrap: "wrap",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "var(--font-family-display)",
                          fontWeight: 900,
                          color: "var(--color-text-primary)",
                          cursor: "pointer",
                          letterSpacing: "-0.5px",
                          lineHeight: "1.1",
                          fontSize: { xs: "18px", sm: "24px", md: "28px" },
                        }}
                      >
                        {t("home.welcome", { nickname: user.nickname })}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowNewUserVillageDialog(true)}
                      >
                        {t("home.newUserVillage.button", "新手村")}
                      </Button>
                    </Box>
                    {isProfileIncomplete ? (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          backgroundColor: "var(--color-bg-canvas)",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 1,
                            fontWeight: 700,
                          }}
                        >
                          {t("home.profileSetupTitle", "Complete your profile")}
                        </Typography>
                        <Typography
                          component="button"
                          type="button"
                          onClick={handleGoToProfile}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleGoToProfile();
                            }
                          }}
                          sx={{
                            color: "var(--color-text-tertiary)",
                            fontFamily: "var(--font-family-body)",
                            fontSize: "13px",
                            mb: 2,
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px",
                            "&:hover": {
                              color: "var(--color-text-primary)",
                            },
                          }}
                        >
                          {t(
                            "home.profileSetupDescription",
                            "Click the Profile button in the navigation bar, edit your profile, and fill in a nickname and your address before continuing.",
                          )}
                        </Typography>
                        <Box sx={{ display: "grid", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                disabled={true}
                                checked={profileSetupChecklist.nickname}
                                onChange={(event) =>
                                  handleProfileChecklistChange(
                                    "nickname",
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label={t(
                              "home.profileSetupNickname",
                              "Set a nickname that is not the same as my email",
                            )}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                disabled={true}
                                checked={profileSetupChecklist.address}
                                onChange={(event) =>
                                  handleProfileChecklistChange(
                                    "address",
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label={t(
                              "home.profileSetupAddress",
                              "Add my address in the profile settings",
                            )}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          color: "var(--color-text-tertiary)",
                          fontFamily: "var(--font-family-body)",
                          fontSize: "13px",
                        }}
                      >
                        {t(
                          "app.description",
                          "Greetings from the Library! We are Librarians, and we are here to help you discover your next great read. Whether you're searching for resources, reliable information, or something entirely unexpected, we're here to guide you every step of the way. Explore our collection today and find your new favorites!",
                        )}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                {!user.isActive && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "home.accountPending",
                      "Your account is pending activation.",
                    )}
                  </Alert>
                )}
              </Box>
            ) : (
              email && (
                <Box>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {t("home.welcome")} {email}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {!emailVerified && (
                      <>
                        <Button
                          variant="outlined"
                          onClick={async () => {
                            await sendVerificationEmail();
                            alert(
                              `${t("auth.verificationEmailSent")} ${t(
                                "auth.verificationSupportHint",
                                "If you don't receive the verification email, please check your spam or junk mailbox. If you still need help, click the chat button in the bottom-right corner to contact the user group for support.",
                              )}`,
                            );
                          }}
                          size="large"
                        >
                          {t(
                            "auth.resendVerification",
                            "Resend Verification Email",
                          )}
                        </Button>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5, maxWidth: 440 }}
                        >
                          {t(
                            "auth.verificationSupportHint",
                            "If you don't receive the verification email, please check your spam or junk mailbox. If you still need help, click the chat button in the bottom-right corner to contact the user group for support.",
                          )}
                        </Typography>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleSignOut}
                      size="large"
                    >
                      {t("auth.signOut")}
                    </Button>
                  </Box>
                </Box>
              )
            )}
          </Box>
        </ListItem>

        <RecentNewsBanner
          newsStatus={NewsStatus.Published}
          isFrontPage={true}
        />

        {homeLoading && (
          <ListItem>
            <Box sx={{ width: "100%" }}>
              <PageLoader
                message={t("common.loading", "Loading...")}
                size={36}
                minHeight={160}
              />
            </Box>
          </ListItem>
        )}

        {userPickedError && (
          <ListItem>
            <Alert severity="warning" sx={{ width: "100%" }}>
              {t("home.recommendationsError", "Unable to load recommendations")}
              <Typography variant="caption" display="block">
                {userPickedError.message}
              </Typography>
            </Alert>
          </ListItem>
        )}
        <ListItem>
          <Box sx={{ width: "100%" }}>
            <Tabs
              value={recentBannerTab}
              onChange={(_, value: "recent" | "new") =>
                setRecentBannerTab(value)
              }
              aria-label="recent and new arrivals tabs"
              sx={{ mb: 1 }}
            >
              <Tab value="new" label={t("home.newArrivals", "New Arrivals")} />
              <Tab
                value="recent"
                label={t("item.recent.updatedItems", "Recent Updates")}
              />
              {userPickedData?.recommendedItems &&
                userPickedData.recommendedItems.length > 0 && (
                  <Tab
                    value="userPicked"
                    label={t("home.userPickedItems", "Recommended for You")}
                  />
                )}
            </Tabs>

            {recentBannerTab === "new" ? (
              <RecentItemBanner
                recommendationType={RecommendationType.NewArrivals}
                category=""
              />
            ) : recentBannerTab === "recent" ? (
              <RecentItemBanner category="" />
            ) : (
              userPickedData?.recommendedItems &&
              userPickedData.recommendedItems.length > 0 && (
                <RecentItemBanner
                  recommendationType={RecommendationType.UserPicked}
                  recommendedItems={userPickedData.recommendedItems}
                  titleOverride={""}
                  descriptionOverride={t(
                    "home.userPickedDescription",
                    "Based on your interests and activity",
                  )}
                />
              )
            )}
          </Box>
        </ListItem>

        {/* Hot Categories Section */}
        {hotCategoriesData?.hotCategories && (
          <ListItem>
            <Box sx={{ width: "100%" }}>
              <Tabs
                value={hotCategorieTab}
                onChange={(_, value: number) => setHotCategorieTab(value)}
                aria-label="recent and new arrivals tabs"
                sx={{ mb: 1 }}
              >
                {hotCategoriesData.hotCategories.map((category, index) => (
                  <Tab
                    value={index}
                    label={category}
                    key={`hot-category-tab-${index}`}
                  />
                ))}
              </Tabs>
              <ListItem key={`hot-category-${hotCategorieTab}`}>
                <RecentItemBanner
                  category={hotCategoriesData.hotCategories[hotCategorieTab]}
                />
              </ListItem>
            </Box>
          </ListItem>
        )}

        {showCreateUser && (
          <UpdateUser
            email={email}
            onUserCreated={handleUserCreated}
            open={showCreateUser}
            isCreateUser={false}
            onClose={() => setShowCreateUser(false)}
            initialNickname={user?.nickname}
            initialAddress={user?.address}
            initialExchangePoints={user?.exchangePoints}
            initialContactMethods={user?.contactMethods}
            initialVisibleContentRating={(user as any)?.visibleContentRating}
          />
        )}

        {showAddressReminder && (
          <AddressReminderDialog
            open={showAddressReminder}
            onClose={() => setShowAddressReminder(false)}
            onGoToProfile={handleGoToProfile}
          />
        )}

        {showItemForm && user && (
          <ItemForm
            open={showItemForm}
            user={user}
            onClose={() => setShowItemForm(false)}
            onItemCreated={handleItemCreated}
          />
        )}
      </List>

      <Dialog
        open={showNewUserVillageDialog}
        onClose={() => setShowNewUserVillageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("home.newUserVillage.button", "新手村")}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t(
                  "home.newUserVillage.step1Title",
                  "A0仔：X，見到本書想睇，但在 Ba打 手上",
                )}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {t(
                  "home.newUserVillage.step1Body",
                  "A0仔 見到本書：「呢本正喎，但係而家有人借緊。」\n\n唔使嬲，直接撳 申請借閱。\n\n然後 Ba打 同 A0仔 都會收到 BookGuide Email：\n「喂，有人想接你本書喎。」\n之後兩邊自己傾點交收就得——約邊度、幾時拎，自己搞掂。",
                )}
              </Typography>
            </Box>
            {/* Request to Borrow image */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {i18n.language.toLowerCase().startsWith("en")
                  ? t("home.newUserVillage.requestTitleEn", "Request to Borrow")
                  : t("home.newUserVillage.requestTitleZHTW", "申請借閱")}
              </Typography>
              <img
                src={`/images/request_${i18n.language.toLowerCase().startsWith("en") ? "en" : "zh"}.png`}
                alt={
                  i18n.language.toLowerCase().startsWith("en")
                    ? "Request to Borrow icon"
                    : "申請借閱圖示"
                }
                style={{
                  maxWidth: "100%",
                  maxHeight: 250,
                  borderRadius: 1,
                }}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("home.newUserVillage.step2Title", "Ba打 → A0仔：面交交書")}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {t(
                  "home.newUserVillage.step2Body",
                  "終於約到時間。\n\nBa打 見到 A0仔，交低本書。\n\nBa打 撳 面對面交收。\n\nA0仔：\n「掃 QR code。」\n掃完之後，再影一張相記錄 交收當刻本書嘅狀況。\n\n咁就完成交接，冇得之後拗：\n「你整花本書㗎喎 😡」\n「吓？我拎到嗰陣已經係咁啦喎。」\n有相為證，大家開心晒。",
                )}
              </Typography>
            </Box>
            {/* QR Code images - based on current locale */}
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 3,
                }}
              >
                {/* QR Code image */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {i18n.language.toLowerCase().startsWith("en")
                      ? t(
                          "home.newUserVillage.qrTitleEn",
                          "Scan to use full App",
                        )
                      : t(
                          "home.newUserVillage.qrTitleZHTW",
                          "掃描使用完整 App",
                        )}
                  </Typography>
                  <img
                    src={`/images/qr_${i18n.language.toLowerCase().startsWith("en") ? "en" : "zh"}.png`}
                    alt={
                      i18n.language.toLowerCase().startsWith("en")
                        ? "Hong Kong Decentralized Archive QR Code"
                        : "無大台香港典藏館 QR 碼"
                    }
                    style={{
                      maxWidth: "100%",
                      maxHeight: 250,
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("home.newUserVillage.step3Title", "C姐：X，原來我都想睇")}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {t(
                  "home.newUserVillage.step3Body",
                  "C姐 之後見到：\n\n「喎屌，呢本我都想睇。」\n可以再 申請借閱。\n\n等 A0仔 睇完之後，A0仔 可以直接聯絡 C姐：\n「我睇完喇，你要唔要？」\n兩個人再約時間交換。\n\n於是本書就繼續流轉：\n\nBa打 → A0仔 → C姐 → D露霧 → ……\n\n一本書唔使困死喺一個人手上，睇完就俾下一個巴絲。",
                )}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewUserVillageDialog(false)}>
            {t("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Chat Button */}
      {hostConfig?.chatLink && (
        <Tooltip
          title={t("home.joinCommunityChat", "Join Community Chat")}
          placement="left"
        >
          <Fab
            color="primary"
            aria-label="chat"
            onClick={handleChatClick}
            sx={{
              position: "fixed",
              bottom: 80, // Increased from 64 to 80 to avoid overlap with bottom navigation bar
              right: 16,
              zIndex: 1000,
            }}
          >
            <ChatIcon />
          </Fab>
        </Tooltip>
      )}
    </>
  );
};

export default HomePage;
