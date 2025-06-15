import React, { useState, } from "react";
import { DialogTitle, DialogContent, Button, Typography, Dialog, DialogActions } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapProps {
  open: boolean;
  closeEvent: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void;
  location?: { latitude: number; longitude: number } | null;
}

const Map: React.FC<MapProps> = ({ open, closeEvent, location }) => {
  const [error, setError] = useState<string | null>(null);

  const handleCloseMapDialog = () => {
    closeEvent({}, "escapeKeyDown"); // Or "backdropClick" depending on how you want to signal
  };


  return (
    <Dialog open={open} onClose={closeEvent}>
        <DialogTitle>My Location</DialogTitle>
            <DialogContent sx={{ height: '60vh', width: '60vw', padding: 0 }}> {/* Adjust height as needed */}
            {location ? (
              <MapContainer center={[location.latitude, location.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    You are here. <br /> Latitude: {location.latitude}, Longitude: {location.longitude}
                  </Popup>
                </Marker>
              </MapContainer>

            ) : (
            <Typography>Location not available.</Typography>
            )}
            </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseMapDialog}>Close</Button>
        </DialogActions>
    </Dialog>
  );
};

export default Map;
