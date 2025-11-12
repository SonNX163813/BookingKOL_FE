export const PAGE_SIZE = 10;

export const PAGE_BACKGROUND = `
  radial-gradient(90% 90% tại 15% 50%, rgba(74, 116, 218, 0.24) 0%, rgba(147, 206, 246, 0.06) 60%, rgba(147, 206, 246, 0) 90%),
  radial-gradient(90% 90% tại 85% 20%, rgba(255, 161, 218, 0.18) 0%, rgba(255, 161, 218, 0) 65%)
`;

export const PRIMARY_BUTTON_SX = {
  textTransform: "none",
  borderRadius: 999,
  px: 3,
  py: 1.2,
  fontWeight: 700,
  color: "#ffffff",
  backgroundImage: "linear-gradient(135deg, #4a74da 0%, #93cef6 100%)",
  boxShadow: "0 18px 30px rgba(74, 116, 218, 0.28)",
  "&:hover": {
    boxShadow: "0 24px 35px rgba(74, 116, 218, 0.35)",
    backgroundImage: "linear-gradient(135deg, #5c82e2 0%, #a6d9f9 100%)",
  },
};

export const IMG_ASPECT = "16 / 9";
