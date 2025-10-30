export const CLIENT_API_PATHS = {
  KOL: {
    getAllAvailable: "/v1/kol-profiles/all-available",
    getDetailByKolId: "/v1/kol-profiles/kol-id",
    getDetailByUserId: "/v1/kol-profiles/user-id",
    categoryAdd: "/v1/kol/category/add",
    categoryRemove: "/v1/kol/category/remove",

    updateMyProfile: "/v1/kol/profile/update",
    medias: {
      all: "/v1/kol/medias/all",
      upload: "/v1/kol/medias/upload",
      activate: "/v1/kol/medias/activate",
      deactivate: "/v1/kol/medias/deactivate",
      changeCover: "/v1/kol/cover-image/change",
      avatarChangeExisting: "/v1/kol/avatar/change/existed-image",
      avatarChangeNew: "/v1/kol/avatar/change/new-image",
      delete: (fileId) => `/v1/kol/medias/delete/${fileId}`,
    },
  },
  USER: {
    profile: "/v1/users/profile",
    updateProfile: "/v1/users/profile/update",
  },
  BOOKING: {
    createSingle: "/v1/user/booking/request/single",
    holdSlot: "/v1/user/booking/hold-slot",
    getMySingleRequests: "/v1/user/booking/single-requests/all",
    getMySingleRequestDetail: "/v1/user/booking/single-requests/detail",
    updateMySingleRequest: "/v1/user/booking/single-requests/update",
    cancelMySingleRequest: "/v1/user/booking/single-requests/cancel",
    confirmSingleRequest: "/v1/user/booking/request/single/confirm",
    cancelSingleRequest: "/v1/user/booking/request/single/cancel",
    mySingleRequestsAll: "/v1/kol/booking/single-requests/all",
    mySingleRequestDetail: (requestId) =>
      `/v1/kol/booking/single-requests/detail/${requestId}`,
  },
  COURSE: {
    getAll: "/v1/courses/all",
    getDetail: "/v1/courses",
  },

  SCHEDULE_KOL_FREETIME: {
    kolFreeTime: (kolId) =>
      `/v1/availabilities/free-time/${encodeURIComponent(kolId)}`,
  },

  SCHEDULER: {
    kolFreeTime: (kolId) => `/v1/availabilities/free-time/${kolId}`,
    kolTimeline: (kolId) => `/v1/availabilities/time-line/kol/${kolId}`,
    // ✅ đổi sang dạng có kolId trên path
    kolSchedule: (kolId) => `/v1/availabilities/schedule/${kolId}`,
  },
};
