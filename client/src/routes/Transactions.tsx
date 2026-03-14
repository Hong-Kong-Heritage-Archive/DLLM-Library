import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  ArrowBack,
  SwapHoriz as SwapHorizIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Done as DoneIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useNavigateBack } from "../hook/useNavigateBack";
import { User, Transaction, TransactionStatus } from "../generated/graphql";

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($userId: ID!) {
    transactionsByUser(userId: $userId) {
      id
      status
      createdAt
      updatedAt
      item {
        id
        name
        images
        thumbnails
        ownerId
        location {
          latitude
          longitude
        }
      }
      requestor {
        id
        nickname
        email
      }
    }
  }
`;

const GET_USER_OPEN_TRANSACTIONS = gql`
  query GetUserOpenTransactions($userId: ID!) {
    openTransactionsByUser(userId: $userId) {
      id
      status
      createdAt
      updatedAt
      item {
        id
        name
        images
        thumbnails
        ownerId
        location {
          latitude
          longitude
        }
      }
      requestor {
        id
        nickname
        email
      }
    }
  }
`;

interface OutletContext {
  email?: string | undefined | null;
  user?: User;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transactions-tabpanel-${index}`}
      aria-labelledby={`transactions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState(0);
  const handleBack = useNavigateBack("/");

  const {
    data: allTransactionsData,
    loading: allTransactionsLoading,
    error: allTransactionsError,
  } = useQuery<{
    transactionsByUser: Transaction[];
  }>(GET_USER_TRANSACTIONS, {
    variables: { userId: user?.id! },
    skip: !user?.id,
  });

  const {
    data: openTransactionsData,
    loading: openTransactionsLoading,
    error: openTransactionsError,
  } = useQuery<{
    openTransactionsByUser: Transaction[];
  }>(GET_USER_OPEN_TRANSACTIONS, {
    variables: { userId: user?.id! },
    skip: !user?.id,
  });

  const handleTransactionClick = (transactionId: string) => {
    navigate(`/transaction/${transactionId}`);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending:
        return <ScheduleIcon color="warning" />;
      case TransactionStatus.Approved:
        return <CheckCircleIcon color="success" />;
      case TransactionStatus.Transfered:
        return <LocalShippingIcon color="primary" />;
      case TransactionStatus.Completed:
        return <DoneIcon color="success" />;
      case TransactionStatus.Cancelled:
        return <CancelIcon color="error" />;
      default:
        return <SwapHorizIcon />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending:
        return "warning";
      case TransactionStatus.Approved:
        return "success";
      case TransactionStatus.Transfered:
        return "primary";
      case TransactionStatus.Completed:
        return "success";
      case TransactionStatus.Cancelled:
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTransactionList = (
    transactions: Transaction[],
    loading: boolean,
    error: any,
  ) => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t("transactions.errorLoading", "Error loading transactions")}:{" "}
          {error.message}
        </Alert>
      );
    }

    if (!transactions || transactions.length === 0) {
      return (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <SwapHorizIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {activeTab === 0
              ? t(
                  "transactions.noOpenTransactions",
                  "No open transactions found.",
                )
              : t("transactions.noTransactions", "No transactions found.")}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {activeTab === 0
              ? t(
                  "transactions.noOpenTransactionsHint",
                  "All your transactions are completed or cancelled.",
                )
              : t(
                  "transactions.noTransactionsHint",
                  "Start by borrowing or lending items in the community.",
                )}
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ py: 0 }}>
        {transactions.map((transaction) => (
          <Paper
            key={transaction.id}
            elevation={2}
            sx={{
              mb: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
            }}
          >
            <ListItemButton
              onClick={() => handleTransactionClick(transaction.id)}
              sx={{ p: 2 }}
            >
              <ListItemAvatar>
                <Avatar
                  src={
                    transaction.item?.thumbnails?.[0] ||
                    transaction.item?.images?.[0]
                  }
                  alt={transaction.item?.name}
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 2, // square?
                    border: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  <SwapHorizIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                sx={{ ml: 2 }}
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="span"
                      sx={{ fontWeight: 600 }}
                    >
                      {transaction.item?.name}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(transaction.status)}
                      label={t(
                        `transactions.status.${transaction.status.toLowerCase()}`,
                        transaction.status,
                      )}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mb: 0.5 }}
                    >
                      {t("transactions.requestedBy", "Requested by")}:{" "}
                      <strong>
                        {transaction.requestor?.nickname ||
                          transaction.requestor?.email}
                      </strong>
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("transactions.created", "Created")}:{" "}
                        {formatDate(transaction.createdAt)}
                      </Typography>
                      {transaction.updatedAt !== transaction.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          {t("transactions.updated", "Updated")}:{" "}
                          {formatDate(transaction.updatedAt)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItemButton>
          </Paper>
        ))}
      </List>
    );
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {t("auth.loginRequired", "Please log in to view your transactions.")}
        </Alert>
      </Container>
    );
  }

  const openTransactionsCount =
    openTransactionsData?.openTransactionsByUser?.length || 0;
  const allTransactionsCount =
    allTransactionsData?.transactionsByUser?.length || 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 4,
          pb: 2,
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            mr: 2,
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
            {t("transactions.title", "My Transactions")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              "transactions.subtitle",
              "View and manage your item exchange records",
            )}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={2}
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="transaction tabs"
          variant="fullWidth"
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={openTransactionsCount} color="error">
                  <Box>
                    {t("transactions.openTransactions", "Open Transactions")}
                  </Box>
                </Badge>
              </Box>
            }
            id="transactions-tab-0"
            aria-controls="transactions-tabpanel-0"
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={allTransactionsCount} color="primary">
                  <Box>
                    {t("transactions.allTransactions", "All Transactions")}
                  </Box>
                </Badge>
              </Box>
            }
            id="transactions-tab-1"
            aria-controls="transactions-tabpanel-1"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderTransactionList(
          openTransactionsData?.openTransactionsByUser || [],
          openTransactionsLoading,
          openTransactionsError,
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderTransactionList(
          allTransactionsData?.transactionsByUser || [],
          allTransactionsLoading,
          allTransactionsError,
        )}
      </TabPanel>
    </Container>
  );
};

export default TransactionsPage;
