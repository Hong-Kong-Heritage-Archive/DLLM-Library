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

  const handleBack = () => {
    navigate(-1);
  };

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
    error: any
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
        <Alert severity="info" sx={{ mt: 2 }}>
          {activeTab === 0
            ? t(
              "transactions.noOpenTransactions",
              "No open transactions found."
            )
            : t("transactions.noTransactions", "No transactions found.")}
        </Alert>
      );
    }

    return (
      <List>
        {transactions.map((transaction) => (
          <Paper key={transaction.id} elevation={1} sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleTransactionClick(transaction.id)}
            >
              <ListItemAvatar>
                <Avatar
                  src={
                    transaction.item?.thumbnails?.[0] ||
                    transaction.item?.images?.[0]
                  }
                  alt={transaction.item?.name}
                  sx={{ width: 60, height: 60 }}
                >
                  <SwapHorizIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {transaction.item?.name}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(transaction.status)}
                      label={t(
                        `transactions.status.${transaction.status.toLowerCase()}`,
                        transaction.status
                      )}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("transactions.requestedBy", "Requested by")}:{" "}
                      {transaction.requestor?.nickname ||
                        transaction.requestor?.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("transactions.created", "Created")}:{" "}
                      {formatDate(transaction.createdAt)}
                    </Typography>
                    {transaction.updatedAt !== transaction.createdAt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 2 }}
                      >
                        {t("transactions.updated", "Updated")}:{" "}
                        {formatDate(transaction.updatedAt)}
                      </Typography>
                    )}
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
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t("transactions.title", "My Transactions")}
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="transaction tabs"
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge badgeContent={openTransactionsCount} color="error">
                {t("transactions.openTransactions", "Open Transactions")}
              </Badge>
            }
            id="transactions-tab-0"
            aria-controls="transactions-tabpanel-0"
          />
          <Tab
            label={
              <Badge badgeContent={allTransactionsCount} color="primary">
                {t("transactions.allTransactions", "All Transactions")}
              </Badge>
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
          openTransactionsError
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderTransactionList(
          allTransactionsData?.transactionsByUser || [],
          allTransactionsLoading,
          allTransactionsError
        )}
      </TabPanel>
    </Container>
  );
};

export default TransactionsPage;
