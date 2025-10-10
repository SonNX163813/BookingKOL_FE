// src/App.jsx
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routers/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer
        style={{ zIndex: 9999 }}
        position="top-right"
        autoClose={5000}
        rtl={false}
        limit={3}
      />
      <AppRouter />
    </AuthProvider>
  );
}
