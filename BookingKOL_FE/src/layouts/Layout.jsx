// src/layouts/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

// ✅ CHỌN 1 TRONG 2 DÒNG SAU, tuỳ project bạn thực sự có file ở đâu:

// Nếu file ở: src/components/home/Navbar.jsx & Footer.jsx
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

// Nếu file ở: src/components/home/kol/Navbar.jsx & Footer.jsx
// import Navbar from "../components/home/kol/Navbar.jsx";
// import Footer from "../components/home/kol/Footer.jsx";

export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
