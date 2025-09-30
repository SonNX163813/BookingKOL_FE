import React from "react";
import { Outlet } from "react-router-dom"; // ✅ thêm Outlet
import Navbar from "../components/home/kol/Navbar";
import Footer from "../components/home/kol/Footer";

export default function Layout() {
  return (
    <>
      {/* <Navbar /> */}
      <Outlet /> {/* ✅ nơi page con hiển thị */}
      {/* <Footer /> */}
    </>
  );
}
