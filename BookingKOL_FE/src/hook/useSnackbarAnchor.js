import { useMediaQuery, useTheme } from "@mui/material";

/** Trả về anchorOrigin: >=900px (md↑) => bottom-right, <900px => top-center */
export default function useSnackbarAnchor() {
  const theme = useTheme();
  const upMd = useMediaQuery(theme.breakpoints.up("md")); // md mặc định là 900px
  return upMd
    ? { vertical: "bottom", horizontal: "right" }
    : { vertical: "top", horizontal: "center" };
}
