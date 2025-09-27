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
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Switch,
  Chip,
  SvgIcon,
  Snackbar,
} from "@mui/material";
import {
  UpdateUserMutation,
  UpdateUserMutationVariables,
  CreateUserMutation,
  CreateUserMutationVariables,
  ContactMethodType,
  ContactMethod,
} from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  LocationOn as LocationIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from "@mui/icons-material";

// Create custom icons for social platforms that don't have default MUI icons
const SignalIcon = (props: any) => (
  <SvgIcon {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1 12h-2v-2h2v2zm0-4h-2V7h2v5z" />
  </SvgIcon>
);

const TelegramIcon = (props: any) => (
  <SvgIcon {...props}>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </SvgIcon>
);
import {
  UPDATE_USER_MUTATION,
  CREATE_USER_MUTATION,
  GET_EXCHANGE_POINTS,
} from "../hook/user";
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

interface ContactMethodForm {
  type: ContactMethodType;
  value: string;
  isPublic: boolean;
}

interface UserProfileProps {
  email?: string | null | undefined;
  onUserCreated?: (data: UpdateUserMutation | CreateUserMutation) => void;
  open?: boolean;
  onClose?: () => void;
  isCreateUser?: boolean;
  initialNickname?: string | undefined | null;
  initialAddress?: string | undefined | null;
  initialExchangePoints?: string[] | undefined | null;
  initialContactMethods?: ContactMethod[] | undefined | null; // Add initial contact methods
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
  initialContactMethods = [],
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(open);
  const [address, setAddress] = useState(initialAddress || "");
  const [nickname, setNickname] = useState(initialNickname || "");
  const [selectedExchangePoints, setSelectedExchangePoints] = useState<
    string[]
  >(initialExchangePoints || []);
  const [contactMethods, setContactMethods] = useState<ContactMethodForm[]>(
    initialContactMethods?.map((cm) => ({
      type: cm.type,
      value: cm.value,
      isPublic: cm.isPublic,
    })) || []
  );
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedPointForMap, setSelectedPointForMap] =
    useState<ExchangePoint | null>(null);
  const [contactMethodDialogOpen, setContactMethodDialogOpen] = useState(false);
  const [editingContactMethodIndex, setEditingContactMethodIndex] = useState<
    number | null
  >(null);
  const [newContactMethod, setNewContactMethod] = useState<ContactMethodForm>({
    type: ContactMethodType.Email,
    value: "",
    isPublic: false,
  });

  // Add validation states
  const [contactMethodError, setContactMethodError] = useState<string | null>(
    null
  );

  const [resolvedLocation, setResolvedLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>(null);

  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
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
      skip: isCreateUser,
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
        setShowSuccessSnackbar(true);
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
    setContactMethods(
      initialContactMethods?.map((cm) => ({
        type: cm.type,
        value: cm.value,
        isPublic: cm.isPublic,
      })) || []
    );
    setResolvedLocation(null);
    setLocationError(null);
  };

  const handleCloseSuccessSnackbar = () => {
    setShowSuccessSnackbar(false);
  };

  // Update internal state when props change
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  useEffect(() => {
    setAddress(initialAddress || "");
    setNickname(initialNickname || "");
  }, [initialAddress, initialNickname]);

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

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!newAddress.trim()) {
      setResolvedLocation(null);
      return;
    }

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

  // Contact Method handlers
  const handleAddContactMethod = () => {
    setNewContactMethod({
      type: ContactMethodType.Email,
      value: "",
      isPublic: false,
    });
    setEditingContactMethodIndex(null);
    setContactMethodDialogOpen(true);
  };

  const handleEditContactMethod = (index: number) => {
    setNewContactMethod(contactMethods[index]);
    setEditingContactMethodIndex(index);
    setContactMethodDialogOpen(true);
  };

  const handleDeleteContactMethod = (index: number) => {
    setContactMethods((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateHttpsUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateContactMethod = (
    type: ContactMethodType,
    value: string
  ): { isValid: boolean; error?: string } => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return {
        isValid: false,
        error: t("userProfile.validation.required", "This field is required"),
      };
    }

    switch (type) {
      case ContactMethodType.Email:
        if (!validateEmail(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.invalidEmail",
              "Please enter a valid email address"
            ),
          };
        }
        break;

      case ContactMethodType.Whatsapp:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.invalidWhatsappUrl",
              "Please enter a valid WhatsApp HTTPS link (e.g., https://wa.me/1234567890)"
            ),
          };
        }
        // Additional check for WhatsApp format
        if (
          !trimmedValue.includes("wa.me") &&
          !trimmedValue.includes("whatsapp.com")
        ) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.whatsappFormat",
              "Please use a WhatsApp link format (wa.me or whatsapp.com)"
            ),
          };
        }
        break;

      case ContactMethodType.Signal:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.invalidSignalUrl",
              "Please enter a valid Signal HTTPS link (e.g., https://signal.me/#p/+1234567890)"
            ),
          };
        }
        // Additional check for Signal format
        if (
          !trimmedValue.includes("signal.me") &&
          !trimmedValue.includes("signal.org")
        ) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.signalFormat",
              "Please use a Signal link format (signal.me or signal.org)"
            ),
          };
        }
        break;

      case ContactMethodType.Telegram:
        if (!validateHttpsUrl(trimmedValue)) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.invalidTelegramUrl",
              "Please enter a valid Telegram HTTPS link (e.g., https://t.me/username)"
            ),
          };
        }
        // Additional check for Telegram format
        if (
          !trimmedValue.includes("t.me") &&
          !trimmedValue.includes("telegram.me")
        ) {
          return {
            isValid: false,
            error: t(
              "userProfile.validation.telegramFormat",
              "Please use a Telegram link format (t.me or telegram.me)"
            ),
          };
        }
        break;

      default:
        break;
    }

    return { isValid: true };
  };

  const getContactMethodPlaceholder = (type: ContactMethodType): string => {
    switch (type) {
      case ContactMethodType.Email:
        return t("userProfile.emailPlaceholder", "e.g., user@example.com");
      case ContactMethodType.Whatsapp:
        return t(
          "userProfile.whatsappPlaceholder",
          "e.g., https://wa.me/1234567890"
        );
      case ContactMethodType.Signal:
        return t(
          "userProfile.signalPlaceholder",
          "e.g., https://signal.me/#p/+1234567890"
        );
      case ContactMethodType.Telegram:
        return t(
          "userProfile.telegramPlaceholder",
          "e.g., https://t.me/username"
        );
      default:
        return t("userProfile.socialPlaceholder", "Enter contact information");
    }
  };

  const getContactMethodHelper = (type: ContactMethodType): string => {
    switch (type) {
      case ContactMethodType.Email:
        return t("userProfile.emailHelper", "Enter a valid email address");
      case ContactMethodType.Whatsapp:
        return t(
          "userProfile.whatsappHelper",
          "Enter your WhatsApp link (https://wa.me/your-number)"
        );
      case ContactMethodType.Signal:
        return t(
          "userProfile.signalHelper",
          "Enter your Signal link (https://signal.me/#p/your-number)"
        );
      case ContactMethodType.Telegram:
        return t(
          "userProfile.telegramHelper",
          "Enter your Telegram link (https://t.me/username)"
        );
      default:
        return t("userProfile.socialHelper", "Enter your contact information");
    }
  };

  const handleContactMethodValueChange = (value: string) => {
    setNewContactMethod((prev) => ({
      ...prev,
      value: value,
    }));

    // Clear error when user starts typing
    if (contactMethodError) {
      setContactMethodError(null);
    }
  };

  const handleContactMethodTypeChange = (type: ContactMethodType) => {
    setNewContactMethod((prev) => ({
      ...prev,
      type: type,
      value: "", // Clear value when type changes
    }));

    // Clear error when type changes
    if (contactMethodError) {
      setContactMethodError(null);
    }
  };

  const handleSaveContactMethod = () => {
    const validation = validateContactMethod(
      newContactMethod.type,
      newContactMethod.value
    );

    if (!validation.isValid) {
      setContactMethodError(validation.error || "Invalid input");
      return;
    }

    // Check for duplicates
    const isDuplicate = contactMethods.some(
      (cm, index) =>
        index !== editingContactMethodIndex &&
        cm.type === newContactMethod.type &&
        cm.value.trim().toLowerCase() ===
          newContactMethod.value.trim().toLowerCase()
    );

    if (isDuplicate) {
      setContactMethodError(
        t(
          "userProfile.validation.duplicate",
          "This contact method already exists"
        )
      );
      return;
    }

    if (editingContactMethodIndex !== null) {
      // Editing existing contact method
      setContactMethods((prev) =>
        prev.map((cm, index) =>
          index === editingContactMethodIndex
            ? {
                ...newContactMethod,
                value: newContactMethod.value.trim(),
              }
            : cm
        )
      );
    } else {
      // Adding new contact method
      setContactMethods((prev) => [
        ...prev,
        {
          ...newContactMethod,
          value: newContactMethod.value.trim(),
        },
      ]);
    }

    setContactMethodDialogOpen(false);
    setEditingContactMethodIndex(null);
    setContactMethodError(null);
  };

  const handleCloseContactMethodDialog = () => {
    setContactMethodDialogOpen(false);
    setEditingContactMethodIndex(null);
    setContactMethodError(null);
  };

  // Check if save button should be enabled
  const isSaveDisabled = () => {
    if (!newContactMethod.value.trim()) return true;
    const validation = validateContactMethod(
      newContactMethod.type,
      newContactMethod.value
    );
    return !validation.isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAddress = resolvedLocation?.formattedAddress || address;

    const variables = {
      email: email || "",
      address: finalAddress,
      nickname: nickname,
      ...(isCreateUser
        ? {}
        : {
            exchangePoints: selectedExchangePoints,
            contactMethods: contactMethods.map((cm) => ({
              type: cm.type,
              value: cm.value.trim(),
              isPublic: cm.isPublic,
            })),
          }),
    };

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
          {isCreateUser ? t("auth.createProfile") : t("user.editProfile")}
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

            {/* Contact Methods Section - Only show for update user */}
            {!isCreateUser && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {t("userProfile.contactMethods", "Contact Methods")}
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddContactMethod}
                    variant="outlined"
                    size="small"
                  >
                    {t("userProfile.addContactMethod", "Add Contact Method")}
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t(
                    "userProfile.contactMethodsHelper",
                    "Add contact methods for other users to reach you when needed"
                  )}
                </Typography>

                {contactMethods.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      "userProfile.noContactMethods",
                      "No contact methods added yet. Add some to help others contact you."
                    )}
                  </Alert>
                ) : (
                  <List>
                    {contactMethods.map((method, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Chip
                                icon={
                                  method.isPublic ? (
                                    <PublicIcon />
                                  ) : (
                                    <PrivateIcon />
                                  )
                                }
                                label={
                                  method.isPublic
                                    ? t("common.public")
                                    : t("common.private")
                                }
                                size="small"
                                color={method.isPublic ? "success" : "default"}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={method.value}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditContactMethod(index)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteContactMethod(index)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Exchange Points Section - Only show for update user */}
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
              alignItems: "flex-end",
              gap: 1,
              p: 3,
            }}
          >
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
            <Button
              onClick={handleClose}
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {t("auth.cancel")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Contact Method Dialog */}
      <Dialog
        open={contactMethodDialogOpen}
        onClose={handleCloseContactMethodDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingContactMethodIndex !== null
            ? t("userProfile.editContactMethod", "Edit Contact Method")
            : t("userProfile.addContactMethod", "Add Contact Method")}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="contact-method-type-label">
              {t("userProfile.contactMethodType", "Type")}
            </InputLabel>
            <Select
              labelId="contact-method-type-label"
              value={newContactMethod.type}
              label={t("userProfile.contactMethodType", "Type")}
              onChange={(e) =>
                handleContactMethodTypeChange(
                  e.target.value as ContactMethodType
                )
              }
            >
              <MenuItem value={ContactMethodType.Email}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  {t("contactMethod.email", "Email")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Whatsapp}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon fontSize="small" />
                  {t("contactMethod.whatsapp", "WhatsApp")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Signal}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SignalIcon fontSize="small" />
                  {t("contactMethod.signal", "Signal")}
                </Box>
              </MenuItem>
              <MenuItem value={ContactMethodType.Telegram}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TelegramIcon fontSize="small" />
                  {t("contactMethod.telegram", "Telegram")}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label={t("userProfile.contactValue", "Contact Value")}
            placeholder={getContactMethodPlaceholder(newContactMethod.type)}
            helperText={
              contactMethodError ||
              getContactMethodHelper(newContactMethod.type)
            }
            value={newContactMethod.value}
            onChange={(e) => handleContactMethodValueChange(e.target.value)}
            error={Boolean(contactMethodError)}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={newContactMethod.isPublic}
                onChange={(e) =>
                  setNewContactMethod((prev) => ({
                    ...prev,
                    isPublic: e.target.checked,
                  }))
                }
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  {t("userProfile.makePublic", "Make Public")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {newContactMethod.isPublic
                    ? t(
                        "userProfile.publicContactHelp",
                        "This contact method will be visible to all users"
                      )
                    : t(
                        "userProfile.privateContactHelp",
                        "This contact method will only be shared during transactions"
                      )}
                </Typography>
              </Box>
            }
            sx={{ mt: 2, alignItems: "flex-start" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactMethodDialog}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSaveContactMethod}
            variant="contained"
            disabled={isSaveDisabled()}
          >
            {editingContactMethodIndex !== null
              ? t("common.update")
              : t("common.add")}
          </Button>
        </DialogActions>
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

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {isCreateUser
            ? t("userProfile.createSuccess")
            : t("userProfile.updateSuccess")}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfile;
