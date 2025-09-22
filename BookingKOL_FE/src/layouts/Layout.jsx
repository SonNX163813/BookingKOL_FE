import React from "react";
// import { useLocation } from "react-router-dom";
import Navbar from "../components/home/kol/Navbar";
// import Footer from "../components/Footer";
import Routers from "../routers/Routers";

const Layout = () => {
  //   const location = useLocation();

  const hideNavbarFooter = [].includes(location.pathname);

  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <Routers />
      {/* {!hideNavbarFooter && <Footer />} */}
    </>
  );
};

export default Layout;
