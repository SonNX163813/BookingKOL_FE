import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
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
  agree: false,
};

const LIMITS = {
  LEAD_NAME: 80,
  LEAD_EMAIL: 120,
  LEAD_PHONE: 15,
  LEAD_NOTE: 500,

  KOL_NAME: 80,
  KOL_MAJOR: 80,
  KOL_PLATFORM: 60,
  KOL_EXPERIENCE: 700,

  // ✅ follower tối đa 12 chữ số
  KOL_FOLLOWER_DIGITS: 12,
  KOL_FOLLOWER_MAX: 999999999999,
};

const sectionSx = {
  overflow: "hidden",
  color: "#0f172a",
  justifyContent: "center",
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
  "& .MuiTabs-indicator": { display: "none" },
};

const tabPanelSx = {
  display: "grid",
  gap: { xs: 2.5, md: 3 },
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

const isBlank = (v) => !v?.toString().trim();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// validate nhẹ trên UI (validate chặt ở phoneRule onBlur/submit)
const phoneSoftRegex = /^[0-9+\s-]{8,15}$/;

// ✅ format dấu chấm hàng nghìn (vi-VN)
const formatThousandsVi = (digits) => {
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return digits;
  return n.toLocaleString("vi-VN"); // 1.234.567
};

const LeadFormsSection = () => {
  const { submitLead } = useSubmitLead();

  const [activeForm, setActiveForm] = useState("lead");

  const [leadForm, setLeadForm] = useState(initialLeadState);
  const [kolForm, setKolForm] = useState(initialKolState);

  const [leadTouched, setLeadTouched] = useState({});
  const [kolTouched, setKolTouched] = useState({});

  const [leadFieldErrors, setLeadFieldErrors] = useState({});
  const [kolFieldErrors, setKolFieldErrors] = useState({});

  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isSubmittingKol, setIsSubmittingKol] = useState(false);

  // ✅ để tránh nhảy con trỏ: focus thì show số thuần, blur thì show format
  const [isFollowerFocused, setIsFollowerFocused] = useState(false);

  const isBusy = useMemo(
    () => isSubmittingLead || isSubmittingKol,
    [isSubmittingLead, isSubmittingKol]
  );

  // ✅ helper khi chạm max
  const leadNoteHelper = useMemo(() => {
    const len = (leadForm.note || "").length;
    if (len >= LIMITS.LEAD_NOTE)
      return `Đã đạt tối đa ${LIMITS.LEAD_NOTE} ký tự.`;
    return "";
  }, [leadForm.note]);

  const kolExpHelper = useMemo(() => {
    const len = (kolForm.experience || "").length;
    if (len >= LIMITS.KOL_EXPERIENCE)
      return `Đã đạt tối đa ${LIMITS.KOL_EXPERIENCE} ký tự.`;
    return "";
  }, [kolForm.experience]);

  const kolFollowerHelper = useMemo(() => {
    const len = (kolForm.followerCount || "").toString().length;
    if (len >= LIMITS.KOL_FOLLOWER_DIGITS)
      return `Đã đạt tối đa ${LIMITS.KOL_FOLLOWER_DIGITS} chữ số.`;
    return "";
  }, [kolForm.followerCount]);

  // ✅ thông báo dưới form (gần nút submit)
  const kolFormMaxNotice = useMemo(() => {
    if (
      (kolForm.followerCount || "").toString().length >=
      LIMITS.KOL_FOLLOWER_DIGITS
    ) {
      return `Quy mô follower tối đa ${LIMITS.KOL_FOLLOWER_DIGITS} chữ số.`;
    }
    if ((kolForm.experience || "").length >= LIMITS.KOL_EXPERIENCE) {
      return `Kinh nghiệm tối đa ${LIMITS.KOL_EXPERIENCE} ký tự.`;
    }
    return "";
  }, [kolForm.followerCount, kolForm.experience]);

  const leadFormMaxNotice = useMemo(() => {
    if ((leadForm.note || "").length >= LIMITS.LEAD_NOTE) {
      return `Ghi chú tối đa ${LIMITS.LEAD_NOTE} ký tự.`;
    }
    return "";
  }, [leadForm.note]);

  const validateLeadFieldSync = (field, value) => {
    const v = value?.toString() ?? "";

    if (field === "name") {
      if (isBlank(v)) return requiredRule("Tên").message;
      if (v.length > LIMITS.LEAD_NAME)
        return `Tên tối đa ${LIMITS.LEAD_NAME} ký tự`;
    }

    if (field === "email") {
      if (isBlank(v)) return requiredRule("Email").message;
      if (v.length > LIMITS.LEAD_EMAIL)
        return `Email tối đa ${LIMITS.LEAD_EMAIL} ký tự`;
      if (!emailRegex.test(v)) return emailRule.message;
    }

    if (field === "phone") {
      if (isBlank(v)) return requiredRule("Số điện thoại").message;
      if (v.length > LIMITS.LEAD_PHONE)
        return `Số điện thoại tối đa ${LIMITS.LEAD_PHONE} ký tự`;
      if (!phoneSoftRegex.test(v)) return "Số điện thoại không đúng định dạng";
    }

    if (field === "service") {
      if (isBlank(v)) return requiredRule("Dịch vụ quan tâm").message;
    }

    if (field === "note") {
      if (v.length > LIMITS.LEAD_NOTE)
        return `Ghi chú tối đa ${LIMITS.LEAD_NOTE} ký tự`;
    }

    if (field === "agree") {
      if (!leadForm.agree) return "Vui lòng đồng ý điều khoản.";
    }

    return "";
  };

  const validateKolFieldSync = (field, value) => {
    const v = value?.toString() ?? "";

    if (field === "name") {
      if (isBlank(v)) return requiredRule("Họ tên").message;
      if (v.length > LIMITS.KOL_NAME)
        return `Họ tên tối đa ${LIMITS.KOL_NAME} ký tự`;
    }

    if (field === "major") {
      if (isBlank(v)) return requiredRule("Lĩnh vực").message;
      if (v.length > LIMITS.KOL_MAJOR)
        return `Lĩnh vực tối đa ${LIMITS.KOL_MAJOR} ký tự`;
    }

    if (field === "platform") {
      if (isBlank(v)) return requiredRule("Nền tảng").message;
      if (v.length > LIMITS.KOL_PLATFORM)
        return `Nền tảng tối đa ${LIMITS.KOL_PLATFORM} ký tự`;
    }

    if (field === "experience") {
      if (isBlank(v)) return requiredRule("Kinh nghiệm").message;
      if (v.length > LIMITS.KOL_EXPERIENCE)
        return `Kinh nghiệm tối đa ${LIMITS.KOL_EXPERIENCE} ký tự`;
    }

    if (field === "followerCount") {
      if (isBlank(v)) return requiredRule("Quy mô follower").message;

      if (v.length > LIMITS.KOL_FOLLOWER_DIGITS)
        return `Quy mô follower tối đa ${LIMITS.KOL_FOLLOWER_DIGITS} chữ số`;

      const n = Number(v);
      if (Number.isNaN(n)) return "Quy mô follower phải là số";
      if (n < 0) return "Quy mô follower phải >= 0";
      if (n > LIMITS.KOL_FOLLOWER_MAX)
        return `Quy mô follower tối đa ${LIMITS.KOL_FOLLOWER_MAX.toLocaleString(
          "vi-VN"
        )}`;
    }

    if (field === "agree") {
      if (!kolForm.agree) return "Vui lòng đồng ý điều khoản.";
    }

    return "";
  };

  const validateLeadForm = async () => {
    const errors = {};

    ["name", "email", "phone", "service", "note"].forEach((key) => {
      const msg = validateLeadFieldSync(key, leadForm[key]);
      if (msg) errors[key] = msg;
    });

    // strict phone validate (async)
    if (!errors.phone && leadForm.phone?.toString().trim()) {
      try {
        await phoneRule.validator(null, leadForm.phone);
      } catch (error) {
        errors.phone = error?.message || "Số điện thoại không hợp lệ";
      }
    }

    if (!leadForm.agree) errors.agree = "Vui lòng đồng ý điều khoản.";

    return errors;
  };

  const validateKolForm = () => {
    const errors = {};
    ["name", "major", "platform", "experience", "followerCount"].forEach(
      (key) => {
        const msg = validateKolFieldSync(key, kolForm[key]);
        if (msg) errors[key] = msg;
      }
    );

    if (!kolForm.agree) errors.agree = "Vui lòng đồng ý điều khoản.";

    return errors;
  };

  const touchAllLead = () => {
    setLeadTouched({
      name: true,
      email: true,
      phone: true,
      service: true,
      note: true,
      agree: true,
    });
  };

  const touchAllKol = () => {
    setKolTouched({
      name: true,
      major: true,
      platform: true,
      experience: true,
      followerCount: true,
      agree: true,
    });
  };

  const handleLeadChange = (field) => async (event) => {
    const value = field === "agree" ? event.target.checked : event.target.value;

    setLeadForm((prev) => ({ ...prev, [field]: value }));

    setLeadFieldErrors((prev) => {
      if (!leadTouched[field]) return prev;
      const msg =
        field === "agree"
          ? !value
            ? "Vui lòng đồng ý điều khoản."
            : ""
          : validateLeadFieldSync(field, value);
      return { ...prev, [field]: msg };
    });

    if (field === "phone" && leadTouched.phone && value?.toString().trim()) {
      try {
        await phoneRule.validator(null, value);
        setLeadFieldErrors((prev) => ({ ...prev, phone: "" }));
      } catch (e) {
        setLeadFieldErrors((prev) => ({
          ...prev,
          phone: e?.message || "Số điện thoại không hợp lệ",
        }));
      }
    }
  };

  const handleKolChange = (field) => (event) => {
    let value = field === "agree" ? event.target.checked : event.target.value;

    // ✅ follower: cho phép paste có dấu chấm, cuối cùng strip về số thuần
    if (field === "followerCount") {
      value = (value ?? "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, LIMITS.KOL_FOLLOWER_DIGITS);
    }

    setKolForm((prev) => ({ ...prev, [field]: value }));

    setKolFieldErrors((prev) => {
      if (!kolTouched[field]) return prev;
      const msg =
        field === "agree"
          ? !value
            ? "Vui lòng đồng ý điều khoản."
            : ""
          : validateKolFieldSync(field, value);
      return { ...prev, [field]: msg };
    });
  };

  const handleLeadBlur = (field) => async () => {
    setLeadTouched((prev) => ({ ...prev, [field]: true }));

    let msg = validateLeadFieldSync(field, leadForm[field]);

    if (field === "phone" && leadForm.phone?.toString().trim()) {
      try {
        await phoneRule.validator(null, leadForm.phone);
        msg = "";
      } catch (e) {
        msg = e?.message || "Số điện thoại không hợp lệ";
      }
    }

    setLeadFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleKolBlur = (field) => () => {
    setKolTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateKolFieldSync(field, kolForm[field]);
    setKolFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleTabChange = (_, newValue) => {
    if (isBusy) return;
    setActiveForm(newValue);
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingLead) return;

    touchAllLead();

    const fieldErrors = await validateLeadForm();
    setLeadFieldErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    try {
      setIsSubmittingLead(true);
      await submitLead({ type: "client", payload: leadForm });

      setLeadForm(initialLeadState);
      setLeadTouched({});
      setLeadFieldErrors({});

      toast.success("Gửi yêu cầu tư vấn thành công!");
    } catch (error) {
      console.error("Failed to submit lead form", error);
      toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleKolSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingKol) return;

    touchAllKol();

    const fieldErrors = validateKolForm();
    setKolFieldErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    try {
      setIsSubmittingKol(true);
      await submitLead({ type: "kol", payload: kolForm });

      setKolForm(initialKolState);
      setKolTouched({});
      setKolFieldErrors({});

      toast.success("Gửi thông tin KOL/KOC thành công!");
    } catch (error) {
      console.error("Failed to submit KOL/KOC form", error);
      toast.error("Gửi thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmittingKol(false);
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
                  disabled={isBusy}
                />
                <Tab
                  disableRipple
                  label="KOL / KOC hợp tác"
                  value="kol"
                  disabled={isBusy}
                />
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
                    onBlur={handleLeadBlur("name")}
                    error={!!leadFieldErrors.name}
                    helperText={leadFieldErrors.name || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.LEAD_NAME }}
                    sx={inputFieldSx}
                  />

                  <TextField
                    label="Email"
                    value={leadForm.email}
                    onChange={handleLeadChange("email")}
                    onBlur={handleLeadBlur("email")}
                    type="email"
                    error={!!leadFieldErrors.email}
                    helperText={leadFieldErrors.email || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.LEAD_EMAIL }}
                    sx={inputFieldSx}
                  />

                  <TextField
                    label="Số điện thoại"
                    value={leadForm.phone}
                    onChange={handleLeadChange("phone")}
                    onBlur={handleLeadBlur("phone")}
                    error={!!leadFieldErrors.phone}
                    helperText={leadFieldErrors.phone || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.LEAD_PHONE }}
                    sx={inputFieldSx}
                  />

                  <FormControl
                    required
                    fullWidth
                    sx={inputFieldSx}
                    error={!!leadFieldErrors.service}
                  >
                    <InputLabel {...labelSx}>Dịch vụ quan tâm</InputLabel>
                    <Select
                      value={leadForm.service}
                      onChange={handleLeadChange("service")}
                      onBlur={handleLeadBlur("service")}
                      label="Dịch vụ quan tâm"
                    >
                      {serviceOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {leadFieldErrors.service || " "}
                    </FormHelperText>
                  </FormControl>

                  <TextField
                    label="Ghi chú"
                    value={leadForm.note}
                    onChange={handleLeadChange("note")}
                    onBlur={handleLeadBlur("note")}
                    multiline
                    minRows={3}
                    error={!!leadFieldErrors.note}
                    helperText={leadFieldErrors.note || leadNoteHelper || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.LEAD_NOTE }}
                    sx={inputFieldSx}
                  />

                  <Box>
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
                    {leadFieldErrors.agree && (
                      <FormHelperText sx={{ color: "#d32f2f", mt: 0.5 }}>
                        {leadFieldErrors.agree}
                      </FormHelperText>
                    )}
                  </Box>

                  {leadFormMaxNotice && (
                    <FormHelperText
                      sx={{ mt: -0.5, color: "rgba(15, 23, 42, 0.65)" }}
                    >
                      {leadFormMaxNotice}
                    </FormHelperText>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    sx={primaryButtonSx}
                    disabled={isSubmittingLead}
                  >
                    {isSubmittingLead ? "Đang gửi..." : "Gửi yêu cầu"}
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
                    onBlur={handleKolBlur("name")}
                    error={!!kolFieldErrors.name}
                    helperText={kolFieldErrors.name || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.KOL_NAME }}
                    sx={inputFieldSx}
                  />

                  <TextField
                    label="Lĩnh vực"
                    value={kolForm.major}
                    onChange={handleKolChange("major")}
                    onBlur={handleKolBlur("major")}
                    error={!!kolFieldErrors.major}
                    helperText={kolFieldErrors.major || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.KOL_MAJOR }}
                    sx={inputFieldSx}
                  />

                  <TextField
                    label="Nền tảng"
                    value={kolForm.platform}
                    onChange={handleKolChange("platform")}
                    onBlur={handleKolBlur("platform")}
                    error={!!kolFieldErrors.platform}
                    helperText={kolFieldErrors.platform || " "}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.KOL_PLATFORM }}
                    sx={inputFieldSx}
                  />

                  <TextField
                    label="Kinh nghiệm"
                    value={kolForm.experience}
                    onChange={handleKolChange("experience")}
                    onBlur={handleKolBlur("experience")}
                    error={!!kolFieldErrors.experience}
                    helperText={
                      kolFieldErrors.experience || kolExpHelper || " "
                    }
                    multiline
                    minRows={3}
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{ maxLength: LIMITS.KOL_EXPERIENCE }}
                    sx={inputFieldSx}
                  />

                  {/* ✅ follower: hiển thị có dấu chấm khi blur */}
                  <TextField
                    label="Quy mô follower"
                    value={
                      isFollowerFocused
                        ? kolForm.followerCount
                        : formatThousandsVi(kolForm.followerCount)
                    }
                    onChange={handleKolChange("followerCount")}
                    onFocus={() => setIsFollowerFocused(true)}
                    onBlur={() => {
                      setIsFollowerFocused(false);
                      handleKolBlur("followerCount")();
                    }}
                    type="text"
                    required
                    error={!!kolFieldErrors.followerCount}
                    helperText={
                      kolFieldErrors.followerCount || kolFollowerHelper || " "
                    }
                    variant="outlined"
                    fullWidth
                    InputLabelProps={labelSx}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-9.]*",
                      // nới nhẹ vì có thể paste số có dấu chấm, onChange sẽ strip
                      maxLength: LIMITS.KOL_FOLLOWER_DIGITS + 4,
                    }}
                    sx={inputFieldSx}
                  />

                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={kolForm.agree}
                          onChange={handleKolChange("agree")}
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
                    {kolFieldErrors.agree && (
                      <FormHelperText sx={{ color: "#d32f2f", mt: 0.5 }}>
                        {kolFieldErrors.agree}
                      </FormHelperText>
                    )}
                  </Box>

                  {kolFormMaxNotice && (
                    <FormHelperText
                      sx={{ mt: -0.5, color: "rgba(15, 23, 42, 0.65)" }}
                    >
                      {kolFormMaxNotice}
                    </FormHelperText>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    sx={secondaryButtonSx}
                    disabled={isSubmittingKol}
                  >
                    {isSubmittingKol ? "Đang gửi..." : "Gửi thông tin"}
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
