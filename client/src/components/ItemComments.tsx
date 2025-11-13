import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Collapse,
  Chip,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  Pagination,
} from "@mui/material";
import {
  Send as SendIcon,
  Comment as CommentIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import {
  ItemComment,
  useGetItemCommentsQuery,
  useAddItemCommentMutation,
  GetItemCommentsQuery,
  User,
} from "../generated/graphql";
import { gql } from "@apollo/client";

const ADD_ITEM_COMMENT_MUTATION = gql`
  mutation AddItemComment($itemId: ID!, $content: String!) {
    addItemComment(itemId: $itemId, content: $content)
  }
`;

const GET_ITEM_COMMENTS_QUERY = gql`
  query GetItemComments($itemId: ID!, $first: Int!) {
    commentsByItemId(itemId: $itemId, first: $first) {
      comments {
        id
        content
        createdAt
        userId
        userNickname
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
interface ItemCommentsProps {
  itemId: string;
  currentUser?: User | null;
}

// TODO: move this into helper functions
const formatTimeAgo = (
  date: Date,
  t: (key: string, options?: { count: number }) => string
): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const timeUnits = [
    { limit: 60, value: 1, key: "time.secondsAgo" }, // < 60 seconds
    { limit: 3600, value: 60, key: "time.minutesAgo" }, // < 60 minutes
    { limit: 86400, value: 3600, key: "time.hoursAgo" }, // < 24 hours
    { limit: 604800, value: 86400, key: "time.daysAgo" }, // < 7 days
    { limit: 2419200, value: 604800, key: "time.weeksAgo" }, // < 4 weeks
    { limit: 29030400, value: 2592000, key: "time.monthsAgo" }, // < 12 months
  ];

  for (const unit of timeUnits) {
    if (diffInSeconds < unit.limit) {
      const count = Math.floor(diffInSeconds / unit.value);
      return t(unit.key, { count });
    }
  }

  // Fallback to years
  const years = Math.floor(diffInSeconds / 31536000); // 365 * 24 * 60 * 60
  return t("time.yearsAgo", { count: years });
};

const ItemComments: React.FC<ItemCommentsProps> = ({ itemId, currentUser }) => {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const commentsPerPage = 10;
  const maxChar = 1000;

  // Fetch comments - only when expanded
  const { data, loading, error, refetch, fetchMore } = useGetItemCommentsQuery({
    variables: {
      itemId,
      first: commentsPerPage,
    },
    fetchPolicy: "cache-and-network",
    skip: !isExpanded, // Only fetch when comments section is expanded
  });

  // Add comment mutation
  const [addComment, { loading: addingComment }] = useAddItemCommentMutation({
    onCompleted: () => {
      setNewComment("");
      refetch(); // Refresh comments after adding
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
    },
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      await addComment({
        variables: {
          itemId,
          content: newComment.trim(),
        },
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleLoadMore = () => {
    if (data?.commentsByItemId.pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          itemId,
          first: commentsPerPage,
          startAfterId: data.commentsByItemId.pageInfo.endCursor,
        },
      });
    }
  };

  const handleToggleComments = () => {
    setIsExpanded(!isExpanded);
  };

  const totalCount = data?.commentsByItemId?.comments?.length || 0;
  const totalPages =
    commentsPerPage > 0 ? Math.ceil(totalCount / commentsPerPage) : 0;

  const comments = data?.commentsByItemId.comments || [];
  const hasNextPage = data?.commentsByItemId.pageInfo?.hasNextPage || false;

  return (
    <Box>
      {/* Comment Toggle Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CommentIcon />}
          endIcon={isExpanded ? <CollapseIcon /> : <ExpandIcon />}
          onClick={handleToggleComments}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          {t("comments.title", "Comments")}
          {comments.length > 0 && (
            <Chip label={comments.length} size="small" sx={{ ml: 1 }} />
          )}
        </Button>
      </Box>

      {/* Collapsible Comments Section */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box
          sx={{ pl: 2, borderLeft: "2px solid", borderLeftColor: "divider" }}
        >
          {/* Add Comment Form */}
          {currentUser ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <form onSubmit={handleSubmitComment}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel
                      htmlFor="comment-input"
                      shrink={!!newComment || undefined}
                      sx={{
                        transform: "translate(12px, 12px) scale(1)",
                        "&.MuiInputLabel-shrink": {
                          transform: "translate(12px, -9px) scale(0.75)",
                        },
                      }}
                    >
                      {t("comments.inputLabel", "Your Comment")}
                    </InputLabel>
                    <Input
                      id="comment-input"
                      multiline
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={addingComment}
                      placeholder={t(
                        "comments.placeholder",
                        "Write a comment..."
                      )}
                      aria-describedby="comment-helper-text"
                      sx={{
                        mt: 2,
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 1,
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                        "&.Mui-focused": {
                          borderColor: "primary.main",
                          boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.5)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "grey.100",
                          borderColor: "grey.200",
                        },
                      }}
                    />
                    <FormHelperText id="comment-helper-text">
                      {newComment.length > 0 && (
                        <span
                          style={{
                            color:
                              newComment.length > maxChar ? "red" : "inherit",
                          }}
                        >
                          {newComment.length}/{maxChar}{" "}
                          {t("comments.characters", "characters")}
                        </span>
                      )}
                      {newComment.length === 0 &&
                        t(
                          "comments.helperText",
                          "Share your thoughts about this item"
                        )}
                    </FormHelperText>
                  </FormControl>

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        !newComment.trim() ||
                        addingComment ||
                        newComment.length > maxChar
                      }
                      startIcon={
                        addingComment ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SendIcon />
                        )
                      }
                    >
                      {addingComment
                        ? t("comments.posting", "Posting...")
                        : t("comments.post", "Post Comment")}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              {t("comments.loginRequired", "Please log in to post comments")}
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {t("comments.loadError", "Failed to load comments")}
            </Alert>
          )}

          {/* Comments List */}
          {loading && comments.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {comments.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  {t(
                    "comments.noComments",
                    "No comments yet. Be the first to comment!"
                  )}
                </Typography>
              ) : (
                <Box sx={{ pr: 2, mr: 2 }}>
                  {comments.map(
                    (comment) =>
                      comment && (
                        <Box key={comment.id}>
                          <Box
                            sx={{
                              mb: 3,
                              p: 2,
                              backgroundColor: "grey.50",
                              borderRadius: 2,
                              borderLeft: "3px solid",
                              borderTop: "2px solid",
                              borderBottom: "2px solid",
                              borderRight: "1px inset",
                              borderColor: "primary.main",
                              maxWidth: "100%",
                              width: "100%",
                              boxSizing: "border-box",
                              overflow: "hidden",
                              wordWrap: "break-word",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color="primary.main"
                              >
                                {comment.userNickname ||
                                  t("comments.anonymousUser", "Anonymous User")}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                •
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatTimeAgo(new Date(comment.createdAt), t)}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "pre-wrap",
                                color: "text.primary",
                                lineHeight: 1.6,
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                maxWidth: "100%",
                              }}
                            >
                              {comment.content}
                            </Typography>
                          </Box>
                        </Box>
                      )
                  )}

                  {/* Load More Button */}
                  {hasNextPage && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 3 }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={loading}
                      >
                        {loading
                          ? t("comments.loading", "Loading...")
                          : t("comments.loadMore", "Load More Comments")}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_event, value) => setPage(value - 1)}
                color="primary"
                showFirstButton
                showLastButton
                disabled={loading}
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ItemComments;
