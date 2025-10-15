export const CLIENT_API_PATHS = {
  KOL: {
    getAllAvailable: "/v1/kol-profiles/all-available",
    getDetailByKolId: "/v1/kol-profiles/kol-id",
  },
  BOOKING: {
    createSingle: "/v1/user/booking/request/single",
    holdSlot: "/v1/user/booking/hold-slot",
  },
  COURSE: {
    getAll: "/v1/courses/all",
    getDetail: "/v1/courses",
  },
};
