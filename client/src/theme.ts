import { createTheme } from "@mui/material/styles";
import { semanticTokens } from "./styles/semanticTokens";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: semanticTokens.color.brandPrimary,
      contrastText: semanticTokens.color.bgSurface,
    },
    secondary: {
      main: semanticTokens.color.textPrimary,
      contrastText: semanticTokens.color.bgSurface,
    },
    background: {
      default: semanticTokens.color.bgCanvas,
      paper: semanticTokens.color.bgSurface,
    },
    text: {
      primary: semanticTokens.color.textPrimary,
      secondary: semanticTokens.color.textSecondary,
    },
    info: {
      main: semanticTokens.color.info,
      contrastText: semanticTokens.color.bgSurface,
    },
    success: {
      main: semanticTokens.color.success,
      contrastText: semanticTokens.color.bgSurface,
    },
    warning: {
      main: semanticTokens.color.warning,
      contrastText: "#000000",
    },
    error: {
      main: semanticTokens.color.error,
      contrastText: semanticTokens.color.bgSurface,
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
      color: semanticTokens.color.textPrimary,
    },
    h2: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: semanticTokens.color.textPrimary,
    },
    h3: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: semanticTokens.color.textPrimary,
    },
    h4: {
      fontFamily: '"Noto Serif TC", serif',
      fontWeight: 700,
      color: semanticTokens.color.textPrimary,
    },
    body1: {
      color: semanticTokens.color.textBody,
      lineHeight: 1.6,
    },
    body2: {
      color: semanticTokens.color.textBody,
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
          backgroundColor: semanticTokens.color.brandPrimary,
          color: semanticTokens.color.bgSurface,
          "&:hover": {
            backgroundColor: semanticTokens.color.brandPrimaryHover,
          },
        },
        outlined: {
          borderColor: semanticTokens.color.textSecondary,
          color: semanticTokens.color.textPrimary,
          "&:hover": {
            backgroundColor: semanticTokens.color.bgCanvas,
            borderColor: semanticTokens.color.textPrimary,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: semanticTokens.color.bgSurface,
          color: semanticTokens.color.textPrimary,
          boxShadow: semanticTokens.shadow.appBar,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: semanticTokens.color.chipBg,
          color: semanticTokens.color.textSecondary,
        },
        colorPrimary: {
          backgroundColor: semanticTokens.color.textPrimary,
          color: semanticTokens.color.bgSurface,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: semanticTokens.color.bgCanvas,
          borderRight: `1px solid ${semanticTokens.color.borderSubtle}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: semanticTokens.color.bgSurface,
          boxShadow: semanticTokens.shadow.card,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: semanticTokens.color.bgSurface,
          border: `1px solid ${semanticTokens.color.borderSubtle}`,
          boxShadow: semanticTokens.shadow.card,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: semanticTokens.color.textLink,
        },
      },
    },
  },
});

export default theme;
