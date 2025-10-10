import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useSubmitLead } from "./useSubmitLead";

const serviceOptions = [
  "Booking KOL/KOC",
  "Đào tạo Livestream",
  "Setup Livestream Studio",
  "Vận hành Livestream",
  "Affiliate & MCN",
];

const highlightStats = [
  { title: "500+", subtitle: "Chiến dịch đa ngành" },
  { title: "250+", subtitle: "Đối tác KOL/KOC" },
  { title: "24h", subtitle: "Phản hồi & chăm sóc" },
];

const initialLeadState = {
  name: "",
  email: "",
  phone: "",
  service: "",
  message: "",
  agree: false,
};

const initialKolState = {
  fullName: "",
  vertical: "",
  socialLink: "",
  experience: "",
  followerSize: "",
};

const sectionSx = {
  overflow: "hidden",
  // backgroundColor: "#f4f7ff",
  // backgroundImage: `
  //   radial-gradient(circle at 18% 18%, rgba(141, 226, 237, 0.55), rgba(255, 255, 255, 0) 60%),
  //   radial-gradient(circle at 82% 0%, rgba(147, 206, 246, 0.45), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.85) 70%)
  // `,
  // boxShadow: "0 24px 48px rgba(74, 116, 218, 0.14)",
  color: "#0f172a",
  justifyContent: "center",
};

const infoCardSx = {
  backgroundColor: "rgba(255, 255, 255, 0.94)",
  borderRadius: 4,
  p: { xs: 3, md: 4 },
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 24px 40px rgba(74, 116, 218, 0.12)",
  backdropFilter: "blur(6px)",
};

const formWrapperSx = {
  backgroundColor: "rgba(255, 255, 255, 0.97)",
  borderRadius: 4,
  p: { xs: 3, md: 4.5 },
  border: "1px solid rgba(141, 226, 237, 0.35)",
  boxShadow: "0 28px 54px rgba(15, 23, 42, 0.12)",
  display: "flex",
  flexDirection: "column",
  gap: { xs: 2.5, md: 3 },
};

const tabListSx = {
  borderRadius: 3,
  backgroundColor: "rgba(74, 116, 218, 0.08)",
  p: 0.75,
  "& .MuiTabs-flexContainer": { gap: 0.75 },
  "& .MuiTab-root": {
    minHeight: "auto",
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "rgba(15, 23, 42, 0.62)",
  },
  "& .Mui-selected": {
    background: "linear-gradient(135deg, #4a74da, #93cef6)",
    color: "#ffffff !important",
    boxShadow: "0 14px 30px rgba(74, 116, 218, 0.25)",
  },
  "& .MuiTabs-indicator": {
    display: "none",
  },
};

const tabPanelSx = {
  display: "grid",
  gap: { xs: 2.5, md: 3 },
};

const statCardSx = {
  textAlign: "center",
  px: 3,
  py: 2.5,
  borderRadius: 3,
  border: "1px solid rgba(147, 206, 246, 0.45)",
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 16px 32px rgba(74, 116, 218, 0.1)",
};

const contactCardSx = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "flex-start", sm: "center" },
  gap: { xs: 1.5, sm: 2.5 },
  p: { xs: 2.5, md: 3 },
  borderRadius: 3,
  background:
    "linear-gradient(135deg, rgba(147, 206, 246, 0.18), rgba(141, 226, 237, 0.28))",
  border: "1px solid rgba(147, 206, 246, 0.35)",
};

const labelSx = { sx: { color: "rgba(15, 23, 42, 0.62)" } };

const inputFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    color: "#0f172a",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    "& fieldset": { borderColor: "rgba(74, 116, 218, 0.28)" },
    "&:hover fieldset": { borderColor: "#4a74da" },
    "&.Mui-focused fieldset": { borderColor: "#4a74da" },
  },
};

const checkboxSx = {
  color: "rgba(74, 116, 218, 0.6)",
  "&.Mui-checked": { color: "#4a74da" },
};

const primaryButtonSx = {
  mt: 1,
  borderRadius: "14px",
  px: 3,
  py: 1.25,
  fontWeight: 600,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 18px 34px rgba(74, 116, 218, 0.22)",
};

const secondaryButtonSx = {
  mt: 1,
  borderRadius: "14px",
  px: 3,
  py: 1.25,
  fontWeight: 600,
  backgroundImage: "linear-gradient(135deg, #8de2ed, #4a74da)",
  boxShadow: "0px 18px 34px rgba(74, 116, 218, 0.22)",
};

const LeadFormsSection = () => {
  const { submitLead } = useSubmitLead();
  const [leadForm, setLeadForm] = useState(initialLeadState);
  const [kolForm, setKolForm] = useState(initialKolState);
  const [leadErrors, setLeadErrors] = useState({ agree: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [activeForm, setActiveForm] = useState("lead");

  const handleLeadChange = (field) => (event) => {
    const value = field === "agree" ? event.target.checked : event.target.value;
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKolChange = (field) => (event) => {
    setKolForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveForm(newValue);
  };

  const handleLeadSubmit = (event) => {
    event.preventDefault();
    if (!leadForm.agree) {
      setLeadErrors({ agree: true });
      return;
    }
    submitLead({ type: "client", payload: leadForm });
    setLeadForm(initialLeadState);
    setLeadErrors({ agree: false });
    setSnackbar({ open: true, message: "Gửi yêu cầu tư vấn thành công!" });
  };

  const handleKolSubmit = (event) => {
    event.preventDefault();
    submitLead({ type: "kol", payload: kolForm });
    setKolForm(initialKolState);
    setSnackbar({ open: true, message: "Gửi thông tin KOL/KOC thành công!" });
  };

  return (
    <Box component="section" id="lead-forms" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={2}
          sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{
              fontSize: "1rem",
              letterSpacing: 2,
              color: "rgba(15, 23, 42, 0.55)",
            }}
          >
            Lead & CRM Hub
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Kết nối nhanh với đội ngũ Nexus
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(15, 23, 42, 0.68)" }}>
            Chọn form phù hợp để được tư vấn chiến dịch hoặc ứng tuyển trở thành
            KOL/KOC trong mạng lưới của chúng tôi.
          </Typography>
        </Stack>

        <Grid
          container
          spacing={{ xs: 5, md: 7 }}
          alignItems="stretch"
          justifyContent={"center"}
        >
          {/* <Grid item xs={12} md={5}>
            <Stack spacing={{ xs: 3, md: 4 }} sx={{ height: "100%" }}>
              <Box sx={infoCardSx}>
                <Stack spacing={{ xs: 2.5, md: 3 }}>
                  <Chip
                    label="Giải pháp tăng trưởng thương hiệu"
                    sx={
                      {
                        alignSelf: "flex-start",
                        backgroundColor: "rgba(74, 116, 218, 0.1)",
                        color: "#3155c0",
                        fontWeight: 600,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                      }
                    }
                  />
                  <Stack spacing={1.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Đội ngũ tư vấn luôn sẵn sàng đồng hành
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "rgba(15, 23, 42, 0.68)" }}
                    >
                      Nexus hỗ trợ toàn diện từ xây dựng chiến lược, booking KOL/KOC tới vận hành
                      livestream với quy trình khép kín.
                    </Typography>
                  </Stack>
                  <Box sx={contactCardSx}>
                    <Stack spacing={0.5}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "#0f172a" }}
                      >
                        Cần tư vấn nhanh?
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(15, 23, 42, 0.7)" }}
                      >
                        Gọi hotline{" "}
                        <Box
                          component="span"
                          sx={{ fontWeight: 600, color: "#4a74da" }}
                        >
                          0868 999 888
                        </Box>{" "}
                        hoặc để lại thông tin, đội ngũ Nexus sẽ liên hệ trong vòng 24 giờ.
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Grid container spacing={2.5}>
                {highlightStats.map((item) => (
                  <Grid item xs={12} sm={4} key={item.title}>
                    <Box sx={statCardSx}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#4a74da" }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(15, 23, 42, 0.68)" }}
                      >
                        {item.subtitle}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid> */}

          <Grid
            item
            xs={12}
            md={7}
            width={{ xs: "100%", md: "auto", lg: "70%" }}
          >
            <Box sx={formWrapperSx}>
              <Stack spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Chọn nhu cầu của bạn
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(15, 23, 42, 0.62)" }}
                >
                  Điền đầy đủ thông tin để chúng tôi phục vụ bạn tốt nhất. Mọi
                  dữ liệu được bảo mật theo chính sách của Nexus.
                </Typography>
              </Stack>

              <Tabs
                value={activeForm}
                onChange={handleTabChange}
                sx={tabListSx}
                variant="fullWidth"
              >
                <Tab
                  disableRipple
                  label="Doanh nghiệp cần tư vấn"
                  value="lead"
                />
                <Tab disableRipple label="KOL / KOC hợp tác" value="kol" />
              </Tabs>

              {activeForm === "lead" && (
                <Box
                  component="form"
                  onSubmit={handleLeadSubmit}
                  sx={tabPanelSx}
                >
                  <TextField
                    label="Tên"
                    value={leadForm.name}
                    onChange={handleLeadChange("name")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Email"
                    value={leadForm.email}
                    onChange={handleLeadChange("email")}
                    type="email"
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Số điện thoại"
                    value={leadForm.phone}
                    onChange={handleLeadChange("phone")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <FormControl required fullWidth sx={inputFieldSx}>
                    <InputLabel {...labelSx}>Dịch vụ quan tâm</InputLabel>
                    <Select
                      value={leadForm.service}
                      onChange={handleLeadChange("service")}
                      label="Dịch vụ quan tâm"
                    >
                      {serviceOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Ghi chú"
                    value={leadForm.message}
                    onChange={handleLeadChange("message")}
                    multiline
                    minRows={3}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={leadForm.agree}
                        onChange={handleLeadChange("agree")}
                        sx={checkboxSx}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(15, 23, 42, 0.7)" }}
                      >
                        Tôi đã đọc đồng ý điều khoản & chính sách quyền riêng
                        tư, đồng ý nhận thông tin từ Nexus.
                      </Typography>
                    }
                  />
                  {leadErrors.agree && (
                    <FormHelperText sx={{ color: "#d32f2f" }}>
                      Vui lòng đồng ý điều khoản.
                    </FormHelperText>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    sx={primaryButtonSx}
                  >
                    Gửi yêu cầu
                  </Button>
                </Box>
              )}

              {activeForm === "kol" && (
                <Box
                  component="form"
                  onSubmit={handleKolSubmit}
                  sx={tabPanelSx}
                >
                  <TextField
                    label="Họ tên"
                    value={kolForm.fullName}
                    onChange={handleKolChange("fullName")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Lĩnh vực"
                    value={kolForm.vertical}
                    onChange={handleKolChange("vertical")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Liên kết mạng xã hội"
                    value={kolForm.socialLink}
                    onChange={handleKolChange("socialLink")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Kinh nghiệm"
                    value={kolForm.experience}
                    onChange={handleKolChange("experience")}
                    required
                    multiline
                    minRows={3}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Quy mô follower"
                    value={kolForm.followerSize}
                    onChange={handleKolChange("followerSize")}
                    required
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={secondaryButtonSx}
                  >
                    Gửi thông tin
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity="success"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default LeadFormsSection;
