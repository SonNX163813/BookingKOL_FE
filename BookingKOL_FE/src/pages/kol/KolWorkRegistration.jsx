// src/pages/kol/KolWorkRegistrationMui.jsx
import * as React from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Box,
  Button,
  Card,
  Divider,
  Stack,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useParams } from "react-router-dom";
import {
  getKolProfileByUserId,
  getKolProfileById,
  registerKolAvailabilities,
} from "../../services/kol/KolAPI";

const MIN_GAP_MINUTES = 60;
const MIN_DURATION_MINUTES = 60;
const MIN_DATE = dayjs().add(14, "day").startOf("day");

// ===== Helpers: đọc user auth từ storage (local -> session) =====
function readJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function getAuthUserFromStorage() {
  const KEY = "auth_user"; // đổi nếu dự án dùng key khác
  const rawLocal =
    typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  const rawSession =
    typeof window !== "undefined" ? sessionStorage.getItem(KEY) : null;
  return readJSON(rawLocal) || readJSON(rawSession) || null;
}

/** Cố gắng bóc ra **KOL primary id** từ object user trong auth. */
function extractKolPrimaryId(user) {
  if (!user || typeof user !== "object") return null;

  const candidates = [
    user?.kolProfile?.id,
    user?.kol?.id,
    user?.kolProfileId,
    user?.kol_primary_id,
    user?.kolIdPrimary,
    // user?.kolId, // thường là "kolid" (KHÔNG dùng nếu BE cần "id")
    user?.id, // fallback cuối
  ];
  return candidates.find(Boolean) || null;
}

// Hiển thị nhãn thứ (T2..CN). dayjs: 0=CN, 1=T2, ... 6=T7
const dayOfWeekLabel = (d) => {
  const w = d.day();
  if (w === 0) return "CN";
  return `T${w + 1}`;
};

// Lấy message từ lỗi axios (BE hay trả { message: string | string[] })
function extractApiMessage(err) {
  const data = err?.response?.data;
  if (!data) return "";
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message) && data.message.length)
    return data.message[0];
  if (typeof data === "string") return data;
  return "";
}

// Tạo label khung giờ đẹp
const labelOf = (date, start, end) =>
  `${start?.format("HH:mm")}–${end?.format("HH:mm")}, ${date?.format(
    "DD/MM/YYYY"
  )}`;

export default function KolWorkRegistrationMui() {
  const { kolId: kolIdParam } = useParams();

  // ===== Resolve primary id: ưu tiên auth storage (local -> session) =====
  const [resolvedId, setResolvedId] = React.useState(null);
  const [resolving, setResolving] = React.useState(false);

  // Loading khi gọi API Lưu
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setResolving(true);

        // 1) Từ auth_user trong storage
        const authUser = getAuthUserFromStorage();
        const idFromAuth = extractKolPrimaryId(authUser);
        if (mounted && idFromAuth) {
          setResolvedId(idFromAuth);
          return;
        }

        // 2) Có kolId trên URL → map sang primary id
        if (kolIdParam) {
          const prof = await getKolProfileById(kolIdParam);
          if (mounted) setResolvedId(prof?.id || null);
          return;
        }

        // 3) Fallback: lấy theo userId trong auth_user
        const userIdFromAuth =
          authUser?.userId || authUser?.id || authUser?.user?.id || null;
        if (userIdFromAuth) {
          const me = await getKolProfileByUserId(userIdFromAuth);
          if (mounted) setResolvedId(me?.id || null);
        }
      } catch (e) {
        console.warn("[Register] Resolve id failed:", e);
        if (mounted) setResolvedId(null);
      } finally {
        if (mounted) setResolving(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [kolIdParam]);

  // ===== UI đăng ký =====
  const [pickedDate, setPickedDate] = React.useState(null);
  const [shifts, setShifts] = React.useState([]); // [{start: dayjs, end: dayjs}]
  const [history, setHistory] = React.useState([]);

  // Snackbar
  const [snack, setSnack] = React.useState({
    open: false,
    type: "success", // "success" | "error"
    message: "",
  });

  const addShift = () => {
    if (!pickedDate) return;
    let start = pickedDate.hour(9).minute(0).second(0);
    let end = pickedDate.hour(11).minute(0).second(0);
    if (shifts.length) {
      const last = shifts[shifts.length - 1];
      start = last.end.add(MIN_GAP_MINUTES, "minute");
      end = start.add(2, "hour");
    }
    setShifts((s) => [...s, { start, end }]);
  };

  const updateShift = (idx, field, val) => {
    setShifts((arr) =>
      arr.map((s, i) =>
        i === idx
          ? {
              ...s,
              [field]: val
                ? pickedDate.hour(val.hour()).minute(val.minute()).second(0)
                : null,
            }
          : s
      )
    );
  };

  const removeShift = (idx) =>
    setShifts((arr) => arr.filter((_, i) => i !== idx));

  // Kiểm tra ca hợp lệ (sort theo giờ bắt đầu để tránh pass nhầm do thứ tự)
  const validate = () => {
    if (!pickedDate) return "Vui lòng chọn ngày đăng ký (≥ 14 ngày).";
    if (!shifts.length) return "Vui lòng thêm ít nhất 1 ca.";

    const sorted = [...shifts].sort((a, b) => a.start.diff(b.start));
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      if (!s.start || !s.end) return "Thiếu thời gian cho một ca.";
      const duration = s.end.diff(s.start, "minute");
      if (duration < MIN_DURATION_MINUTES)
        return `Mỗi ca phải tối thiểu ${MIN_DURATION_MINUTES} phút.`;

      if (i > 0) {
        const prev = sorted[i - 1];
        const gap = s.start.diff(prev.end, "minute");
        if (gap < MIN_GAP_MINUTES)
          return `Khoảng cách giữa các ca phải ≥ ${MIN_GAP_MINUTES} phút.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setSnack({ open: true, type: "error", message: err });
      return;
    }
    if (!resolvedId) {
      setSnack({
        open: true,
        type: "error",
        message: "Không xác định được KOL ID.",
      });
      return;
    }

    try {
      setSaving(true);
      const result = await registerKolAvailabilities({
        kolId: resolvedId, // primary id từ storage/fallback
        date: pickedDate, // dayjs
        shifts, // [{start, end}]
      });

      // Phòng hờ: nếu service chưa được sửa để throw khi app-status != 200
      if (Array.isArray(result)) {
        const bad = result.find(
          (x) => typeof x?.status === "number" && x.status !== 200
        );
        if (bad) {
          const beMsg =
            (Array.isArray(bad?.message) && bad.message[0]) ||
            bad?.message ||
            "Khoảng thời gian này đã bị trùng với lịch làm việc khác";
          throw new Error(beMsg);
        }
      }

      const rec = {
        date: pickedDate.format("YYYY-MM-DD"),
        shifts: shifts.map((s) => ({
          start: s.start.format("HH:mm"),
          end: s.end.format("HH:mm"),
        })),
      };
      setHistory((list) => {
        const rest = list.filter((x) => x.date !== rec.date);
        return [rec, ...rest].sort((a, b) => (a.date < b.date ? 1 : -1));
      });

      setSnack({ open: true, type: "success", message: "Đăng ký thành công!" });
    } catch (e) {
      // ====== HIỂN THỊ THÔNG BÁO TRÙNG LỊCH DỄ HIỂU ======
      const httpStatus = e?.response?.status;
      const appStatus = e?.appStatus; // nếu service có gắn
      const isConflict =
        httpStatus === 400 ||
        httpStatus === 409 ||
        appStatus === 400 ||
        appStatus === 409;

      if (isConflict) {
        // Ưu tiên message từ BE hoặc từ service đã format
        const beMsg = extractApiMessage(e);
        const friendly =
          e?.message ||
          beMsg ||
          `Khoảng thời gian này bị trùng với lịch khác. Vui lòng chọn khung giờ khác (ví dụ: ${labelOf(
            pickedDate,
            shifts[0]?.start,
            shifts[0]?.end
          )}).`;
        setSnack({ open: true, type: "error", message: friendly });
      } else {
        console.error(e);
        setSnack({
          open: true,
          type: "error",
          message:
            e?.message ||
            "Không thể đăng ký ca làm. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
        });
      }
      // ❗ KHÔNG cập nhật lịch sử ở nhánh lỗi
    } finally {
      setSaving(false);
    }
  };

  const loadingUI = resolving || !resolvedId;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ p: 2, maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} color="#0050ab" mb={1}>
          Đăng ký lịch làm việc
        </Typography>

        {loadingUI ? (
          <Typography>Đang tải KOL ID...</Typography>
        ) : (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            {/* Calendar landscape, bắt đầu từ ngày khả dụng (>= +14 ngày) */}
            <Card sx={{ p: 1, border: "2px solid #93cef6", borderRadius: 2 }}>
              <StaticDatePicker
                orientation="landscape"
                defaultCalendarMonth={MIN_DATE}
                minDate={MIN_DATE}
                value={pickedDate}
                onChange={(val) => {
                  setPickedDate(val?.startOf("day") || null);
                  setShifts([]); // đổi ngày → reset ca
                }}
                dayOfWeekFormatter={dayOfWeekLabel}
                localeText={{ toolbarTitle: "Chọn ngày" }}
                slotProps={{ actionBar: { actions: [] } }}
              />
            </Card>

            {/* Khung ca trong ngày được chọn */}
            <Card sx={{ p: 2, flex: 1, border: "2px solid #93cef6" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography fontWeight={600}>
                  {pickedDate
                    ? `Ngày: ${pickedDate.format("dddd, DD/MM/YYYY")}`
                    : "Chọn ngày (≥ 14 ngày từ hôm nay)"}
                </Typography>
                <Button
                  variant="contained"
                  onClick={addShift}
                  disabled={!pickedDate || saving}
                >
                  Thêm ca
                </Button>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.5}>
                {shifts.map((sh, idx) => {
                  const minEndTime =
                    sh.start?.add(MIN_DURATION_MINUTES, "minute") || null;
                  const maxStartTime =
                    sh.end?.add(-MIN_DURATION_MINUTES, "minute") || null;

                  return (
                    <Stack
                      key={idx}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        p: 1,
                        border: "1px solid #93cef6",
                        borderRadius: 1,
                      }}
                    >
                      <Typography sx={{ width: 56, textAlign: "right" }}>
                        Ca {idx + 1}
                      </Typography>

                      <Typography>Từ</Typography>
                      <TimePicker
                        value={sh.start}
                        onChange={(v) => updateShift(idx, "start", v)}
                        ampm={false}
                        minutesStep={5}
                        maxTime={maxStartTime || undefined}
                        disabled={saving}
                      />

                      <Typography>đến</Typography>
                      <TimePicker
                        value={sh.end}
                        onChange={(v) => updateShift(idx, "end", v)}
                        ampm={false}
                        minutesStep={5}
                        minTime={minEndTime || undefined}
                        disabled={saving}
                      />

                      <Box flex={1} />
                      <Button
                        color="error"
                        onClick={() => removeShift(idx)}
                        disabled={saving}
                      >
                        Xoá
                      </Button>
                    </Stack>
                  );
                })}

                {!pickedDate && (
                  <Typography color="text.secondary">
                    Hãy chọn ngày rồi bấm <b>Thêm ca</b>.
                  </Typography>
                )}
                {pickedDate && !shifts.length && (
                  <Typography color="text.secondary">
                    Ngày này chưa có ca. Bấm <b>Thêm ca</b> để bắt đầu.
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!pickedDate || !shifts.length || saving}
                  startIcon={saving ? <CircularProgress size={18} /> : null}
                >
                  {saving ? (
                    "Đang đăng ký..."
                  ) : (
                    <>
                      Lưu đăng ký ngày{" "}
                      {pickedDate ? pickedDate.format("DD/MM") : ""}
                    </>
                  )}
                </Button>
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Lịch sử (chỉ ngày đã lưu) */}
        <Card
          sx={{ mt: 2, p: 2, border: "2px solid #93cef6", borderRadius: 2 }}
        >
          <Typography fontWeight={700} mb={1}>
            Lịch sử đăng ký
          </Typography>
          {history.length === 0 ? (
            <Typography color="text.secondary">Chưa có bản ghi.</Typography>
          ) : (
            <Stack spacing={1}>
              {history.map((h) => (
                <Box
                  key={h.date}
                  sx={{
                    p: 1,
                    border: "1px solid #e3f0ff",
                    borderRadius: 1,
                    background: "#f8fbff",
                  }}
                >
                  <Typography fontWeight={600}>
                    {dayjs(h.date).format("dddd, DD/MM/YYYY")}
                  </Typography>
                  <Typography variant="body2">
                    {h.shifts.map((s) => `${s.start}–${s.end}`).join("  •  ")}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Card>

        {/* Snackbar thông báo success/fail */}
        <Snackbar
          open={snack.open}
          autoHideDuration={snack.type === "error" ? 6000 : 3000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.type}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
