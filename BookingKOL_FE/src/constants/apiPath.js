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
  },
};
