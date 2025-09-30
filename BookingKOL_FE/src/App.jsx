// src/App.jsx
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routers/AppRouter";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
