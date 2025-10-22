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
    adminKolUpdate: "/v1/admin/kol/update",               // + /{kolId}
    adminKolCategoryAdd: "/v1/admin/kol/category/add",    // + /{kolId}?categoryId=...
    adminKolCategoryRemove: "/v1/admin/kol/category/remove", // + /{kolId}?categoryId=...
    adminKolMediasAll: "/v1/admin/kol/medias/all",        // + /{kolId}
    adminKolMediasUpload: "/v1/admin/kol/medias/upload",  // + /{kolId}
    adminKolMediaDelete: "/v1/admin/kol/medias/delete",   // + /{fileId}
    adminKolCoverChange: "/v1/admin/kol/cover-image",     // + /{kolId}?fileId=...
  },
  COURSE: {
    getAllCourse: "/v1/courses/all",
    adminViewDetailCourse: "/v1/courses",
    createCourse: "/v1/admin/course/create",
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
};
