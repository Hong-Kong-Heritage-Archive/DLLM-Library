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
import { useQuery, gql } from "@apollo/client";
import { User, Role, HostConfig } from "../generated/graphql";
import { AuthDialog } from "./Auth";
import LanguageSwitcher from "./LanguageSwitcher";
import NewsForm from "./NewsForm";
import ClassificationAssignment from "./ClassificationAssignment";
import ContentRatingApprovalDialog from "./ContentRatingApprovalDialog";
import OnboardingTour from "./OnboardingTour";
import { resolveBranding } from "../utils/branding";

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
        // Loan Items - only accessible when logged in
        if (user?.isVerified) {
          navigate("/loan-items?tab=borrowed");
        } else {
          setAuthDialogOpen(true);
        }
        break;
      case 4:
        if (user?.isVerified) {
          navigate("/profile");
        } else {
          setAuthDialogOpen(true);
        }
        break;
    }
  };

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#fbf9f4",
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        sx={{ bgcolor: "#fbf9f4", borderBottom: "none", pt: 0.5, px: 0.5 }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            py: 0.5,
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
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 900,
                color: "#1e1e1e",
                cursor: "pointer",
                letterSpacing: "-0.5px",
                lineHeight: "1.1",
                fontSize: { xs: "18px", sm: "24px", md: "28px" },
              }}
            >
              BookGuide
              <Box
                component="span"
                sx={{
                  color: "#b80c53",
                  fontSize: { xs: "13px", sm: "16px", md: "20px" },
                  fontWeight: 700,
                  ml: 0.5,
                }}
              >
                Sydney
              </Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Roboto Mono", monospace, sans-serif',
                color: "#666666",
                fontSize: { xs: "9px", sm: "11px" },
                mt: 0.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Hong Kong books. Keep them moving.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <LanguageSwitcher color="#1e1e1e" />

            {/* Notification Bell - only show for authenticated users */}
            {user ? (
              <IconButton
                onClick={handleNotificationsClick}
                sx={{
                  bgcolor: "#e5dec9",
                  color: "#1e1e1e",
                  width: "40px",
                  height: "40px",
                  "&:hover": { bgcolor: "#d8ceb4" },
                }}
                title={t("transactions.viewTransactions", "View Transactions")}
              >
                <Badge
                  variant="dot"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#b80c53",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      right: 2,
                      top: 2,
                    },
                  }}
                  invisible={notificationCount === 0}
                >
                  <NotificationsIcon sx={{ fontSize: "20px" }} />
                </Badge>
              </IconButton>
            ) : (
              <IconButton
                onClick={() => setAuthDialogOpen(true)}
                sx={{
                  bgcolor: "#e5dec9",
                  color: "#1e1e1e",
                  width: "40px",
                  height: "40px",
                  "&:hover": { bgcolor: "#d8ceb4" },
                }}
                title={t("auth.signIn", "Sign In")}
              >
                <PersonIcon sx={{ fontSize: "20px" }} />
              </IconButton>
            )}

            {/* Menu Button - only show for Admin users */}
            {user && user?.role === Role.Admin && (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMenuClick}
                  title={t("common.menu", "Menu")}
                  sx={{ color: "#1e1e1e" }}
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
          pb: 7, // Space for bottom navigation
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
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          borderTop: "1px solid rgba(0,0,0,0.04)",
        }}
        elevation={0}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavigation}
          showLabels
          sx={{
            height: "72px",
            backgroundColor: "#ffffff",
            "& .MuiBottomNavigationAction-root": {
              minWidth: "auto",
              padding: "8px 0",
              color: "#666666",
              transition: "all 0.2s ease-in-out",
              "& .MuiSvgIcon-root": {
                fontSize: "24px",
                transition: "all 0.2s ease-in-out",
              },
              "& .MuiBottomNavigationAction-label": {
                fontFamily: '"Noto Serif TC", sans-serif',
                fontSize: "12px",
                fontWeight: "bold",
                mt: "4px",
                "&.Mui-selected": {
                  fontSize: "12px",
                  color: "#b80c53",
                },
              },
              "&.Mui-selected": {
                color: "#b80c53",
                "& .MuiSvgIcon-root": {
                  color: "#b80c53",
                },
              },
            },
          }}
        >
          <BottomNavigationAction
            label="首頁"
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "32px",
                  borderRadius: "16px",
                  backgroundColor:
                    bottomNavValue === 0
                      ? "rgba(224, 18, 107, 0.12)"
                      : "transparent",
                  color: bottomNavValue === 0 ? "#b80c53" : "inherit",
                }}
              >
                <HomeIcon />
              </Box>
            }
          />
          <BottomNavigationAction
            label="尋書"
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "32px",
                  borderRadius: "16px",
                  backgroundColor:
                    bottomNavValue === 1
                      ? "rgba(224, 18, 107, 0.12)"
                      : "transparent",
                  color: bottomNavValue === 1 ? "#b80c53" : "inherit",
                }}
              >
                <SearchIcon />
              </Box>
            }
            data-tour="item-nav"
          />
          <BottomNavigationAction
            label="新聞"
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "32px",
                  borderRadius: "16px",
                  backgroundColor:
                    bottomNavValue === 2
                      ? "rgba(224, 18, 107, 0.12)"
                      : "transparent",
                  color: bottomNavValue === 2 ? "#b80c53" : "inherit",
                }}
              >
                <NewsIcon />
              </Box>
            }
            data-tour="news-nav"
          />
          {user?.isVerified && (
            <BottomNavigationAction
              label="書況"
              icon={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "56px",
                    height: "32px",
                    borderRadius: "16px",
                    backgroundColor:
                      bottomNavValue === 3
                        ? "rgba(224, 18, 107, 0.12)"
                        : "transparent",
                    color: bottomNavValue === 3 ? "#b80c53" : "inherit",
                  }}
                >
                  <LoanIcon />
                </Box>
              }
            />
          )}
          <BottomNavigationAction
            label="個人"
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "32px",
                  borderRadius: "16px",
                  backgroundColor:
                    bottomNavValue === (user?.isVerified ? 4 : 3)
                      ? "rgba(224, 18, 107, 0.12)"
                      : "transparent",
                  color:
                    bottomNavValue === (user?.isVerified ? 4 : 3)
                      ? "#b80c53"
                      : "inherit",
                }}
              >
                <PersonIcon />
              </Box>
            }
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

      {/* Onboarding Tour */}
      <OnboardingTour isLoggedIn={!!user} isVerified={user?.isVerified} />
    </Box>
  );
};

export default MainLayout;
