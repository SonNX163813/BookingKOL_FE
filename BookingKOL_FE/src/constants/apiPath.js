export const API_PATHS = {
  AI: {
    chatAI: "/v1/consultation/ask",
    getLogChat: "/v1/adminconsultation/logs",
  },
  MANAGEMENT_USER: {
    managementKOL: "/v1/admin/kol/all",
    managementBrands: "/v1/admin/brands",
    adminUpdateStatusAccount: "/v1/admin/users",
    adminViewProfileUser: "/v1/users/profile/admin",
    adminKolUpdate: "/v1/admin/kol/update", // + /{kolId}
    adminKolCategoryAdd: "/v1/admin/kol/category/add", // + /{kolId}?categoryId=...
    adminKolCategoryRemove: "/v1/admin/kol/category/remove", // + /{kolId}?categoryId=...

    adminKolMediasAll: "/v1/admin/kol/medias/all", // + /{kolId}
    adminKolMediasUpload: "/v1/admin/kol/medias/upload", // + /{kolId}
    adminKolMediaDelete: "/v1/admin/kol/medias/delete", // + /{fileId}
    adminKolCoverChange: "/v1/admin/kol/cover-image", // + /{kolId}?fileId=...
    adminKolCreate: "/v1/admin/kol/create-new-kol",
  },
  COURSE: {
    getAllCourse: "/v1/admin/course/all",
    adminViewDetailCourse: "/v1/admin/course/detail",
    createCourse: "/v1/admin/course/create",
    adminCourseUpdate: "/v1/admin/course/update", // + /{courseId}
    adminCourseDelete: "/v1/admin/course/delete", // + /{courseId}
    adminCourseMediasRemove: "/v1/admin/course/medias/remove", // + /{courseId}
    adminCourseCoverImageSet: "/v1/admin/course/cover-image/set", // + /{courseId}?fileId=...
    adminCourseMediasUpload: "/v1/admin/course/medias/upload", // + /{courseId}
    adminCourseHistory: "/v1/admin/course/history/all",
    adminCourseConfirm: "/v1/admin/course/confirm", // + /{purchasedCourseId}
  },
  CATEGORY: {
    getAllCategory: "/v1/categories",
    getCategoryById: "/v1/categories",
    createCategory: "/v1/categories",
    deleteCategory: "/v1/categories",
    patchCategory: "/v1/categories",
  },
  BOOKING_CAMPAIGN: {
    list: "/v1/admin/bookings", // nếu Swagger của bạn KHÔNG có /v1 thì đổi thành "/admin/bookings"
    create: "/v1/admin/bookings/create",
    detail: "/v1/admin/bookings/admin", // + /{campaignId}
  },
  CAMPAIGN: {
    detail: "/v1/campaigns", // + /{campaignId}
  },
  BOOKING_REQUEST: {
    getAll: "/v1/admin/booking/single-requests/all",
    getDetail: "/v1/admin/booking/single-requests/detail",
    getAllByKol: "/v1/admin/booking/single-requests/all/by-kol",
    getAllByUser: "/v1/admin/booking/single-requests/all/by-user",
    getWorktimeLivestreamMetrics: (worktimeId) =>
      `v1/admin/requests/worktime/livestream-metrics/${encodeURIComponent(
        worktimeId
      )}`,
    getLivestreamMetricsByKol: (kolId) =>
      `v1/admin/requests/worktime/livestream-metrics/kol/${encodeURIComponent(
        kolId
      )}`,
  },

  CONTRACT_PAYMENT: {
    create: "/v1/admin/contracts/payments/create",
  },
  SCHEDULER_ADMIN: {
    // Admin xem free-time của KOL
    kolFreeTime: "/v1/availabilities/free-time", // + /{kolId}
    // Admin xem timeline (booking) của KOL
    kolTimeline: "/v1/availabilities/time-line/kol", // + /{kolId}
    kolTimelineAll: "/v1/availabilities/time-line/kol/all", // list lịch rảnh của tất cả KOL (do dev đặt tên sai)
    adminSchedule: "/v1/availabilities/admin/schedule",
  },
  WORKTIME_ADMIN: {
    create: "/v1/availabilities/admin/worktime/create",

    getByBooking: "/v1/availabilities/admin/booking", // + /{bookingRequestId}
  },
  REFUND: {
    getAll: "/v1/admin/refunds/all",
    getDetail: "/v1/admin/refunds/detail",
    confirm: "/v1/admin/refunds/confirm",
  },
  BLOG: {
    adminGetAll: "v1/admin/blogs/all",
    adminCreate: "v1/admin/blogs/create",
    adminGetDetail: (blogId) =>
      `v1/admin/blogs/detail/${encodeURIComponent(blogId)}`,
    adminUpdate: (blogId) =>
      `v1/admin/blogs/update/${encodeURIComponent(blogId)}`,
    adminDelete: (blogId) =>
      `v1/admin/blogs/delete/${encodeURIComponent(blogId)}`,
    adminThumbnailUpload: (blogId) =>
      `v1/admin/blogs/thumbnail/upload/${encodeURIComponent(blogId)}`,
    adminThumbnailDelete: (blogId) =>
      `v1/admin/blogs/thumbnail/delete/${encodeURIComponent(blogId)}`,
  },

  DASHBOARD: {
    adminSummary: "/v1/admin/dashboard/summary",
  },
  FEEDBACK_ADMIN: {
    // GET /v1/admin/feedbacks/kol/{kolId}?page=&size=&minRating=&fromDate=&toDate=
    getByKol: "/v1/admin/feedbacks/kol", // + /{kolId}
    // PATCH /v1/admin/feedbacks/hide/{feedbackId}
    hide: (feedbackId) =>
      `/v1/admin/feedbacks/hide/${encodeURIComponent(feedbackId)}`,

    // PATCH /v1/admin/feedbacks/show/{feedbackId}
    show: (feedbackId) =>
      `/v1/admin/feedbacks/show/${encodeURIComponent(feedbackId)}`,
  },
};
