// src/App.jsx
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // <— thêm dòng này
import Layout from "./layouts/Layout";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      {" "}
      {/* <— BỌC TOÀN BỘ ỨNG DỤNG */}
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}
