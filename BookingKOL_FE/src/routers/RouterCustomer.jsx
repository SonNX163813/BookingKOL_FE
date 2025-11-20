import { Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

// Pages (public)
import HomePage from "../pages/home/HomePage";
import KOLDetail from "../pages/home/kol/KOLDetail";
import RankingPage from "../pages/rank/RankingPage";
import ChatAIPage from "../pages/ai/ChatAIPage";
import CourseLivesteam from "../pages/home/course-live/CourseLivesteam";
import CourseLivesteamDetail from "../pages/home/course-live/CourseLivesteamDetail";
import BlogListPage from "../pages/home/blog/BlogListPage";
import BlogDetailPage from "../pages/home/blog/BlogDetailPage";

// Pages (private)
import UserProfile from "../pages/home/userProfileDetail/UserProfile";

// Auth pages
import LoginPage from "../pages/authentication/LoginPage.jsx";
import RegisterPage from "../pages/authentication/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage.jsx";
import VerifyEmailNotice from "../pages/authentication/VerifyEmailNotice.jsx";

// Guards
import GuestOnly, { RequireAuth } from "./RouterGuards";

//NotFound
import NotFound from "../pages/NotFound.jsx";
import ListKOL from "../pages/home/kol/ListKOL.jsx";

import ServicePackagePage from "../pages/booking_package/ServicePackagePage.jsx";
import ServicePackageBookingFormPage from "../pages/booking_package/ServicePackageBookingFormPage.jsx";
import HistoryBookingPackagePage from "../pages/booking_package/HistoryBookingPackagePage.jsx";
import CampaignBookingDetailPage from "../pages/booking_package/CampaignBookingDetailPage.jsx";
import BookingSinglePayment from "../pages/booking_single/BookingSinglePayment.jsx";
import BookingSinglePaymentSuccess from "../pages/booking_single/BookingSinglePaymentSuccess.jsx";
import BookingSinglePaymentFail from "../pages/booking_single/BookingSinglePaymentFail.jsx";
import BookingSingleReview from "../pages/booking_single/BookingSingleReview.jsx";
import MySingleBookingRequests from "../pages/home/booking/MySingleBookingRequests.jsx";
import MySingleBookingRequestDetail from "../pages/home/booking/MySingleBookingRequestDetail.jsx";
import CoursePurchaseReview from "../pages/home/course-live/CoursePurchaseReview.jsx";
import CoursePurchasePayment from "../pages/home/course-live/CoursePurchasePayment.jsx";
import CoursePurchaseSuccess from "../pages/home/course-live/CoursePurchaseSuccess.jsx";
import CoursePurchaseFail from "../pages/home/course-live/CoursePurchaseFail.jsx";
import CourseBookingHistory from "../pages/home/course-live/CourseBookingHistory.jsx";

const courseRoutes = [
  { path: "/danh-sach-khoa-hoc", element: <CourseLivesteam /> },
  {
    path: "/danh-sach-khoa-hoc/:courseId/:courseName",
    element: <CourseLivesteamDetail />,
  },
];

export const routerCustomer = [
  // NHÓM AUTH: chỉ cho khách, không render Layout để tránh lóe
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgotpassword", element: <ForgotPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailNotice /> },
    ],
  },

  // PUBLIC (có layout)
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/danh-sach-kol", element: <ListKOL /> },
      { path: "/danh-sach-kol/:kolId?/:kolName?", element: <KOLDetail /> },
      { path: "/ranking", element: <RankingPage /> },
      { path: "/chat-AI", element: <ChatAIPage /> },
      { path: "/blog", element: <BlogListPage /> },
      { path: "/blog/:blogId", element: <BlogDetailPage /> },
      { path: "/goi-chien-dich", element: <ServicePackagePage /> },
      {
        path: "/goi-chien-dich/dat-goi",
        element: <ServicePackageBookingFormPage />,
      },
      {
        path: "/xac-nhan-dat-lich-kol-le",
        element: <BookingSingleReview />,
      },
      { path: "/thanh-toan-kol-le", element: <BookingSinglePayment /> },
      {
        path: "/thanh-toan-kol-le/thanh-cong",
        element: <BookingSinglePaymentSuccess />,
      },
      {
        path: "/thanh-toan-kol-le/that-bai",
        element: <BookingSinglePaymentFail />,
      },
      ...courseRoutes,
    ],
  },

  // PRIVATE (RequireAuth bọc ngoài Layout để Layout/ Navbar không render trước)
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/userprofile", element: <UserProfile /> },
          {
            path: "/don-booking-chien-dich",
            element: <HistoryBookingPackagePage />,
          },
          {
            path: "/don-booking-chien-dich/:campaignId",
            element: <CampaignBookingDetailPage />,
          },
          { path: "/don-booking-kol", element: <MySingleBookingRequests /> },
          {
            path: "/don-booking-kol/:requestId",
            element: <MySingleBookingRequestDetail />,
          },
          {
            path: "/don-dat-khoa-hoc",
            element: <CourseBookingHistory />,
          },
          {
            path: "/khoa-hoc/review/:coursePackageId",
            element: <CoursePurchaseReview />,
          },
          {
            path: "/khoa-hoc/thanh-toan/:purchaseId",
            element: <CoursePurchasePayment />,
          },
          {
            path: "/khoa-hoc/thanh-toan/thanh-cong",
            element: <CoursePurchaseSuccess />,
          },
          {
            path: "/khoa-hoc/thanh-toan/that-bai",
            element: <CoursePurchaseFail />,
          },
        ],
      },
    ],
  },

  // 404 → về trang chủ
  { path: "*", element: <NotFound /> },
];

export default routerCustomer;
