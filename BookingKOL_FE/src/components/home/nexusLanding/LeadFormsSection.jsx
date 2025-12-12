import React, { useState } from "react";
import {
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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { useSubmitLead } from "./useSubmitLead";
import {
  emailRule,
  phoneRule,
  requiredRule,
} from "../../../utils/formValidators";

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
  note: "",
  agree: false,
};

const initialKolState = {
  name: "",
  major: "",
  platform: "",
  experience: "",
  followerCount: "",
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
  const [kolErrors, setKolErrors] = useState({ agree: false });
  const [leadFieldErrors, setLeadFieldErrors] = useState({});
  const [kolFieldErrors, setKolFieldErrors] = useState({});
  const [activeForm, setActiveForm] = useState("lead");

  const handleLeadChange = (field) => (event) => {
    const value = field === "agree" ? event.target.checked : event.target.value;
    setLeadForm((prev) => ({ ...prev, [field]: value }));
    if (field === "agree" && value) {
      setLeadErrors((prev) => ({ ...prev, agree: false }));
    }
    if (leadFieldErrors[field]) {
      setLeadFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleKolChange = (field) => (event) => {
    const value = field === "agree" ? event.target.checked : event.target.value;
    setKolForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (field === "agree" && value) {
      setKolErrors((prev) => ({ ...prev, agree: false }));
    }
    if (kolFieldErrors[field]) {
      setKolFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveForm(newValue);
  };

  const validateLeadForm = async () => {
    const errors = {};

    const requiredFields = [
      { key: "name", label: "Tên" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Số điện thoại" },
      { key: "service", label: "Dịch vụ quan tâm" },
    ];

    requiredFields.forEach(({ key, label }) => {
      if (!leadForm[key]?.toString().trim()) {
        errors[key] = requiredRule(label).message;
      }
    });

    if (leadForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email)) {
      errors.email = emailRule.message;
    }

    try {
      await phoneRule.validator(null, leadForm.phone);
    } catch (error) {
      errors.phone = error?.message || "Số điện thoại không hợp lệ";
    }

    return errors;
  };

  const validateKolForm = () => {
    const errors = {};

    const requiredFields = [
      { key: "name", label: "Họ tên" },
      { key: "major", label: "Lĩnh vực" },
      { key: "platform", label: "Nền tảng" },
      { key: "experience", label: "Kinh nghiệm" },
      { key: "followerCount", label: "Quy mô follower" },
    ];

    requiredFields.forEach(({ key, label }) => {
      if (!kolForm[key]?.toString().trim()) {
        errors[key] = requiredRule(label).message;
      }
    });

    if (
      kolForm.followerCount?.toString().trim() &&
      Number.isNaN(Number(kolForm.followerCount))
    ) {
      errors.followerCount = "Quy mô follower phải là số";
    }

    return errors;
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();

    const fieldErrors = await validateLeadForm();
    setLeadFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    if (!leadForm.agree) {
      setLeadErrors({ agree: true });
      return;
    }
    try {
      await submitLead({ type: "client", payload: leadForm });
      setLeadForm(initialLeadState);
      setLeadErrors({ agree: false });
      toast.success("Gửi yêu cầu tư vấn thành công!");
    } catch (error) {
      console.error("Failed to submit lead form", error);
    }
  };

  const handleKolSubmit = async (event) => {
    event.preventDefault();

    const fieldErrors = validateKolForm();
    setKolFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    if (!leadForm.agree) {
      setKolErrors({ agree: true });
      return;
    }
    try {
      await submitLead({ type: "kol", payload: kolForm });
      setKolForm(initialKolState);
      setKolErrors({ agree: false });
      toast.success("Gửi thông tin KOL/KOC thành công!");
    } catch (error) {
      console.error("Failed to submit KOL/KOC form", error);
    }
  };

  return (
    <Box component="section" id="lead-forms" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={2}
          sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, color: "#0b4aa2" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Kết nối nhanh với đội ngũ Nexus
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(15, 23, 42, 0.68)" }}>
            Sẵn sàng tăng trưởng qua Livestream Commerce? → Đặt lịch tư vấn cùng
            CEO
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
                    error={!!leadFieldErrors.name}
                    helperText={leadFieldErrors.name}
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
                    error={!!leadFieldErrors.email}
                    helperText={leadFieldErrors.email}
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
                    error={!!leadFieldErrors.phone}
                    helperText={leadFieldErrors.phone}
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
                      error={!!leadFieldErrors.service}
                    >
                      {serviceOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {leadFieldErrors.service && (
                      <FormHelperText error>
                        {leadFieldErrors.service}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <TextField
                    label="Ghi chú"
                    value={leadForm.note}
                    onChange={handleLeadChange("note")}
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
                    value={kolForm.name}
                    onChange={handleKolChange("name")}
                    required
                    error={!!kolFieldErrors.name}
                    helperText={kolFieldErrors.name}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Lĩnh vực"
                    value={kolForm.major}
                    onChange={handleKolChange("major")}
                    required
                    error={!!kolFieldErrors.major}
                    helperText={kolFieldErrors.major}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Nền tảng"
                    value={kolForm.platform}
                    onChange={handleKolChange("platform")}
                    required
                    error={!!kolFieldErrors.platform}
                    helperText={kolFieldErrors.platform}
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
                    error={!!kolFieldErrors.experience}
                    helperText={kolFieldErrors.experience}
                    multiline
                    minRows={3}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    sx={inputFieldSx}
                  />
                  <TextField
                    label="Quy mô follower"
                    value={kolForm.followerCount}
                    onChange={handleKolChange("followerCount")}
                    type="number"
                    required
                    error={!!kolFieldErrors.followerCount}
                    helperText={kolFieldErrors.followerCount}
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
                  {kolErrors.agree && (
                    <FormHelperText sx={{ color: "#d32f2f" }}>
                      Vui lòng đồng ý điều khoản.
                    </FormHelperText>
                  )}
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
      </Container>
    </Box>
  );
};

export default LeadFormsSection;
