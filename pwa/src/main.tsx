import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "./lib/useTheme";
import { applyTheme, getThemeChoice } from "./lib/theme";
import "./index.css";

// Paint the saved theme onto :root before React mounts, so the app never flashes
// the wrong world on launch.
applyTheme(getThemeChoice());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
