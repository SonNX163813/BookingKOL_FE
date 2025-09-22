import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
// import Infomation from "../pages/profile/owner/infomation";
// import About from "../pages/About";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* <Route path="/infomation" element={<Infomation />} />
      <Route path="/about" element={<About />} /> */}
    </Routes>
  );
};

export default Routers;
