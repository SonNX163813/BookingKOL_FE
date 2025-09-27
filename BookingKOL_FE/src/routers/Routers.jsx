import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import UserProfile from "../pages/home/userProfileDetail/UserProflie";

// import Infomation from "../pages/profile/owner/infomation";
// import About from "../pages/About";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
      <Route path="/userprofile" element={<UserProfile />} />

      {/* <Route path="/infomation" element={<Infomation />} />
      <Route path="/about" element={<About />} /> */}
    </Routes>
  );
};

export default Routers;
