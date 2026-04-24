import React from "react";
import ReactDOM from "react-dom/client";
import BaseApp from "./BaseApp";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import * as serviceWorker from "./serviceWorker";
import "./i18n";
import {
  applyBrowserBranding,
  loadDeployClientConfig,
} from "./utils/branding";

const renderApp = async () => {
  const deployConfig = await loadDeployClientConfig();
  window.__DLLM_CLIENT_CONFIG__ = deployConfig;
  applyBrowserBranding(deployConfig);

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
};

void renderApp();

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
