import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { motion } from "framer-motion";
import dayjs from "dayjs";

import hotkolimg from "../../../assets/hotkol.png";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import {
  getMyUserProfile,
  updateMyUserProfile,
} from "../../../services/user/UserService";
import { USER_PROFILE_COPY, USER_PROFILE_SECTIONS } from "./userProfileCopy";

const MotionBox = motion(Box);

const pageOverlay =
  "radial-gradient(55% 55% at 90% 0%, rgba(147, 206, 246, 0.25) 0%, rgba(147, 206, 246, 0) 70%), radial-gradient(60% 60% at 0% 100%, rgba(255, 161, 218, 0.2) 0%, rgba(88, 43, 175, 0) 70%)";
const cardGradient =
  "linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(147, 206, 246, 0.28) 55%, rgba(88, 43, 175, 0.16) 100%)";
const borderColor = "rgba(74, 116, 218, 0.18)";
const textPrimary = "#2f3c8c";
const textSecondary = "rgba(47, 60, 140, 0.72)";
const sectionCardStyles = {
  borderRadius: "22px",
  backgroundColor: "rgba(248, 249, 255, 0.75)",
  border: "1px solid rgba(74, 116, 218, 0.12)",
  boxShadow:
    "0 8px 18px rgba(74, 116, 218, 0.12), 0 3px 10px rgba(147, 206, 246, 0.14)",
  px: { xs: 2.5, md: 3 },
  py: { xs: 2.25, md: 2.75 },
};

const normalizeGender = (value) => {
  if (value === undefined || value === null) return "";
  const normalized = String(value).trim().toLowerCase();
  if (["male", "nam", "m"].includes(normalized)) return "Male";
  if (["female", "nu", "f"].includes(normalized)) return "Female";
  if (["other", "khac", "o"].includes(normalized)) return "Other";
  return normalized;
};

const fallbackText = USER_PROFILE_COPY.fallbackText;
const { hero, buttons, snackbar } = USER_PROFILE_COPY;

const deriveFormValues = (profile) => {
  if (!profile) {
    return {
      fullName: "",
      email: "",
      phoneNumber: "",
      brandName: "",
      address: "",
      gender: "",
      country: "",
      dateOfBirth: "",
      introduction: "",
    };
  }

  const getFirst = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return String(value);
      }
    }
    return "";
  };

  return {
    fullName: getFirst(profile.fullName, profile.displayName, profile.userName),
    email: getFirst(profile.email, profile.mail, profile.username),
    phoneNumber: getFirst(
      profile.phone,
      profile.phoneNumber,
      profile.soDienThoai,
      profile.contactNumber
    ),
    brandName: getFirst(profile.brandName, profile.companyName, profile.brand),
    address: getFirst(profile.address, profile.location, profile.cityAddress),
    gender: normalizeGender(
      getFirst(profile.gender, profile.sex, profile.gioiTinh)
    ),
    country: getFirst(profile.country, profile.quocGia, profile.nationality),
    dateOfBirth: getFirst(profile.dateOfBirth, profile.dob, profile.ngaySinh),
    introduction: getFirst(
      profile.introduction,
      profile.bio,
      profile.about,
      profile.description
    ),
  };
};

const sanitizeString = (value) =>
  typeof value === "string" ? value.trim() : value ?? "";

const buildUserProfileUpdatePayload = (values = {}) => {
  const pick = (key) => sanitizeString(values[key] ?? "");
  const payload = {
    fullName: pick("fullName"),
    brandName: pick("brandName"),
    gender: normalizeGender(pick("gender")),
    phone: pick("phoneNumber"),
    address: pick("address"),
    introduction: pick("introduction"),
    country: pick("country"),
  };

  const dateValue = sanitizeString(values.dateOfBirth ?? "");
  if (dateValue) {
    const parsed = dayjs(dateValue);
    payload.dateOfBirth = parsed.isValid()
      ? parsed.format("YYYY-MM-DD")
      : dateValue;
  } else {
    payload.dateOfBirth = "";
  }

  return payload;
};

const mergeProfileWithUpdate = (previousProfile, payload, updatedProfile) => {
  const base = previousProfile ? { ...previousProfile } : {};
  if (updatedProfile && typeof updatedProfile === "object") {
    return { ...base, ...updatedProfile };
  }

  return {
    ...base,
    fullName: payload.fullName,
    brandName: payload.brandName,
    gender: payload.gender,
    phone: payload.phone,
    address: payload.address,
    introduction: payload.introduction,
    country: payload.country,
    dateOfBirth: payload.dateOfBirth,
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const formatDateDisplay = (value) => {
  if (!value) return fallbackText;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format("DD/MM/YYYY");
};

const isSignalAborted = (signal) => Boolean(signal && signal.aborted);

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState(deriveFormValues(null));
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  const fetchProfile = useCallback(
    async ({ signal, showGlobalLoading = true } = {}) => {
      if (showGlobalLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const data = await getMyUserProfile({ signal });
        const abortedAfterFetch = isSignalAborted(signal);
        if (!abortedAfterFetch) {
          setProfile(data ?? null);
          setFormValues(deriveFormValues(data));
          setError(null);
        }
      } catch (err) {
        const abortedOrCanceled =
          isSignalAborted(signal) || err?.code === "ERR_CANCELED";
        if (!abortedOrCanceled) {
          const message =
            err?.response?.data?.message ??
            message ??
            "Khong the tai du lieu ho so. Vui long thu lai.";
          setError(message);
          setShowErrorSnackbar(true);
        }
      } finally {
        const abortedInFinally = isSignalAborted(signal);
        if (!abortedInFinally) {
          if (showGlobalLoading) {
            setLoading(false);
          } else {
            setIsRefreshing(false);
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile({ signal: controller.signal, showGlobalLoading: true });
    return () => controller.abort();
  }, [fetchProfile]);

  useEffect(() => {
    if (!editing) {
      setFormValues(deriveFormValues(profile));
    }
  }, [profile, editing]);

  const handleRefresh = () => {
    if (loading || isRefreshing || editing) return;
    fetchProfile({ showGlobalLoading: false });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    if (saving) return;
    if (editing) {
      handleCancelEdit();
    } else {
      setEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (saving) return;
    setFormValues(deriveFormValues(profile));
    setEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    try {
      const payload = buildUserProfileUpdatePayload(formValues);
      const updatedProfile = await updateMyUserProfile({ data: payload });
      const nextProfile = mergeProfileWithUpdate(
        profile,
        payload,
        updatedProfile
      );
      setProfile(nextProfile);
      setFormValues(deriveFormValues(nextProfile));
      setEditing(false);
      setError(null);
      setShowErrorSnackbar(false);
      await fetchProfile({ showGlobalLoading: false });
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Khong the cap nhat ho so. Vui long thu lai.";
      setError(message);
      setShowErrorSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => setShowErrorSnackbar(false);
  const handleRetry = () => {
    setShowErrorSnackbar(false);
    fetchProfile({ showGlobalLoading: false });
  };

  const normalizedProfile = useMemo(() => profile ?? {}, [profile]);

  const fullName =
    formValues.fullName ||
    normalizedProfile.fullName ||
    normalizedProfile.displayName ||
    hero.defaultName;

  const email =
    formValues.email ||
    normalizedProfile.email ||
    normalizedProfile.mail ||
    normalizedProfile.username ||
    "";

  const phoneNumber =
    formValues.phoneNumber ||
    normalizedProfile.phone ||
    normalizedProfile.phoneNumber ||
    "";

  const brandName =
    formValues.brandName ||
    normalizedProfile.brandName ||
    normalizedProfile.companyName ||
    "";

  const introductionPreview = useMemo(() => {
    const text =
      formValues.introduction || normalizedProfile.introduction || "";
    if (!text) {
      return hero.introductionFallback;
    }
    return text.length > 220 ? `${text.slice(0, 220).trimEnd()}...` : text;
  }, [
    formValues.introduction,
    hero.introductionFallback,
    normalizedProfile.introduction,
  ]);

  const avatarSrc =
    normalizedProfile.avatarUrl ??
    normalizedProfile.avatar ??
    normalizedProfile.profileImage ??
    normalizedProfile.imageUrl ??
    hotkolimg;

  const [contactSection = {}, personalSection = {}, bioSection = {}] =
    USER_PROFILE_SECTIONS;
  const [
    contactFullNameField,
    contactBrandNameField,
    contactEmailField,
    contactPhoneField,
    contactAddressField,
  ] = contactSection?.fields ?? [];
  const [personalGenderField, personalDateOfBirthField, personalCountryField] =
    personalSection?.fields ?? [];
  const [bioIntroductionField] = bioSection?.fields ?? [];

  const renderField = (fieldConfig, gridProps = {}) => {
    if (!fieldConfig) return null;

    const rawValue = fieldConfig.name ? formValues[fieldConfig.name] ?? "" : "";
    const value =
      fieldConfig.type === "date" ? toDateInputValue(rawValue) : rawValue;
    const StartIcon = fieldConfig.icon;
    const disabled =
      loading || saving || !editing || Boolean(fieldConfig.readOnly);
    const helperText =
      !editing && !rawValue
        ? fallbackText
        : fieldConfig.helperText ?? undefined;
    const gridDefaults = {
      xs: 12,
      md: fieldConfig.fullWidthRow || fieldConfig.multiline ? 12 : 6,
    };
    const { sx: gridSx, ...restGridProps } = gridProps;
    const gridSxArray = Array.isArray(gridSx) ? gridSx : gridSx ? [gridSx] : [];

    return (
      <Grid
        item
        key={fieldConfig.name}
        {...gridDefaults}
        {...restGridProps}
        sx={[{ display: "flex", width: "100%" }, ...gridSxArray]}
      >
        <TextField
          fullWidth
          label={fieldConfig.label}
          name={fieldConfig.name}
          type={fieldConfig.type || "text"}
          value={value}
          onChange={handleChange}
          placeholder={fieldConfig.placeholder}
          disabled={disabled}
          required={Boolean(fieldConfig.required)}
          multiline={Boolean(fieldConfig.multiline)}
          minRows={fieldConfig.minRows}
          select={Boolean(fieldConfig.select)}
          InputLabelProps={
            fieldConfig.type === "date" ? { shrink: true } : undefined
          }
          InputProps={{
            startAdornment: StartIcon ? (
              <InputAdornment position="start">
                <StartIcon
                  sx={{
                    fontSize: 20,
                    color: disabled ? "rgba(47, 60, 140, 0.45)" : "#4a74da",
                  }}
                />
              </InputAdornment>
            ) : undefined,
          }}
          SelectProps={
            fieldConfig.select
              ? {
                  displayEmpty: true,
                }
              : undefined
          }
          helperText={helperText}
          FormHelperTextProps={{
            sx: {
              color: textSecondary,
              fontWeight: 500,
              mt: 1,
            },
          }}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            "& .MuiOutlinedInput-root": {
              width: "100%",
              borderRadius: "16px",
              backgroundColor: disabled
                ? "rgba(243, 246, 255, 0.65)"
                : "rgba(255, 255, 255, 0.96)",
              transition: "all 0.2s ease",
              height: fieldConfig.multiline ? "auto" : "60px",
              minHeight: fieldConfig.multiline ? "120px" : "60px",
              alignItems: fieldConfig.multiline ? "flex-start" : "center",
              "& textarea": {
                minHeight: fieldConfig.multiline ? "80px" : "auto",
              },
              "& fieldset": {
                borderColor: "rgba(74, 116, 218, 0.28)",
              },
              "&:hover fieldset": {
                borderColor: "#4a74da",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#4a74da",
                borderWidth: 2,
                boxShadow: "0 0 0 3px rgba(74, 116, 218, 0.15)",
              },
            },
            "& .MuiInputBase-input": {
              py: fieldConfig.multiline ? 1.5 : 1.2,
            },
          }}
        >
          {fieldConfig.select &&
            fieldConfig.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
        </TextField>
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4ff",
        backgroundImage: pageOverlay,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        py: { xs: 5, md: 9 },
      }}
    >
      <Container maxWidth="md">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "30px",
            background: cardGradient,
            border: `1px solid ${borderColor}`,
            boxShadow:
              "0 16px 40px rgba(74, 116, 218, 0.18), 0 30px 60px rgba(147, 206, 246, 0.22)",
            p: { xs: 3, md: 4.5 },
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: pageOverlay,
              opacity: 0.65,
              pointerEvents: "none",
            }}
          />

          <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 4 }}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Avatar
                src={avatarSrc}
                alt={fullName}
                sx={{
                  width: { xs: 96, md: 120 },
                  height: { xs: 96, md: 120 },
                  border: "3px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 18px 36px rgba(74, 116, 218, 0.28)",
                }}
              />
              <Stack spacing={1.5} flex={1}>
                {loading ? (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        color: textPrimary,
                        fontWeight: 700,
                        opacity: 0.65,
                      }}
                    >
                      {hero.loadingTitle}
                    </Typography>
                    <Typography sx={{ color: textSecondary }}>
                      {hero.loadingSubtitle}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        color: textPrimary,
                        fontWeight: 700,
                        fontSize: { xs: 26, md: 30 },
                      }}
                    >
                      {fullName}
                    </Typography>
                    <Typography sx={{ color: textSecondary, lineHeight: 1.6 }}>
                      {introductionPreview}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "column" }}
                      spacing={1.2}
                      flexWrap="wrap"
                      sx={{ color: textSecondary }}
                    >
                      <Typography variant="body2">
                        Email: {email || fallbackText}
                      </Typography>
                      <Typography variant="body2">
                        Số điện thoại: {phoneNumber || fallbackText}
                      </Typography>
                      <Typography variant="body2">
                        Thương hiệu: {brandName || fallbackText}
                      </Typography>
                    </Stack>
                  </>
                )}
              </Stack>
              <Stack
                direction="row"
                spacing={1.25}
                alignSelf={{ xs: "stretch", md: "flex-start" }}
              >
                <Button
                  variant="outlined"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing || editing}
                  startIcon={
                    isRefreshing ? (
                      <CircularProgress
                        size={18}
                        thickness={4}
                        color="inherit"
                      />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "14px",
                    px: 2.5,
                    color: textPrimary,
                    borderColor: "rgba(74, 116, 218, 0.45)",
                    "&:hover": {
                      borderColor: "rgba(88, 43, 175, 0.6)",
                      backgroundColor: "rgba(74, 116, 218, 0.08)",
                    },
                    "&:disabled": {
                      color: "rgba(47, 60, 140, 0.38)",
                      borderColor: "rgba(47, 60, 140, 0.16)",
                    },
                  }}
                >
                  {buttons.refresh}
                </Button>
                <Button
                  variant={editing ? "contained" : "outlined"}
                  color="primary"
                  onClick={handleToggleEdit}
                  startIcon={<EditRoundedIcon />}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "14px",
                    px: 2.5,
                  }}
                >
                  {editing ? buttons.editing : buttons.edit}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: "rgba(74, 116, 218, 0.18)" }} />

            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ position: "relative" }}
            >
              <Stack spacing={3.25}>
                <Stack spacing={2.25} sx={sectionCardStyles}>
                  <Stack spacing={0.75}>
                    <Typography
                      variant="h6"
                      sx={{ color: textPrimary, fontWeight: 700 }}
                    >
                      {contactSection?.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: textSecondary, maxWidth: 620 }}
                    >
                      {contactSection?.description}
                    </Typography>
                  </Stack>
                  <Grid container spacing={2.5} alignItems="stretch">
                    {renderField(contactFullNameField)}
                    {renderField(contactBrandNameField)}
                    {renderField(contactEmailField)}
                    {renderField(contactPhoneField)}
                    {renderField(contactAddressField)}
                  </Grid>
                </Stack>

                <Stack spacing={2.25} sx={sectionCardStyles}>
                  <Stack spacing={0.75}>
                    <Typography
                      variant="h6"
                      sx={{ color: textPrimary, fontWeight: 700 }}
                    >
                      {personalSection?.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: textSecondary, maxWidth: 620 }}
                    >
                      {personalSection?.description}
                    </Typography>
                  </Stack>
                  <Grid container spacing={2.5} alignItems="stretch">
                    {renderField(personalGenderField)}
                    {renderField(personalDateOfBirthField)}
                    {renderField(personalCountryField)}
                  </Grid>
                </Stack>

                <Stack spacing={2.25} sx={sectionCardStyles}>
                  <Stack spacing={0.75}>
                    <Typography
                      variant="h6"
                      sx={{ color: textPrimary, fontWeight: 700 }}
                    >
                      {bioSection?.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: textSecondary, maxWidth: 620 }}
                    >
                      {bioSection?.description}
                    </Typography>
                  </Stack>
                  <Grid container spacing={2.5} alignItems="stretch">
                    {renderField(bioIntroductionField)}
                  </Grid>
                </Stack>
              </Stack>

              {editing && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="flex-end"
                  sx={{ mt: 3.5 }}
                >
                  <Button
                    type="button"
                    variant="text"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    startIcon={<CloseRoundedIcon />}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {buttons.cancel}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={18} thickness={4} />
                      ) : (
                        <SaveRoundedIcon />
                      )
                    }
                    disabled={saving}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "14px",
                      px: 3,
                    }}
                  >
                    {buttons.save}
                  </Button>
                </Stack>
              )}
            </Box>
          </Stack>
        </MotionBox>
      </Container>

      {/* <AppSnackbar
        open={showErrorSnackbar}
        onClose={handleCloseSnackbar}
        severity="error"
        message={error}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={handleRetry}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "999px",
                borderColor: "rgba(230, 244, 239, 0.6)",
                color: "#E6F4EF",
                px: 1.75,
                "&:hover": {
                  borderColor: "#E6F4EF",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              {snackbar.retry}
            </Button>
            <IconButton
              size="small"
              onClick={handleCloseSnackbar}
              sx={{
                color: "#E6F4EF",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                },
              }}
              aria-label={snackbar.closeAria}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      /> */}
    </Box>
  );
}
