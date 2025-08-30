import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
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
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from "@mui/material";
import {
  UpdateUserMutation,
  UpdateUserMutationVariables,
  CreateUserMutation,
  CreateUserMutationVariables,
} from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create a custom icon using Leaflet's default marker
const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 23],
});

export const GET_GEO_DETAILS = gql`
  query GeocodeAddress($address: String!) {
    geocodeAddress(address: $address) {
      latitude
      longitude
      geohash
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $address: String
    $nickname: String
    $exchangePoints: [String!]
  ) {
    updateUser(
      address: $address
      nickname: $nickname
      exchangePoints: $exchangePoints
    ) {
      id
      address
      nickname
      createdAt
      location {
        latitude
        longitude
        geohash
      }
      isVerified
      isActive
      exchangePoints
    }
  }
`;

export const GET_EXCHANGE_POINTS = gql`
  query GetExchangePoints($limit: Int, $offset: Int) {
    exchangePoints(limit: $limit, offset: $offset) {
      id
      nickname
      address
      location {
        latitude
        longitude
        geohash
      }
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($email: String!, $address: String, $nickname: String) {
    createUser(email: $email, address: $address, nickname: $nickname) {
      id
      email
      address
      nickname
      createdAt
      location {
        latitude
        longitude
        geohash
      }
      isVerified
      isActive
    }
  }
`;

interface ExchangePoint {
  id: string;
  nickname: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
}

interface UserProfileProps {
  email?: string | null | undefined;
  onUserCreated?: (data: UpdateUserMutation | CreateUserMutation) => void;
  open?: boolean;
  onClose?: () => void;
  isCreateUser?: boolean;
  initialNickname?: string | undefined | null;
  initialAddress?: string | undefined | null;
  initialExchangePoints?: string[] | undefined | null; // For pre-filling selected exchange points
}

const UserProfile: React.FC<UserProfileProps> = ({
  email,
  onUserCreated,
  open = true,
  onClose,
  isCreateUser = false,
  initialNickname = "",
  initialAddress = "",
  initialExchangePoints = [],
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(open);
  const [address, setAddress] = useState(initialAddress || "");
  const [nickname, setNickname] = useState(initialNickname || "");
  const [selectedExchangePoints, setSelectedExchangePoints] = useState<
    string[]
  >(initialExchangePoints || []);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedPointForMap, setSelectedPointForMap] =
    useState<ExchangePoint | null>(null);

  const [resolvedLocation, setResolvedLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Query for exchange points
  const { data: exchangePointsData, loading: exchangePointsLoading } = useQuery(
    GET_EXCHANGE_POINTS,
    {
      variables: { limit: 50, offset: 0 },
      skip: isCreateUser, // Skip for create user, only show for update
    }
  );

  // Update mutation
  const [
    updateUser,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(
    UPDATE_USER_MUTATION,
    {
      onCompleted: (data) => {
        if (onUserCreated) onUserCreated(data);
        handleClose();
        resetForm();
      },
    }
  );

  // Create mutation
  const [
    createUser,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation<CreateUserMutation, CreateUserMutationVariables>(
    CREATE_USER_MUTATION,
    {
      onCompleted: (data) => {
        if (onUserCreated) onUserCreated(data);
        handleClose();
        resetForm();
      },
    }
  );

  // Determine which mutation data/loading/error to use
  const data = isCreateUser ? createData : updateData;
  const loading = isCreateUser ? createLoading : updateLoading;
  const mutationError = isCreateUser ? createError : updateError;

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const resetForm = () => {
    setAddress(initialAddress || "");
    setNickname(initialNickname || "");
    setSelectedExchangePoints(initialExchangePoints || []);
    setResolvedLocation(null);
    setLocationError(null);
  };

  // Update internal state when props change
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  useEffect(() => {
    setAddress(initialAddress || "");
    setNickname(initialNickname || "");
  }, [initialAddress, initialNickname]);

  /*
  useEffect(() => {
    setSelectedExchangePoints(initialExchangePoints || []);
  }, [initialExchangePoints]);
*/
  const [geocodeAddress, { loading: geocodeLoading }] = useLazyQuery(
    GET_GEO_DETAILS,
    {
      onCompleted: (data) => {
        if (data && data.geocodeAddress) {
          setResolvedLocation({
            latitude: data.geocodeAddress.latitude,
            longitude: data.geocodeAddress.longitude,
            formattedAddress: address ? address.trim() : "",
          });
        } else {
          setLocationError(
            t(
              "userProfile.locationNotFound",
              "Could not find location for the address."
            )
          );
          setResolvedLocation(null);
        }
        setIsGeocodingAddress(false);
      },
      onError: (error) => {
        console.error("Geocoding error:", error);
        setLocationError(
          t("userProfile.geocodeError", "Failed to resolve address location")
        );
        setResolvedLocation(null);
        setIsGeocodingAddress(false);
      },
    }
  );

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setLocationError(null);

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!newAddress.trim()) {
      setResolvedLocation(null);
      return;
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      setIsGeocodingAddress(true);

      geocodeAddress({
        variables: { address: newAddress.trim() },
      });
    }, 1500);

    setDebounceTimeout(timeoutId);
  };

  const handleExchangePointToggle = (pointId: string) => {
    setSelectedExchangePoints((prev) => {
      if (prev.includes(pointId)) {
        return prev.filter((id) => id !== pointId);
      } else {
        return [...prev, pointId];
      }
    });
  };

  const handleShowMap = (point: ExchangePoint) => {
    setSelectedPointForMap(point);
    setMapDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the resolved/formatted address if available
    const finalAddress = resolvedLocation?.formattedAddress || address;

    const variables = {
      email: email || "",
      address: finalAddress,
      nickname: nickname,
      ...(isCreateUser ? {} : { exchangePoints: selectedExchangePoints }),
    };

    // Call the appropriate mutation based on isCreateUser
    if (isCreateUser) {
      createUser({ variables });
    } else {
      updateUser({ variables });
    }
  };

  return (
    <Box>
      <Dialog open={internalOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>
          {isCreateUser ? t("auth.createProfile") : t("auth.editProfile")}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label={t("userProfile.nickname")}
              type="text"
              fullWidth
              margin="normal"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />

            <TextField
              label={t("userProfile.address")}
              type="text"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={t("userProfile.searchAddress")}
              disabled={isGeocodingAddress}
              required
            />

            {isGeocodingAddress && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t("userProfile.resolvingAddress")}
                </Typography>
              </Box>
            )}

            {locationError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {locationError}
              </Alert>
            )}

            {resolvedLocation &&
              typeof resolvedLocation.latitude === "number" &&
              typeof resolvedLocation.longitude === "number" &&
              !isNaN(resolvedLocation.latitude) &&
              !isNaN(resolvedLocation.longitude) && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("userProfile.currentAddress")}:{" "}
                    {resolvedLocation.formattedAddress}
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <MapContainer
                      center={[
                        resolvedLocation.latitude,
                        resolvedLocation.longitude,
                      ]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                      />

                      <Marker
                        position={[
                          resolvedLocation.latitude,
                          resolvedLocation.longitude,
                        ]}
                        icon={customIcon}
                      >
                        <Popup>
                          {t("location.here")} <br /> {t("location.latitude")}:{" "}
                          {resolvedLocation.latitude}, {t("location.longitude")}
                          : {resolvedLocation.longitude}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box>
                </Box>
              )}

            {/* Exchange Points Selection - Only show for update user */}
            {!isCreateUser && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">
                    <Typography variant="h6">
                      {t("userProfile.exchangePoints", "Exchange Points")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(
                        "userProfile.exchangePointsHelper",
                        "Select exchange points where you can meet for item handovers"
                      )}
                    </Typography>
                  </FormLabel>

                  {exchangePointsLoading && (
                    <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t(
                          "userProfile.loadingExchangePoints",
                          "Loading exchange points..."
                        )}
                      </Typography>
                    </Box>
                  )}

                  {exchangePointsData?.exchangePoints && (
                    <List sx={{ maxHeight: 300, overflow: "auto", mt: 1 }}>
                      {exchangePointsData.exchangePoints.map(
                        (point: ExchangePoint) => (
                          <ListItem key={point.id} dense>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedExchangePoints.includes(
                                    point.id
                                  )}
                                  onChange={() =>
                                    handleExchangePointToggle(point.id)
                                  }
                                />
                              }
                              label={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {point.nickname}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {point.address}
                                  </Typography>
                                </Box>
                              }
                              sx={{ flexGrow: 1 }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="view on map"
                                onClick={() => handleShowMap(point)}
                                size="small"
                              >
                                <LocationIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )
                      )}
                    </List>
                  )}

                  {selectedExchangePoints.length > 0 && (
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      {t(
                        "userProfile.selectedPoints",
                        "{{count}} exchange point(s) selected",
                        {
                          count: selectedExchangePoints.length,
                        }
                      )}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            )}
          </DialogContent>

          {mutationError && (
            <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
              {mutationError.message}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          )}

          <DialogActions
            sx={{
              flexDirection: "column",
              alignItems: "stretch",
              gap: 1,
              p: 3,
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {t("auth.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                loading ||
                address?.trim() === "" ||
                nickname?.trim() === "" ||
                isGeocodingAddress
              }
            >
              {loading
                ? isCreateUser
                  ? t("common.creating")
                  : t("common.updating")
                : isCreateUser
                ? t("auth.createProfile")
                : t("userProfile.updateProfile")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Exchange Point Map Dialog */}
      <Dialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedPointForMap?.nickname}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedPointForMap?.address}
          </Typography>
          {selectedPointForMap && (
            <Box sx={{ height: 400 }}>
              <MapContainer
                center={[
                  selectedPointForMap.location.latitude,
                  selectedPointForMap.location.longitude,
                ]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[
                    selectedPointForMap.location.latitude,
                    selectedPointForMap.location.longitude,
                  ]}
                  icon={customIcon}
                >
                  <Popup>
                    <strong>{selectedPointForMap.nickname}</strong>
                    <br />
                    {selectedPointForMap.address}
                  </Popup>
                </Marker>
              </MapContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDialogOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {isCreateUser
            ? t("userProfile.createSuccess")
            : t("userProfile.updateSuccess")}
        </Alert>
      )}
    </Box>
  );
};

export default UserProfile;
