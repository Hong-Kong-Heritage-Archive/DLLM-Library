import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { NewsStatus, NewsType } from "../generated/graphql";

interface BooklistPost {
  id: string;
  title: string;
  relatedItems?: Array<{ id: string }> | null;
}

interface CollaborativeBooklistsQueryData {
  newsRecentPosts: BooklistPost[];
}

interface UserBooklistsQueryData {
  userBooklist: BooklistPost[];
}

interface AddToBooklistDialogProps {
  open: boolean;
  mode: "collaborative" | "personal";
  itemId: string;
  userId: string;
  nickname: string;
  onClose: () => void;
  onAdded: () => void;
  onError: (message: string) => void;
}

const EMPTY_BOOKLISTS: BooklistPost[] = [];

const COLLABORATIVE_BOOKLISTS_QUERY = gql`
  query CollaborativeBooklists(
    $limit: Int
    $offset: Int
    $newsStatus: NewsStatus
  ) {
    newsRecentPosts(limit: $limit, offset: $offset, newsStatus: $newsStatus) {
      id
      title
      relatedItems {
        id
      }
    }
  }
`;

const USER_BOOKLISTS_QUERY = gql`
  query UserBooklists($userId: ID!, $limit: Int, $offset: Int) {
    userBooklist(userId: $userId, limit: $limit, offset: $offset) {
      id
      title
      relatedItems {
        id
      }
    }
  }
`;

const CREATE_USER_BOOKLIST_MUTATION = gql`
  mutation CreateUserBooklist(
    $title: String!
    $content: String!
    $newsType: NewsType
    $newsStatus: NewsStatus
  ) {
    createNewsPost(
      title: $title
      content: $content
      newsType: $newsType
      newsStatus: $newsStatus
    ) {
      id
      title
      relatedItems {
        id
      }
    }
  }
`;

const UPDATE_USER_BOOKLIST_MUTATION = gql`
  mutation AddItemToUserBooklist($id: ID!, $relatedItemIds: [ID!]) {
    updateNewsPost(id: $id, relatedItemIds: $relatedItemIds) {
      id
      relatedItems {
        id
      }
    }
  }
`;

const ADD_ITEM_TO_COLLABORATIVE_BOOKLIST_MUTATION = gql`
  mutation AddItemToCollaborativeBooklist(
    $id: ID!
    $itemId: ID!
    $comment: String
  ) {
    addItemToNewsPost(id: $id, itemId: $itemId, comment: $comment) {
      id
    }
  }
`;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const AddToBooklistDialog: React.FC<AddToBooklistDialogProps> = ({
  open,
  mode,
  itemId,
  userId,
  nickname,
  onClose,
  onAdded,
  onError,
}) => {
  const { t } = useTranslation();
  const [selectedPostId, setSelectedPostId] = useState("");
  const [comment, setComment] = useState("");
  const [newBooklistTitle, setNewBooklistTitle] = useState("");
  const [createdBooklists, setCreatedBooklists] = useState<BooklistPost[]>([]);

  const collaborativeQuery = useQuery<CollaborativeBooklistsQueryData>(
    COLLABORATIVE_BOOKLISTS_QUERY,
    {
      variables: { limit: 20, offset: 0, newsStatus: NewsStatus.CoEditing },
      skip: !open || mode !== "collaborative",
    },
  );
  const userBooklistsQuery = useQuery<UserBooklistsQueryData>(
    USER_BOOKLISTS_QUERY,
    {
      variables: { userId, limit: 100, offset: 0 },
      skip: !open || mode !== "personal",
    },
  );

  const queryBooklists =
    mode === "personal"
      ? (userBooklistsQuery.data?.userBooklist ?? EMPTY_BOOKLISTS)
      : (collaborativeQuery.data?.newsRecentPosts ?? EMPTY_BOOKLISTS);
  const availableBooklists = useMemo(() => {
    if (mode !== "personal") return queryBooklists;
    const booklistsById = new Map(
      [...createdBooklists, ...queryBooklists].map((booklist) => [
        booklist.id,
        booklist,
      ]),
    );
    if (queryBooklists && queryBooklists.length === 0) {
      setNewBooklistTitle(`${nickname}'s WishList`);
    }
    return Array.from(booklistsById.values());
  }, [createdBooklists, mode, queryBooklists]);

  const [createUserBooklist, { loading: createLoading }] = useMutation(
    CREATE_USER_BOOKLIST_MUTATION,
  );
  const [updateUserBooklist, { loading: updateLoading }] = useMutation(
    UPDATE_USER_BOOKLIST_MUTATION,
  );
  const [addToCollaborativeBooklist, { loading: collaborativeAddLoading }] =
    useMutation(ADD_ITEM_TO_COLLABORATIVE_BOOKLIST_MUTATION);
  const queryLoading =
    mode === "personal"
      ? userBooklistsQuery.loading
      : collaborativeQuery.loading;
  const queryError =
    mode === "personal" ? userBooklistsQuery.error : collaborativeQuery.error;
  const mutationLoading =
    createLoading || updateLoading || collaborativeAddLoading;

  useEffect(() => {
    if (!open) return;

    if (
      !selectedPostId ||
      !availableBooklists.some((post) => post.id === selectedPostId)
    ) {
      setSelectedPostId(availableBooklists[0]?.id ?? "");
    }
  }, [availableBooklists, open, selectedPostId]);

  const handleClose = () => {
    if (mutationLoading) return;
    setSelectedPostId("");
    setComment("");
    setNewBooklistTitle("");
    setCreatedBooklists([]);
    onClose();
  };

  const handleCreateBooklist = async () => {
    const title = newBooklistTitle.trim();
    if (!title || queryLoading || queryError) return;

    const normalizedTitle = title.toLowerCase();
    const duplicateTitle = availableBooklists.some(
      (booklist) => booklist.title.trim().toLowerCase() === normalizedTitle,
    );
    if (duplicateTitle) {
      onError(
        t(
          "item.duplicateBooklistTitle",
          "A booklist with this title already exists.",
        ),
      );
      return;
    }

    try {
      const result = await createUserBooklist({
        variables: {
          title,
          content: "",
          newsType: NewsType.UserBooklist,
          newsStatus: NewsStatus.Published,
        },
      });
      const newBooklist = result.data?.createNewsPost as
        | BooklistPost
        | undefined;
      if (!newBooklist) {
        throw new Error("The booklist could not be created");
      }

      setCreatedBooklists((booklists) => [newBooklist, ...booklists]);
      setSelectedPostId(newBooklist.id);
      setNewBooklistTitle("");
      void userBooklistsQuery.refetch().catch((error: unknown) => {
        onError(getErrorMessage(error));
      });
    } catch (error) {
      onError(getErrorMessage(error));
    }
  };

  const handleAddItem = async () => {
    const selectedBooklist = availableBooklists.find(
      (booklist) => booklist.id === selectedPostId,
    );
    if (!selectedBooklist) {
      onError(
        t("item.invalidBooklistSelection", "Please choose a valid booklist"),
      );
      return;
    }

    try {
      let bookcomment = comment;
      if (mode === "personal") {
        if (comment.trim() === "") {
          bookcomment = "❤️";
        }
      }
      await addToCollaborativeBooklist({
        variables: {
          id: selectedBooklist.id,
          itemId,
          comment: bookcomment,
        },
      });

      onAdded();
      setSelectedPostId("");
      setComment("");
      setNewBooklistTitle("");
      setCreatedBooklists([]);
      onClose();
    } catch (error) {
      onError(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "personal"
          ? t("item.addToMyBooklist", "Add to My Booklist")
          : t("item.addbooklist", "Add to Booklist")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {queryLoading ? (
            <CircularProgress size={24} />
          ) : queryError ? (
            <Alert severity="error">{queryError.message}</Alert>
          ) : availableBooklists.length === 0 ? (
            <Alert severity="info">
              {mode === "personal"
                ? t(
                    "item.noPersonalBooklists",
                    "You have not created a booklist yet.",
                  )
                : t(
                    "item.noCollaborativeBooklists",
                    "No collaborative booklists are available.",
                  )}
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="booklist-select-label">
                {t("item.booklist", "Booklist")}
              </InputLabel>
              <Select
                labelId="booklist-select-label"
                value={selectedPostId}
                label={t("item.booklist", "Booklist")}
                onChange={(event) => setSelectedPostId(event.target.value)}
              >
                {availableBooklists.map((booklist) => (
                  <MenuItem key={booklist.id} value={booklist.id}>
                    {booklist.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label={t("item.comment", "Comment")}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
          {mode === "personal" ? (
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <TextField
                label={t("item.booklistTitle", "Booklist title")}
                value={newBooklistTitle}
                onChange={(event) => setNewBooklistTitle(event.target.value)}
                fullWidth
                disabled={createLoading}
              />
              <Button
                onClick={handleCreateBooklist}
                variant="outlined"
                disabled={
                  !newBooklistTitle.trim() ||
                  queryLoading ||
                  Boolean(queryError) ||
                  mutationLoading
                }
              >
                {createLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  t("item.createBooklist", "Create")
                )}
              </Button>
            </Box>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutationLoading}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleAddItem}
          variant="contained"
          disabled={
            !selectedPostId ||
            queryLoading ||
            Boolean(queryError) ||
            mutationLoading
          }
        >
          {updateLoading || collaborativeAddLoading ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : null}
          {t("common.add", "Add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToBooklistDialog;
