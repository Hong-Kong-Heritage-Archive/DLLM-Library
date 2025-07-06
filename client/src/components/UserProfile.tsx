import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import {
  CreateUserMutation,
  CreateUserMutationVariables,
} from "../generated/graphql";
import Map from "../components/Map";

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
      location {
        latitude
        longitude
        geohash
      }
    }
  }
`;

interface UserProps {
  onUserCreated?: (data: CreateUserMutation) => void;
  open?: boolean;
  onClose?: () => void;
}


const CreateUser: React.FC<UserProps> = ({ onUserCreated,
  open = true,
  onClose
}) => {
  const [internalOpen, setInternalOpen] = useState(open);

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nickname, setNickname] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const [createUser, { data, loading, error: mutationError }] = useMutation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(CREATE_USER_MUTATION, {
    onCompleted: (data) => {
      if (onUserCreated) onUserCreated(data);
      setInternalOpen(false);
      setEmail("");
      setAddress("");
      setNickname("");
      setResolvedLocation(null);
    },
  });

  const handleAddressChange = async (newAddress: string) => {
    setAddress(newAddress);
    setLocationError(null);

    if (!newAddress.trim()) {
      setResolvedLocation(null);
      return;
    }

    // Debounce geocoding requests
    const timeoutId = setTimeout(async () => {
      try {
        setIsGeocodingAddress(true);

        // Call your backend to resolve the address
        // This could be a GraphQL query or REST API call
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: newAddress }),
        });

        if (!response.ok) {
          throw new Error('Failed to geocode address');
        }

        const locationData = await response.json();

        setResolvedLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          formattedAddress: locationData.formattedAddress,
        });

      } catch (error) {
        console.error('Geocoding error:', error);
        setLocationError('Failed to resolve address location');
        setResolvedLocation(null);
      } finally {
        setIsGeocodingAddress(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the resolved/formatted address if available
    const finalAddress = resolvedLocation?.formattedAddress || address;

    createUser({
      variables: {
        email,
        address: finalAddress || undefined,
        nickname: nickname || undefined,
      },
    });
  };

  return (
    <Box>
      <Dialog
        open={internalOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center" }}>Create User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Nickname"
              type="text"
              fullWidth
              margin="normal"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <TextField
              label="Address"
              type="text"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Search address"
              disabled={isGeocodingAddress}
            />

            {isGeocodingAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Resolving address...
                </Typography>
              </Box>
            )}

            {locationError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {locationError}
              </Alert>
            )}

            {resolvedLocation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Resolved Address: {resolvedLocation.formattedAddress}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Coordinates: {resolvedLocation.latitude.toFixed(6)}, {resolvedLocation.longitude.toFixed(6)}
                </Typography>

                <Box sx={{ height: 300, mt: 2 }}>
                  <Map
                    open={true}
                    closeEvent={() => { }}
                    location={resolvedLocation.formattedAddress}
                    coordinates={{
                      lat: resolvedLocation.latitude,
                      lng: resolvedLocation.longitude
                    }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          {mutationError && <Alert severity="error">{mutationError.message}</Alert>}
          {loading && (
            <CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />
          )}
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
