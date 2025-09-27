import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/home/kol/Navbar";
import Footer from "../components/home/kol/Footer";
import Routers from "../routers/Routers";

const Layout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Routers />
      <Footer />
    </>
  );
};

export default Layout;
