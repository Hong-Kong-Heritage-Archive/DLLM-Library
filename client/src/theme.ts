import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#db036b", // Changed from blue to pink
      contrastText: "#ffffff", // White text on pink background
    },
    secondary: {
      main: "#25975d", // Dark grey for secondary elements
      contrastText: "#ffffff", // White text
    },
    background: {
      default: "#e0e0e0", // Light grey background (instead of white)
      paper: "#f5f5f5", // Slightly lighter grey for paper/cards
    },
    text: {
      primary: "#000000", // Black text on light backgrounds
      secondary: "#424242", // Dark grey for secondary text
    },
    info: {
      main: "#000000",
      contrastText: "#25975d",
    },
    success: {
      main: "#2e7d32", // Keep success colors reasonable
      contrastText: "#ffffff",
    },
    warning: {
      main: "#ed6c02",
      contrastText: "#000000",
    },
    error: {
      main: "#d32f2f",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#db036b",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#25975d",
          },
        },
        outlined: {
          borderColor: "#000000",
          color: "#000000",
          "&:hover": {
            backgroundColor: "#f5f5f5",
            borderColor: "#333333",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#db036b",
          color: "#ffffff",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#25975d",
          color: "#ffffff",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#f5f5f5",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#e0f5e0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#e0ffe0",
          border: "1px solid #e0e0e0",
        },
      },
    },
  },
});

export default theme;
