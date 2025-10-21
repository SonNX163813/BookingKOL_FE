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
    },
  },
  USER: {
    profile: "/v1/users/profile",
    updateProfile: "/v1/users/profile/update",
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
