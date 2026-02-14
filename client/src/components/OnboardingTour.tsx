import React, { useState, useEffect } from "react";
import {
  Box,
  Backdrop,
  Paper,
  Typography,
  Button,
  IconButton,
  Fade,
} from "@mui/material";
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { getCookie, setCookie } from "../utils/cookies";

// Cookie names for tracking onboarding completion
const GUEST_ONBOARDING_COOKIE = "dllm_guest_onboarding_done";
const USER_ONBOARDING_COOKIE = "dllm_user_onboarding_done";

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  highlightPadding?: number;
}

interface OnboardingTourProps {
  isLoggedIn: boolean;
  isVerified?: boolean;
  onComplete?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isLoggedIn,
  isVerified,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Define tour steps based on user state
  const guestSteps: TourStep[] = [
    {
      targetSelector: '[data-tour="profile-nav"]',
      title: t("onboarding.guest.signIn.title", "Sign In or Sign Up"),
      description: t(
        "onboarding.guest.signIn.description",
        "Click here to sign in to your account or create a new one to start borrowing and sharing items!"
      ),
      position: "top",
    },
    {
      targetSelector: '[data-tour="news-nav"]',
      title: t("onboarding.guest.news.title", "Check Out Our News"),
      description: t(
        "onboarding.guest.news.description",
        "Stay updated with community announcements, events, and learn more about how our library works."
      ),
      position: "top",
    },
  ];

  const userSteps: TourStep[] = [
    {
      targetSelector: '[data-tour="view-all-items"]',
      title: t("onboarding.user.browseItems.title", "Browse Available Items"),
      description: t(
        "onboarding.user.browseItems.description",
        "Click here to see all available items. Find something you like and request to borrow it!"
      ),
      position: "bottom",
    },
    {
      targetSelector: '[data-tour="add-item"]',
      title: t("onboarding.user.addItem.title", "Share Your Items"),
      description: t(
        "onboarding.user.addItem.description",
        "Have something to share? Click here to add your items to the community library for others to borrow."
      ),
      position: "bottom",
    },
  ];

  const steps = isLoggedIn && isVerified ? userSteps : guestSteps;
  const cookieName =
    isLoggedIn && isVerified ? USER_ONBOARDING_COOKIE : GUEST_ONBOARDING_COOKIE;

  // Check if onboarding should be shown
  useEffect(() => {
    const checkAndShowTour = () => {
      const hasSeenTour = getCookie(cookieName);

      if (!hasSeenTour) {
        // Small delay to ensure DOM elements are rendered
        setTimeout(() => {
          setShowTour(true);
          setCurrentStep(0);
        }, 1000);
      }
    };

    checkAndShowTour();
  }, [isLoggedIn, isVerified, cookieName]);

  // Update target element position when step changes
  useEffect(() => {
    if (!showTour || steps.length === 0) return;

    const updateTargetPosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      const targetElement = document.querySelector(step.targetSelector);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    updateTargetPosition();

    // Update on resize or scroll
    window.addEventListener("resize", updateTargetPosition);
    document.addEventListener("scroll", updateTargetPosition, true);

    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      document.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [showTour, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCookie(cookieName, "true", {
      expires: 365, // 1 year
      path: "/",
      sameSite: "Lax",
    });
    setShowTour(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!showTour || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const padding = step.highlightPadding ?? 8;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 16;

    switch (step.position) {
      case "top":
        return {
          bottom: window.innerHeight - targetRect.top + margin,
          left: Math.max(
            margin,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - margin
            )
          ),
        };
      case "bottom":
        return {
          top: targetRect.bottom + margin,
          left: Math.max(
            margin,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - margin
            )
          ),
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          right: window.innerWidth - targetRect.left + margin,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + margin,
        };
      default:
        return {
          bottom: window.innerHeight - targetRect.top + margin,
          left: Math.max(
            margin,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - margin
            )
          ),
        };
    }
  };

  return (
    <>
      {/* Dark overlay with hole for highlighted element */}
      <Backdrop
        open={showTour}
        sx={{
          zIndex: 9998,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
        onClick={handleSkip}
      />

      {/* Highlight box around target element */}
      {targetRect && (
        <Box
          sx={{
            position: "fixed",
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            border: "3px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
            animation: "pulse 2s infinite",
            "@keyframes pulse": {
              "0%": {
                boxShadow:
                  "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(25, 118, 210, 0.7)",
              },
              "70%": {
                boxShadow:
                  "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 10px rgba(25, 118, 210, 0)",
              },
              "100%": {
                boxShadow:
                  "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(25, 118, 210, 0)",
              },
            },
          }}
        />
      )}

      {/* Tooltip */}
      <Fade in={showTour}>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            ...getTooltipPosition(),
            width: 320,
            maxWidth: "calc(100vw - 32px)",
            p: 3,
            zIndex: 10000,
            borderRadius: 2,
          }}
        >
          {/* Close button */}
          <IconButton
            size="small"
            onClick={handleSkip}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Content */}
          <Typography variant="h6" sx={{ mb: 1, pr: 3 }}>
            {step.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {step.description}
          </Typography>

          {/* Step indicator */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              mb: 2,
            }}
          >
            {steps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentStep ? "primary.main" : "grey.300",
                  transition: "background-color 0.3s",
                }}
              />
            ))}
          </Box>

          {/* Navigation buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <Button
              variant="text"
              onClick={handleSkip}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              {t("onboarding.skip", "Skip")}
            </Button>

            <Box sx={{ display: "flex", gap: 1 }}>
              {currentStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handlePrev}
                  size="small"
                  startIcon={<PrevIcon />}
                >
                  {t("onboarding.prev", "Back")}
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleNext}
                size="small"
                endIcon={currentStep < steps.length - 1 ? <NextIcon /> : null}
              >
                {currentStep < steps.length - 1
                  ? t("onboarding.next", "Next")
                  : t("onboarding.finish", "Got it!")}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default OnboardingTour;
