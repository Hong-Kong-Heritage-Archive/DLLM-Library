import React from "react";
import ReactDOM from "react-dom/client";
import BaseApp from "./BaseApp";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import * as serviceWorker from "./serviceWorker";
import "./index.css";
import "./i18n";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BaseApp />
    </ThemeProvider>
  </React.StrictMode>
);

// Register the Service Worker for PWA features
serviceWorker.register({
  onSuccess: () => console.log("Service Worker registered successfully"),
  onUpdate: (registration) => {
    console.log("New Service Worker version available");
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  },
});
