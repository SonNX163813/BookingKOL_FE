import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
import KOLDetail from "../pages/home/kol/KOLDetail";
// import Infomation from "../pages/profile/owner/infomation";
// import About from "../pages/About";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/kols/:kolId" element={<KOLDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* <Route path="/infomation" element={<Infomation />} />
      <Route path="/about" element={<About />} /> */}
    </Routes>
  );
};

export default Routers;
