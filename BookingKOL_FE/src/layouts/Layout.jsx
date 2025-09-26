import React from "react";
// import { useLocation } from "react-router-dom";
import Navbar from "../components/home/kol/Navbar";
import Footer from "../components/home/kol/Footer";
import Routers from "../routers/Routers";

const Layout = () => {
  //   const location = useLocation();

  return (
    <>
      <Navbar />
      <Routers />
      <Footer />
    </>
  );
};

export default Layout;
