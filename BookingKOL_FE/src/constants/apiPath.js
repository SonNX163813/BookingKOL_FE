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
    getAllCourse: "/v1/courses/all",
    adminViewDetailCourse: "/v1/courses",
    createCourse: "/v1/admin/course/create",
    adminCourseUpdate: "/v1/admin/course/update", // + /{courseId}
    adminCourseMediasRemove: "/v1/admin/course/medias/remove", // + /{courseId}
    adminCourseCoverImageSet: "/v1/admin/course/cover-image/set", // + /{courseId}?fileId=...
    adminCourseMediasUpload: "/v1/admin/course/medias/upload", // + /{courseId}
  },
  CATEGORY: {
    getAllCategory: "/v1/categories",
    getCategoryById: "/v1/categories",
    createCategory: "/v1/categories",
    deleteCategory: "/v1/categories",
    patchCategory: "/v1/categories",
  },
  BOOKINGPACKAGE: {
    createBookingPackage: "/v1/bookings/packages",
    getHistoryBookingPackage: "/v1/user/bookings",
  },
  BOOKING_REQUEST: {
    getAll: "/v1/admin/booking/single-requests/all",
    getDetail: "/v1/admin/booking/single-requests/detail",
    getAllByKol: "/v1/admin/booking/single-requests/all/by-kol",
  },
  SCHEDULER_ADMIN: {
    // Admin xem free-time của KOL
    kolFreeTime: "/v1/availabilities/free-time", // + /{kolId}
    // Admin xem timeline (booking) của KOL
    kolTimeline: "/v1/availabilities/time-line/kol", // + /{kolId}
  },
  REFUND: {
    getAll: "/v1/admin/refunds/all",
  },
};
