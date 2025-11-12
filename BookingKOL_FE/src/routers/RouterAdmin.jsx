// src/router/routerAdmin.jsx
import { Navigate } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage";
import MainLayoutAdmin from "../layouts/MainLayoutAdmin";
import DashBoard from "../pages/admin/dashboard/DashBoard";
import ManagementLogAI from "../pages/admin/ai/ManagementLogAI";
import ManagementCustomer from "../pages/admin/management-user/management-customer/ManagementCustomer";
import UserDetailPage from "../pages/admin/management-user/management-customer/UserDetailPage";
import ManagementKOL from "../pages/admin/management-user/management-kol/ManagementKOL";
import ManagementCourse from "../pages/admin/course/ManagementCourse";
import ViewDetailCourse from "../pages/admin/course/EditDetailCourse";
import ManagementCategory from "../pages/admin/category/ManagementCategory";
import CreateCoursePage from "../pages/admin/course/CreateCoursePage";
import ManagementCourseHistory from "../pages/admin/course/ManagementCourseHistory";

import ManagementBookingRequests from "../pages/admin/booking/ManagementBookingRequests";
import ManagementRefundRequests from "../pages/admin/booking/ManagementRefundRequests";
import BookingRequestDetail from "../pages/admin/booking/BookingRequestDetail";

import EditKOL from "../pages/admin/management-user/management-kol/EditKOL";
import KolPortfolioPage from "../pages/admin/management-user/management-kol/KolPortfolioPage";
import CreateKOL from "../pages/admin/management-user/management-kol/CreateKOL";
import AdminKolBookingById from "../pages/admin/management-user/management-kol/AdminKolBookingById";
import AdminUserBookingById from "../pages/admin/management-user/management-customer/AdminUserBookingById";
import AdminViewKolSchedule from "../pages/admin/management-user/management-kol/AdminViewKolSchedule";

// Campaign pages
import ManagementBookingCampaigns from "../pages/admin/booking-campaign/ManagementBookingCampaigns";
import EditBookingCampaign from "../pages/admin/booking-campaign/EditBookingCampain"; // 👈 mới
import ManagementBlog from "../pages/admin/blog/ManagementBlog";
import AdminBlogDetail from "../pages/admin/blog/AdminBlogDetail";
import CreateBlog from "../pages/admin/blog/CreateBlog";

import AdminKolLivestreamMetrics from "../pages/admin/management-user/management-kol/AdminKolLivestreamMetrics";

export const routerAdmin = [
  { path: "/login", element: <LoginPage /> },

  {
    path: "/admin",
    element: <MainLayoutAdmin />,
    children: [
      { index: true, element: <DashBoard /> },
      { path: "management-log-chat-ai", element: <ManagementLogAI /> },
      { path: "management-customer", element: <ManagementCustomer /> },
      { path: "management-customer/:id", element: <UserDetailPage /> },

      { path: "management-kol", element: <ManagementKOL /> },
      { path: "kols/:kolId/schedule", element: <AdminViewKolSchedule /> },

      { path: "kols/create", element: <CreateKOL /> },
      { path: "kols/:kolId/edit", element: <EditKOL /> },
      { path: "kols/:kolId/portfolio", element: <KolPortfolioPage /> },
      {
        path: "management-customer/:userId/bookings",
        element: <AdminUserBookingById />,
      },
      {
        path: "management-booking-requests",
        element: <ManagementBookingRequests />,
      },
      { path: "management-refunds", element: <ManagementRefundRequests /> },
      {
        path: "management-booking-requests/:requestId",
        element: <BookingRequestDetail />,
      },

      { path: "management-course", element: <ManagementCourse /> },
      {
        path: "management-course-history",
        element: <ManagementCourseHistory />,
      },
      { path: "edit-detail-course/:id", element: <ViewDetailCourse /> },
      { path: "management-category", element: <ManagementCategory /> },
      { path: "create-course", element: <CreateCoursePage /> },
      { path: "kols/:kolId/bookings", element: <AdminKolBookingById /> },

      // Campaign
      {
        path: "management-booking-campaigns",
        element: <ManagementBookingCampaigns />,
      },

      { path: "bookings/create", element: <EditBookingCampaign /> }, // 👈 mới

      { path: "management-blogs", element: <ManagementBlog /> },
      { path: "management-blogs/create", element: <CreateBlog /> },
      { path: "management-blogs/:blogId", element: <AdminBlogDetail /> },

      {
        path: "/admin/kols/:kolId/metrics",
        element: <AdminKolLivestreamMetrics />,
      },
    ],
  },

  { path: "*", element: <Navigate to="/admin" /> },
];
