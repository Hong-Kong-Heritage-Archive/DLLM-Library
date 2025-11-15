import React, { useState, useEffect } from "react";
import { useQuery, useLazyQuery, gql } from "@apollo/client";
import {
  Container,
  Typography,
  List,
  ListItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Pagination,
  Box,
  Chip,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  BookmarkBorder as BorrowedIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { User } from "../generated/graphql";
import { formatDistanceToNow } from "date-fns";

const GET_ON_LOAN_ITEMS = gql`
  query GetOnLoanItemsByHolder($userId: ID!, $limit: Int!, $offset: Int!) {
    itemsOnLoanByHolder(userId: $userId, limit: $limit, offset: $offset) {
      id
      name
      description
      condition
      images
      updatedAt
      createdAt
      ownerId
      holderId
      status
      deposit
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      nickname
      email
    }
  }
`;

interface OnLoanItem {
  id: string;
  name: string;
  description?: string;
  condition: string;
  images?: string[];
  updatedAt: string;
  createdAt: string;
  ownerId: string;
  holderId?: string;
  status: string;
  deposit?: number;
}

interface OnLoanItemsData {
  itemsOnLoanByHolder: OnLoanItem[];
}

interface UserData {
  user: {
    id: string;
    nickname: string;
    email: string;
  };
}

interface OutletContext {
  user?: User;
}

interface EnrichedItem extends OnLoanItem {
  owner?: UserData["user"];
  holder?: UserData["user"];
}

const BorrowedItemsView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContext>();

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { data, loading, error, refetch } = useQuery<OnLoanItemsData>(
    GET_ON_LOAN_ITEMS,
    {
      variables: {
        userId: user?.id!,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
      skip: !user?.id,
      errorPolicy: "all",
    }
  );

  const [getUser] = useLazyQuery<UserData>(GET_USER, {
    errorPolicy: "all",
  });

  // Fetch user details for owners and holders
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!data?.itemsOnLoanByHolder || data.itemsOnLoanByHolder.length === 0) {
        setEnrichedItems([]);
        return;
      }

      setLoadingUsers(true);

      try {
        // Get unique user IDs
        const userIds = new Set<string>();
        data.itemsOnLoanByHolder.forEach((item) => {
          userIds.add(item.ownerId);
          if (item.holderId) {
            userIds.add(item.holderId);
          }
        });

        // Fetch all user details
        const userPromises = Array.from(userIds).map(async (userId) => {
          try {
            const result = await getUser({ variables: { id: userId } });
            return { id: userId, user: result.data?.user };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return { id: userId, user: null };
          }
        });

        const userResults = await Promise.all(userPromises);
        const userMap = new Map<string, UserData["user"] | null>();

        userResults.forEach((result) => {
          userMap.set(result.id, result.user || null);
        });

        // Enrich items with user details
        const enriched: EnrichedItem[] = data.itemsOnLoanByHolder.map(
          (item) => ({
            ...item,
            owner: userMap.get(item.ownerId) || undefined,
            holder: item.holderId
              ? userMap.get(item.holderId) || undefined
              : undefined,
          })
        );

        setEnrichedItems(enriched);
      } catch (error) {
        console.error("Error enriching items with user details:", error);
        // Fallback: use items without user details
        setEnrichedItems(data.itemsOnLoanByHolder.map((item) => ({ ...item })));
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUserDetails();
  }, [data, getUser]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewItem = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatLastUpdate = (updatedAt: string) => {
    try {
      return formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
    } catch {
      return new Date(updatedAt).toLocaleDateString();
    }
  };

  // Since we don't have total count from the query, we'll estimate based on returned items
  const hasMoreItems = data?.itemsOnLoanByHolder.length === pageSize;
  const canShowPagination = page > 1 || hasMoreItems;

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {t(
            "common.loginRequired",
            "Please log in to view your borrowed items"
          )}
        </Alert>
      </Container>
    );
  }

  const isLoadingContent = loading || loadingUsers;

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Loading State */}
      {isLoadingContent && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>
            {loading
              ? t("item.loadingBorrowedItems", "Loading your borrowed items...")
              : t("item.loadingUserDetails", "Loading user details...")}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("item.errorLoadingBorrowedItems", "Error loading borrowed items")}:{" "}
          {error.message}
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            {t("common.retry", "Retry")}
          </Button>
        </Alert>
      )}

      {/* Results Summary */}
      {!isLoadingContent && enrichedItems && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {enrichedItems.length === 0
              ? t(
                  "item.noBorrowedItems",
                  "You currently have no borrowed items"
                )
              : t(
                  "item.borrowedItemsCount",
                  "You have {{count}} borrowed item(s)",
                  {
                    count: enrichedItems.length,
                  }
                )}
          </Typography>
          {enrichedItems.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t("item.pageInfo", "Page {{page}}", { page })}
              {hasMoreItems &&
                t("item.moreItemsAvailable", " (more items may be available)")}
            </Typography>
          )}
        </Box>
      )}

      {/* Items List */}
      {!isLoadingContent && enrichedItems && enrichedItems.length > 0 && (
        <>
          <List sx={{ mb: 3 }}>
            {enrichedItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    p: 0,
                    mb: 2,
                  }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                    onClick={() => handleViewItem(item.id)}
                  >
                    <CardContent sx={{ pb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{ fontWeight: "medium", flex: 1 }}
                        >
                          {item.name}
                        </Typography>
                        <Chip
                          label={t(`shortStatus.${item.status}`, item.status)}
                          color={
                            item.status === "AVAILABLE" ? "success" : "default"
                          }
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>

                      {/* Item Description */}
                      {item.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </Typography>
                      )}

                      {/* Item Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        {/* Owner Information */}
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>{t("item.owner", "Owner")}:</strong>{" "}
                            {item.owner?.nickname ||
                              t("common.loading", "Loading...")}
                          </Typography>
                        </Box>

                        {/* Current Holder Information (if different from owner and not current user) */}
                        {item.holderId &&
                          item.holderId !== item.ownerId &&
                          item.holderId !== user?.id && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PersonIcon fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>
                                  {t("item.currentHolder", "Current Holder")}:
                                </strong>{" "}
                                {item.holder?.nickname ||
                                  t("common.loading", "Loading...")}
                              </Typography>
                            </Box>
                          )}

                        {/* Last Update Time */}
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>
                              {t("item.lastUpdated", "Last Updated")}:
                            </strong>{" "}
                            {formatLastUpdate(item.updatedAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Condition and Deposit */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`${t("item.condition", "Condition")}: ${
                            item.condition
                          }`}
                          variant="outlined"
                          size="small"
                        />
                        {item.deposit && item.deposit > 0 && (
                          <Chip
                            label={`${t("item.deposit", "Deposit")}: $${
                              item.deposit
                            }`}
                            variant="outlined"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>

                      {/* View Button */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          mt: 2,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewItem(item.id);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
                {index < enrichedItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {/* Pagination */}
          {canShowPagination && (
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}
            >
              <Button
                variant="outlined"
                disabled={page <= 1}
                onClick={() => handlePageChange(null as any, page - 1)}
              >
                {t("common.previous", "Previous")}
              </Button>
              <Typography sx={{ display: "flex", alignItems: "center", px: 2 }}>
                {t("item.currentPage", "Page {{page}}", { page })}
              </Typography>
              <Button
                variant="outlined"
                disabled={!hasMoreItems}
                onClick={() => handlePageChange(null as any, page + 1)}
              >
                {t("common.next", "Next")}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoadingContent && enrichedItems && enrichedItems.length === 0 && (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <CardContent>
            <BorrowedIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t(
                "item.noBorrowedItems",
                "You currently have no borrowed items"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t(
                "item.noBorrowedItemsDescription",
                "When you borrow items from other users, they will appear here."
              )}
            </Typography>
            <Button variant="contained" onClick={() => navigate("/item/all")}>
              {t("item.browseItems", "Browse Available Items")}
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default BorrowedItemsView;
