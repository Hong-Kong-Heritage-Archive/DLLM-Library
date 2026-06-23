import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#db036b",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#190609",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f9f5f6",
      paper: "#ffffff",
    },
    text: {
      primary: "#190609",
      secondary: "#70484d",
    },
    info: {
      main: "#db036b",
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
      main: "#890604",
      contrastText: "#ffffff",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      '"IBM Plex Sans"',
      '"Noto Serif TC"',
      '"PingFang HK"',
      '"PingFang TC"',
      '"Microsoft JhengHei"',
      "sans-serif",
    ].join(","),
    h1: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: "#190609",
    },
    h2: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: "#190609",
    },
    h3: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: "#190609",
    },
    h4: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: "#190609",
    },
    body1: {
      color: "#70484d",
      lineHeight: 1.6,
    },
    body2: {
      color: "#70484d",
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          boxShadow: "none",
          padding: "10px 18px",
        },
        contained: {
          backgroundColor: "#db036b",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#b3005a",
          },
        },
        outlined: {
          borderColor: "#70484d",
          color: "#190609",
          "&:hover": {
            backgroundColor: "#f9f5f6",
            borderColor: "#190609",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#190609",
          boxShadow: "0 1px 4px rgba(25, 6, 9, 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "#f1e9ea",
          color: "#70484d",
        },
        colorPrimary: {
          backgroundColor: "#190609",
          color: "#ffffff",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#f9f5f6",
          borderRight: "1px solid #e4d8da",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(25, 6, 9, 0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e4d8da",
          boxShadow: "0 1px 3px rgba(25, 6, 9, 0.06)",
        },
      },
    },
  },
});

export default theme;
