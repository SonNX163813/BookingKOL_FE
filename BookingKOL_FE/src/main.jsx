import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./App.css";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: { mode: "light" },
  typography: {
    fontFamily:
      "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    {/* <CssBaseline /> */}
    <App />
  </ThemeProvider>
);
