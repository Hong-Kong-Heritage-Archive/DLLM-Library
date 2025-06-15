import React, { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CreateUserMutation,
  CreateUserMutationVariables,
} from "../generated/graphql";

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($email: String!, $address: String, $nickname: String) {
    createUser(email: $email, address: $address, nickname: $nickname) {
      id
      email
      address
      nickname
      createdAt
      isActive
      isVerified
      role
    }
  }
`;

interface UserProps {
  onUserCreated?: (data: CreateUserMutation) => void;
}

const CreateUser: React.FC<UserProps> = ({ onUserCreated }) => {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const [createUser, { data, loading, error: mutationError }] = useMutation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(CREATE_USER_MUTATION, {
    onCompleted: (data) => {
      if (onUserCreated) onUserCreated(data);
      setOpen(false);
      setEmail("");
      setAddress("");
      setNickname("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser({
      variables: {
        email,
        address: address || undefined,
        nickname: nickname || undefined,
      },
    });
  };

  return (
    <Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>Create User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Address"
              type="text"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <TextField
              label="Nickname"
              type="text"
              fullWidth
              margin="normal"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            {error && <Alert severity="error">{error.message}</Alert>}
            {loading && (
              <CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />
            )}
          </DialogContent>
          <DialogActions
            sx={{ flexDirection: "column", alignItems: "stretch", gap: 1 }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                loading || address.trim() === "" || nickname.trim() === ""
              }
              sx={{ mt: 1 }}
            >
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          User created successfully!
        </Alert>
      )}
    </Box>
  );
};

export default CreateUser;
