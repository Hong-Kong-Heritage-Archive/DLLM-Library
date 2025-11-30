import React from "react";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Fade,
  Backdrop,
} from "@mui/material";
import {
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  selectedIndex: number;
  onPrev: () => void;
  onNext: () => void;
  itemName?: string;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  open,
  onClose,
  images,
  selectedIndex,
  onPrev,
  onNext,
  itemName,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
            <IconButton onClick={onClose} color="primary">
              <CloseIcon />
            </IconButton>
          </Box>

          {images.length > 0 && (
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              {images.length > 1 && (
                <IconButton
                  onClick={onPrev}
                  sx={{ position: "absolute", left: -50, zIndex: 1 }}
                  color="primary"
                >
                  <PrevIcon />
                </IconButton>
              )}

              <img
                src={images[selectedIndex]}
                alt={`${itemName || "Image"} ${selectedIndex + 1}`}
                style={{
                  maxWidth: "80vw",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />

              {images.length > 1 && (
                <IconButton
                  onClick={onNext}
                  sx={{ position: "absolute", right: -50, zIndex: 1 }}
                  color="primary"
                >
                  <NextIcon />
                </IconButton>
              )}
            </Box>
          )}

          {images.length > 1 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedIndex + 1} / {images.length}
            </Typography>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default ImageGalleryModal;
