import React, { useState } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Home as HomeIcon,
  Newspaper as NewsIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Article as ArticleIcon,
  SwapHoriz as LoanIcon,
  Label as ClassificationIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, gql } from "@apollo/client";
import { User, Role, HostConfig } from "../generated/graphql";
import { AuthDialog } from "./Auth";
import LanguageSwitcher from "./LanguageSwitcher";
import NewsForm from "./NewsForm";
import ClassificationAssignment from "./ClassificationAssignment";
import ContentRatingApprovalDialog from "./ContentRatingApprovalDialog";
import OnboardingTour from "./OnboardingTour";
import SignupOnboardingDialog from "./SignupOnboardingDialog";
import { hasPendingSignupOnboarding } from "../utils/signupOnboarding";
import { resolveBranding } from "../utils/branding";

const headerActionButtonSx = {
  bgcolor: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  width: "var(--space-3xl)",
  height: "var(--space-3xl)",
  "&:hover": { bgcolor: "var(--color-bg-subtle)" },
};

const navPillSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "var(--space-xl)",
  borderRadius: "var(--space-md)",
};

const GET_USER_OPEN_TRANSACTIONS_FOR_COUNT = gql`
  query GetUserOpenTransactionsForCount($userId: ID!) {
    openTransactionsByUser(userId: $userId) {
      id
      status
      createdAt
      item {
        id
        name
      }
    }
  }
`;

const BUILD_ITEM_INDEX = gql`
  mutation BuildItemIndex($forceRebuild: Boolean!) {
    buildItemIndex(forceRebuild: $forceRebuild)
  }
`;

interface MainLayoutProps {
  email?: string | null;
  emailVerified?: boolean | null;
  user?: User;
  hostConfig?: HostConfig;
  onSignOut?: () => Promise<void>;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  email,
  emailVerified,
  user,
  hostConfig,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const appTitle =
    resolveBranding(window.__DLLM_CLIENT_CONFIG__).appTitle ||
    t("app.title", "DLLM Library");

  // State management
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signupOnboardingOpen, setSignupOnboardingOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showClassificationAssignment, setShowClassificationAssignment] =
    useState(false);
  const [showContentRatingApproval, setShowContentRatingApproval] =
    useState(false);

  // Query for user's open transactions
  const { data: transactionsData } = useQuery(
    GET_USER_OPEN_TRANSACTIONS_FOR_COUNT,
    {
      variables: { userId: user?.id! },
      skip: !user?.id,
      pollInterval: 30000, // Poll every 30 seconds
    },
  );

  const [buildItemIndexMutation] = useMutation(BUILD_ITEM_INDEX);

  const notificationCount =
    transactionsData?.openTransactionsByUser?.length || 0;

  // Determine active bottom nav tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return 0;
    if (path.startsWith("/item/all")) return 1;
    if (path.startsWith("/news")) return 2;
    //if (path.startsWith("/exchange-points")) return 2;
    if (path.startsWith("/loan-items")) return 3;
    if (path.startsWith("/profile") || path.startsWith("/user/")) return 4;
    return 0; // Default to home
  };

  const [bottomNavValue, setBottomNavValue] = useState(getActiveTab());

  // Update bottom nav when route changes
  React.useEffect(() => {
    setBottomNavValue(getActiveTab());
  }, [location.pathname]);

  // Handlers
  const handleBottomNavigation = (
    _: React.SyntheticEvent,
    newValue: number,
  ) => {
    setBottomNavValue(newValue);

    switch (newValue) {
      case 0:
        navigate("/");
        break;
      case 1:
        //navigate("/news");
        navigate("/item/all");
        break;
      case 2:
        //navigate("/exchange-points");
        navigate("/news");
        break;
      case 3:
        if (user) {
          navigate("/loan-items?tab=borrowed");
        } else {
          setAuthDialogOpen(true);
        }
        break;
      case 4:
        if (user) {
          navigate("/profile");
        } else {
          setAuthDialogOpen(true);
        }
        break;
    }
  };

  React.useEffect(() => {
    if (user && hasPendingSignupOnboarding()) {
      setSignupOnboardingOpen(true);
    }
  }, [user]);

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    setTimeout(() => {
      navigate("/profile");
    }, 500);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddNews = () => {
    setShowNewsForm(true);
    handleMenuClose();
  };

  const handleClassificationAssignment = () => {
    setShowClassificationAssignment(true);
    handleMenuClose();
  };

  const handleContentRatingApproval = () => {
    setShowContentRatingApproval(true);
    handleMenuClose();
  };

  const handleNotificationsClick = () => {
    navigate("/transactions");
  };

  const handleNewsCreated = () => {
    setShowNewsForm(false);
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  };

  const renderNavIcon = (icon: React.ReactNode, isActive: boolean) => (
    <Box
      sx={{
        ...navPillSx,
        backgroundColor: isActive
          ? "var(--color-bg-subtle)"
          : "transparent",
        color: isActive ? "var(--color-brand-primary)" : "inherit",
      }}
    >
      {icon}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "var(--color-bg-canvas)",
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: "var(--color-bg-canvas)",
          borderBottom: "none",
          pt: "var(--space-xs)",
          px: "var(--space-xs)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-element-gap-sm)",
            py: "var(--space-xs)",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
            onClick={() => navigate("/")}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: "var(--font-family-display)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                letterSpacing: "-0.5px",
                lineHeight: "var(--line-height-tight)",
                fontSize: { xs: "var(--font-size-title-lg)", sm: "24px", md: "28px" },
              }}
            >
              {t("app.brand-title", "BookGuide")}
              <Box
                component="span"
                sx={{
                  color: "var(--color-brand-primary)",
                  fontSize: { xs: "var(--font-size-body-sm)", sm: "var(--font-size-title)", md: "20px" },
                  fontWeight: "var(--font-weight-bold)",
                  ml: "var(--space-xs)",
                }}
              >
                {t("app.location", "Sydney, Australia")}
              </Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-family-mono)",
                color: "var(--color-text-tertiary)",
                fontSize: { xs: "var(--font-size-micro-system)", sm: "var(--font-size-caption)" },
                mt: "var(--space-xs)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t("app.icon-slogan", "Hong Kong books. Keep them moving.")}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              flexShrink: 0,
            }}
          >
            <LanguageSwitcher color="var(--color-text-primary)" />

            {/* Notification Bell - only show for authenticated users */}
            {user ? (
              <IconButton
                onClick={handleNotificationsClick}
                sx={headerActionButtonSx}
                title={t("transactions.viewTransactions", "View Transactions")}
              >
                <Badge
                  variant="dot"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "var(--color-brand-primary)",
                      width: "var(--space-sm)",
                      height: "var(--space-sm)",
                      borderRadius: "50%",
                      right: "var(--space-xs)",
                      top: "var(--space-xs)",
                    },
                  }}
                  invisible={notificationCount === 0}
                >
                  <NotificationsIcon sx={{ fontSize: "var(--font-size-title)" }} />
                </Badge>
              </IconButton>
            ) : (
              <IconButton
                onClick={() => setAuthDialogOpen(true)}
                sx={headerActionButtonSx}
                title={t("auth.signIn", "Sign In")}
              >
                <PersonIcon sx={{ fontSize: "var(--font-size-title)" }} />
              </IconButton>
            )}

            {/* Menu Button - only show for Admin users */}
            {user && user?.role === Role.Admin && (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMenuClick}
                  title={t("common.menu", "Menu")}
                  sx={{ color: "var(--color-text-primary)" }}
                >
                  <MenuIcon />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem onClick={handleAddNews}>
                    <ListItemIcon>
                      <ArticleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t("news.create", "Add News")}</ListItemText>
                  </MenuItem>

                  <MenuItem onClick={handleClassificationAssignment}>
                    <ListItemIcon>
                      <ClassificationIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t(
                        "classification.assignClassifications",
                        "Assign Classifications",
                      )}
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={handleContentRatingApproval}>
                    <ListItemIcon>
                      <ClassificationIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t(
                        "contentRating.approvalDialog",
                        "Content Rating Approval",
                      )}
                    </ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      await buildItemIndexMutation({
                        variables: { forceRebuild: true },
                      });
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <ClassificationIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("item.rebuildIndex", "Rebuild Item Index")}
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: "72px", // Space for bottom navigation
          overflow: "auto",
        }}
      >
        <Outlet
          context={{ email, emailVerified, user, hostConfig, onSignOut }}
        />
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          boxShadow: "0 -2px 10px var(--color-border-strong)",
          borderTop: "1px solid var(--color-border-soft)",
        }}
        elevation={0}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavigation}
          showLabels
          sx={{
            height: "72px",
            backgroundColor: "var(--color-bg-surface)",
            "& .MuiBottomNavigationAction-root": {
              minWidth: "auto",
              padding: "var(--space-sm) 0",
              color: "var(--color-text-tertiary)",
              transition: "all 0.2s ease-in-out",
              "& .MuiSvgIcon-root": {
                fontSize: "var(--font-size-display)",
                transition: "all 0.2s ease-in-out",
              },
              "& .MuiBottomNavigationAction-label": {
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-label)",
                fontWeight: "var(--font-weight-bold)",
                mt: "var(--space-xs)",
                "&.Mui-selected": {
                  fontSize: "var(--font-size-label)",
                  color: "var(--color-brand-primary)",
                },
              },
              "&.Mui-selected": {
                color: "var(--color-brand-primary)",
                "& .MuiSvgIcon-root": {
                  color: "var(--color-brand-primary)",
                },
              },
            },
          }}
        >
          <BottomNavigationAction
            label={t("tabs.home", "Home")}
            icon={renderNavIcon(<HomeIcon />, bottomNavValue === 0)}
          />
          <BottomNavigationAction
            label={t("tabs.item-nav", "Search")}
            icon={renderNavIcon(<SearchIcon />, bottomNavValue === 1)}
            data-tour="item-nav"
          />
          <BottomNavigationAction
            label={t("tabs.news-nav", "News")}
            icon={renderNavIcon(<NewsIcon />, bottomNavValue === 2)}
            data-tour="news-nav"
          />
          {user && (
            <BottomNavigationAction
              label={t("tabs.items-nav", "Holdings")}
              icon={renderNavIcon(<LoanIcon />, bottomNavValue === 3)}
            />
          )}
          <BottomNavigationAction
            label={t("tabs.profile", "Profile")}
            icon={renderNavIcon(
              <PersonIcon />,
              bottomNavValue === (user ? 4 : 3),
            )}
            data-tour="profile-nav"
          />
        </BottomNavigation>
      </Paper>

      {/* Dialogs */}
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultIsSignUp={false}
      />

      <SignupOnboardingDialog
        open={signupOnboardingOpen}
        onClose={() => setSignupOnboardingOpen(false)}
        onAddAddress={() => navigate("/profile")}
      />

      {showNewsForm && (
        <NewsForm
          open={showNewsForm}
          onClose={() => setShowNewsForm(false)}
          onSuccess={handleNewsCreated}
        />
      )}

      <ClassificationAssignment
        open={showClassificationAssignment}
        onClose={() => setShowClassificationAssignment(false)}
      />

      <ContentRatingApprovalDialog
        open={showContentRatingApproval}
        onClose={() => setShowContentRatingApproval(false)}
      />

      {/* Logged-in users get the user onboarding even before email verification. */}
      <OnboardingTour isLoggedIn={!!user} isVerified={!!user} />
    </Box>
  );
};

export default MainLayout;