import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#b80c53", // Deep magenta
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#213329", // Forest Green/Dark
      contrastText: "#ffffff",
    },
    background: {
      default: "#fbf9f4", // Main Cream Background
      paper: "#ffffff", // Cards split white or card content
    },
    text: {
      primary: "#1e1e1e", // Deep Charcoal
      secondary: "#666666",
    },
    info: {
      main: "#b80c53",
      contrastText: "#ffffff",
    },
    success: {
      main: "#213329",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#ed6c02",
      contrastText: "#000000",
    },
    error: {
      main: "#b80c53",
      contrastText: "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      '"Playfair Display"',
      '"Georgia"',
      '"PingFang HK"',
      '"PingFang TC"',
      '"Noto Serif TC"',
      '"Microsoft JhengHei"',
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#b80c53",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#9c1e43",
          },
        },
        outlined: {
          borderColor: "#1e1e1e",
          color: "#1e1e1e",
          "&:hover": {
            backgroundColor: "#fbf9f4",
            borderColor: "#1e1e1e",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#fbf9f4",
          color: "#1e1e1e",
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#213329",
          color: "#ffffff",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#fbf9f4",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
        },
      },
    },
  },
});

export default theme;
