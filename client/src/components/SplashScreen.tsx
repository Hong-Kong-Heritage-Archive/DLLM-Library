import React, { useEffect, useState } from "react";
import { Box, Typography, Fade, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface SplashScreenProps {
  text?: string | null;
  image?: string | null;
  onComplete: () => void;
  minDisplayTime?: number; // Minimum time to show splash (milliseconds)
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  text,
  image,
  onComplete,
  minDisplayTime = 10000, // Default 2 seconds
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Set a timer to hide the splash screen
    const timer = setTimeout(() => {
      setShow(false);
      // Wait for fade out animation to complete
      setTimeout(onComplete, 300);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onComplete]);

  const handleDismiss = () => {
    setShow(false);
    // Wait for fade out animation to complete
    setTimeout(onComplete, 300);
  };

  return (
    <Fade in={show} timeout={300}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          background: "linear-gradient(135deg, #db036b 0%, #25975d 100%)",
        }}
      >
        {/* Dismiss Button */}
        <IconButton
          onClick={handleDismiss}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
            zIndex: 10000,
          }}
          aria-label="Close splash screen"
        >
          <CloseIcon />
        </IconButton>

        {/* Splash Image */}
        {image && (
          <Box
            sx={{
              width: "80%",
              maxWidth: 400,
              mb: 4,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={image}
              alt="Splash"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            />
          </Box>
        )}

        {/* Splash Text */}
        {text && (
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              px: 4,
              maxWidth: 600,
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {text}
          </Typography>
        )}

        {/* Loading indicator */}
        <Box
          sx={{
            mt: 4,
            width: 60,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.3)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              animation: "loading 1.5s ease-in-out infinite",
              "@keyframes loading": {
                "0%": {
                  transform: "translateX(-100%)",
                },
                "100%": {
                  transform: "translateX(100%)",
                },
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default SplashScreen;
