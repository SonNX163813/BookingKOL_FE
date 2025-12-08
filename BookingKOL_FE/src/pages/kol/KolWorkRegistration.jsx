// src/pages/kol/KolWorkRegistration.jsx
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
  getKolTimeline,
  getKolFreeTime,
} from "../../services/kol/KolAPI";
import { adminRegisterKolSchedule } from "../../services/admin/AdminScheduleAPI";

dayjs.locale("vi");

const MIN_GAP_MINUTES = 60;
const MIN_DURATION_MINUTES = 60;
const MIN_DATE = dayjs().add(7, "day").startOf("day");

// ===== Helpers auth =====
function readJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getAuthUserFromStorage() {
  const KEY = "auth_user";
  const rawLocal =
    typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  const rawSession =
    typeof window !== "undefined" ? sessionStorage.getItem(KEY) : null;
  return readJSON(rawLocal) || readJSON(rawSession) || null;
}

/** Lấy userId từ auth_user */
function extractUserId(auth) {
  if (!auth || typeof auth !== "object") return null;
  return auth.userId || auth.id || auth.user?.id || auth.user?.userId || null;
}

/** Lấy kolId (id profile KOL) nếu có sẵn trong auth_user */
function extractKolIdFromAuth(auth) {
  if (!auth || typeof auth !== "object") return null;

  if (auth.kolProfile?.id) return auth.kolProfile.id;
  if (auth.kol?.id) return auth.kol.id;
  if (auth.kolProfileId) return auth.kolProfileId;
  if (auth.kol_primary_id) return auth.kol_primary_id;
  if (auth.kolIdPrimary) return auth.kolIdPrimary;
  if (auth.kolId) return auth.kolId;

  const nested = auth.user || auth.account || null;
  if (nested) {
    if (nested.kolProfile?.id) return nested.kolProfile.id;
    if (nested.kol?.id) return nested.kol.id;
    if (nested.kolProfileId) return nested.kolProfileId;
    if (nested.kol_primary_id) return nested.kol_primary_id;
    if (nested.kolIdPrimary) return nested.kolIdPrimary;
    if (nested.kolId) return nested.kolId;
  }

  return null;
}

// dayjs: 0=CN,1=T2..6=T7
const dayOfWeekLabel = (d) => {
  const w = d.day();
  if (w === 0) return "CN";
  return `T${w + 1}`;
};

function extractApiMessage(err) {
  const data = err?.response?.data;
  if (!data) return "";
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message) && data.message.length)
    return data.message[0];
  if (typeof data === "string") return data;
  return "";
}

const labelOf = (date, start, end) =>
  `${start?.format("HH:mm")}–${end?.format("HH:mm")}, ${date?.format(
    "DD/MM/YYYY"
  )}`;

/* ===== Helpers cho blocked ranges (từ timeline) ===== */
const isCancelled = (st) => String(st || "").toUpperCase() === "CANCELLED";

const toISOInterval = (slot) => {
  const startISO =
    slot?.startAt ||
    slot?.startTime ||
    slot?.start ||
    slot?.beginAt ||
    slot?.from;
  const endISO =
    slot?.endAt || slot?.endTime || slot?.end || slot?.finishAt || slot?.to;
  const s = dayjs(startISO);
  const e = dayjs(endISO);
  if (!s.isValid() || !e.isValid() || !e.isAfter(s)) return null;
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

const expandWorkTimesLocal = (item) => {
  if (!Array.isArray(item?.workTimes) || item.workTimes.length === 0) return [];
  return item.workTimes.filter((w) => !isCancelled(w?.status));
};

const expandIntervalByMinutes = (iv, minutes) => {
  const s = dayjs(iv.startISO).subtract(minutes, "minute");
  const e = dayjs(iv.endISO).add(minutes, "minute");
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  const s = dayjs(aStart),
    e = dayjs(aEnd);
  return e.isAfter(bStart) && s.isBefore(bEnd);
};

const mergeSortedIntervals = (arr) => {
  if (!arr.length) return arr;
  const out = [Object.assign({}, arr[0])];
  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i];
    const last = out[out.length - 1];
    if (!dayjs(cur.startISO).isAfter(dayjs(last.endISO))) {
      if (dayjs(cur.endISO).isAfter(dayjs(last.endISO))) {
        last.endISO = cur.endISO;
      }
    } else {
      out.push(Object.assign({}, cur));
    }
  }
  return out;
};

export default function KolWorkRegistrationMui({
  isAdmin = false,
  adminKolId = null,
  onSuccess,
}) {
  const { kolId: kolIdParam } = useParams();

  const [resolvedUserId, setResolvedUserId] = React.useState(null);
  const [resolvedKolId, setResolvedKolId] = React.useState(null);
  const [resolving, setResolving] = React.useState(true);

  const [saving, setSaving] = React.useState(false);

  const [blocked, setBlocked] = React.useState([]);
  const [loadingBlocked, setLoadingBlocked] = React.useState(false);

  const [monthAnchor, setMonthAnchor] = React.useState(MIN_DATE);
  const [monthSchedule, setMonthSchedule] = React.useState([]);
  const [loadingMonthSchedule, setLoadingMonthSchedule] = React.useState(false);

  const [pickedDate, setPickedDate] = React.useState(null);
  const [shifts, setShifts] = React.useState([]);

  // ✅ flow: thêm ca => chỉ có start, end chọn sau; tự mở end picker
  const [openEndIdx, setOpenEndIdx] = React.useState(null);

  const [snack, setSnack] = React.useState({
    open: false,
    type: "success",
    message: "",
  });

  /* -------- Resolve userId + kolId -------- */
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setResolving(true);

        // ✅ Mode ADMIN
        if (isAdmin) {
          if (mounted) {
            setResolvedKolId(adminKolId || kolIdParam || null);
            setResolvedUserId(null);
          }
          return;
        }

        // ===== Mode KOL =====
        const authUser = getAuthUserFromStorage();

        // 1) URL có kolIdParam
        if (kolIdParam) {
          try {
            const prof = await getKolProfileById(kolIdParam);
            if (!mounted) return;
            if (prof?.id) setResolvedKolId(prof.id);
            else setResolvedKolId(kolIdParam);
            if (prof?.userId) setResolvedUserId(prof.userId);
            else if (authUser) {
              const uId = extractUserId(authUser);
              if (uId) setResolvedUserId(uId);
            }
          } catch (e) {
            console.warn("[Register] getKolProfileById failed:", e);
            if (!mounted) return;
            setResolvedKolId(kolIdParam);
            if (authUser) {
              const uId = extractUserId(authUser);
              if (uId) setResolvedUserId(uId);
            }
          }
          return;
        }

        // 2) Không có kolIdParam -> lấy từ auth_user
        if (!authUser) {
          if (mounted) {
            setResolvedUserId(null);
            setResolvedKolId(null);
          }
          return;
        }

        const uIdFromAuth = extractUserId(authUser);
        const kolIdFromAuth = extractKolIdFromAuth(authUser);

        if (uIdFromAuth && mounted) setResolvedUserId(uIdFromAuth);
        if (kolIdFromAuth && mounted) {
          setResolvedKolId(kolIdFromAuth);
          return;
        }

        // 3) Có userId nhưng chưa có kolId -> hỏi BE
        if (uIdFromAuth) {
          const me = await getKolProfileByUserId(uIdFromAuth);
          if (!mounted) return;
          if (me?.id) setResolvedKolId(me.id);
          if (!resolvedUserId && me?.userId) setResolvedUserId(me.userId);
        }
      } catch (e) {
        console.warn("[Register] Resolve ids failed:", e);
        if (mounted) {
          setResolvedUserId(null);
          setResolvedKolId(null);
        }
      } finally {
        if (mounted) setResolving(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [kolIdParam, isAdmin, adminKolId]);

  /* -------- Blocked (từ timeline) -------- */
  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setBlocked([]);
      if (!resolvedKolId || !pickedDate) return;
      setLoadingBlocked(true);
      try {
        const start = pickedDate.startOf("day");
        const end = pickedDate.endOf("day");

        const booked = await getKolTimeline({
          kolId: resolvedKolId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          page: 0,
          size: 1000,
        });

        const intervals = (booked || [])
          .flatMap(expandWorkTimesLocal)
          .map(toISOInterval)
          .filter(Boolean)
          .map((iv) => expandIntervalByMinutes(iv, MIN_GAP_MINUTES))
          .filter((iv) => overlaps(iv.startISO, iv.endISO, start, end))
          .sort((a, b) => a.startISO.localeCompare(b.startISO));

        if (active) setBlocked(mergeSortedIntervals(intervals));
      } catch (e) {
        console.warn("[Register] load blocked failed:", e);
        if (active) setBlocked([]);
      } finally {
        if (active) setLoadingBlocked(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [resolvedKolId, pickedDate]);

  /* -------- Lịch RẢNH trong tháng -------- */
  const reloadMonthSchedule = React.useCallback(async () => {
    if (!resolvedKolId || !monthAnchor) {
      setMonthSchedule([]);
      return;
    }
    setLoadingMonthSchedule(true);
    try {
      const start = monthAnchor.startOf("month");
      const end = monthAnchor.endOf("month");

      const freeTimes = await getKolFreeTime({
        kolId: resolvedKolId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        page: 0,
        size: 1000,
      });

      const events = [];

      (freeTimes || []).forEach((item) => {
        if (Array.isArray(item.workTimes) && item.workTimes.length) {
          item.workTimes.forEach((w) => {
            if (!w.startAt || !w.endAt) return;
            events.push({
              id: w.id || `${w.startAt}_${w.endAt}`,
              startAt: w.startAt,
              endAt: w.endAt,
            });
          });
        } else if (item.startAt && item.endAt) {
          events.push({
            id: item.id || `${item.startAt}_${item.endAt}`,
            startAt: item.startAt,
            endAt: item.endAt,
          });
        }
      });

      events.sort(
        (a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
      );
      setMonthSchedule(events);
    } catch (e) {
      console.warn("[Register] load free-time failed:", e);
      setMonthSchedule([]);
    } finally {
      setLoadingMonthSchedule(false);
    }
  }, [resolvedKolId, monthAnchor]);

  React.useEffect(() => {
    reloadMonthSchedule();
  }, [reloadMonthSchedule]);

  /* -------- Group lịch rảnh theo ngày -------- */
  const monthScheduleByDay = React.useMemo(() => {
    if (!monthSchedule.length) return [];
    const map = new Map();
    monthSchedule.forEach((ev) => {
      const key = dayjs(ev.startAt).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    });

    return Array.from(map.entries())
      .sort(([d1], [d2]) => dayjs(d1).valueOf() - dayjs(d2).valueOf())
      .map(([date, list]) => ({
        date,
        items: list
          .slice()
          .sort(
            (a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
          ),
      }));
  }, [monthSchedule]);

  /* -------- Helpers thời gian -------- */
  const normalizeAtPickedDate = (val) => {
    if (!pickedDate || !val) return null;
    return pickedDate.hour(val.hour()).minute(0).second(0).millisecond(0);
  };

  // latest start = 23:00 - duration (vì chọn theo giờ)
  const latestStartTime = React.useMemo(() => {
    if (!pickedDate) return null;
    return pickedDate
      .hour(23)
      .minute(0)
      .second(0)
      .millisecond(0)
      .subtract(MIN_DURATION_MINUTES, "minute");
  }, [pickedDate]);

  /* -------- Quản lý ca đăng ký -------- */
  const addShift = () => {
    if (!pickedDate) return;

    // ✅ nếu ca trước chưa có end -> bắt chọn end trước khi thêm ca mới
    if (shifts.length) {
      const last = shifts[shifts.length - 1];
      if (!last?.start || !last?.end) {
        setSnack({
          open: true,
          type: "error",
          message:
            "Vui lòng chọn giờ kết thúc cho ca trước rồi mới thêm ca mới.",
        });
        setOpenEndIdx(shifts.length - 1);
        return;
      }
    }

    let start = pickedDate.hour(9).minute(0).second(0).millisecond(0);

    if (shifts.length) {
      const last = shifts[shifts.length - 1];
      // last.end chắc chắn đã có theo check trên
      start = last.end.add(MIN_GAP_MINUTES, "minute").minute(0).second(0);
    }

    // ✅ chỉ set start, end để null (user chọn sau)
    const newShift = { start, end: null };

    setShifts((s) => {
      const next = [...s, newShift];
      // ✅ tự mở end picker của ca mới
      setOpenEndIdx(next.length - 1);
      return next;
    });
  };

  // ✅ flow: chọn start trước -> end phải chọn sau (không auto-fill end)
  const updateShift = (idx, field, val) => {
    setShifts((arr) =>
      arr.map((s, i) => {
        if (i !== idx) return s;

        // clear
        if (!val) {
          if (field === "start") return { ...s, start: null, end: null };
          return { ...s, end: null };
        }

        const nextTime = normalizeAtPickedDate(val);
        if (!nextTime) return s;

        if (field === "start") {
          // đổi start => reset end (để user chọn lại theo start mới)
          return { ...s, start: nextTime, end: null };
        }

        // chọn END sau (chỉ cho chọn khi đã có start)
        if (!s.start) return { ...s, end: null };

        const start = dayjs(s.start);
        const minEnd = start.add(MIN_DURATION_MINUTES, "minute");
        let end = nextTime;

        if (end.isBefore(minEnd)) end = minEnd;

        return { ...s, end };
      })
    );

    if (field === "start") setOpenEndIdx(idx);
  };

  const removeShift = (idx) => {
    setShifts((arr) => arr.filter((_, i) => i !== idx));
    setOpenEndIdx((cur) => {
      if (cur == null) return null;
      if (cur === idx) return null;
      if (cur > idx) return cur - 1;
      return cur;
    });
  };

  /* -------- Validate -------- */
  const validate = () => {
    if (!pickedDate) return "Vui lòng chọn ngày đăng ký (≥ 7 ngày).";
    if (!shifts.length) return "Vui lòng thêm ít nhất 1 ca.";

    const sorted = [...shifts].sort((a, b) =>
      a.start && b.start ? a.start.diff(b.start) : 0
    );

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      if (!s.start || !s.end)
        return "Vui lòng chọn đủ giờ bắt đầu và giờ kết thúc cho từng ca.";

      const duration = s.end.diff(s.start, "minute");
      if (duration < MIN_DURATION_MINUTES)
        return `Mỗi ca phải tối thiểu ${MIN_DURATION_MINUTES} phút.`;

      if (i > 0) {
        const prev = sorted[i - 1];
        const gap = s.start.diff(prev.end, "minute");
        if (gap < MIN_GAP_MINUTES)
          return `Khoảng cách giữa các ca phải ≥ ${MIN_GAP_MINUTES} phút.`;
      }

      const sIv = {
        startISO: s.start.toISOString(),
        endISO: s.end.toISOString(),
      };
      const hit = blocked.find((b) =>
        overlaps(sIv.startISO, sIv.endISO, b.startISO, b.endISO)
      );
      if (hit) {
        return (
          `Ca ${i + 1} (${labelOf(pickedDate, s.start, s.end)}) ` +
          `nằm trong khoảng không khả dụng do lịch đã đặt (bao gồm đệm ±${MIN_GAP_MINUTES}’).`
        );
      }
    }
    return null;
  };

  /* -------- Submit -------- */
  const handleSave = async () => {
    const err = validate();
    if (err) {
      setSnack({ open: true, type: "error", message: err });
      return;
    }

    try {
      setSaving(true);

      if (isAdmin) {
        if (!resolvedKolId)
          throw new Error("Không xác định được KOL ID để tạo lịch.");
        await adminRegisterKolSchedule({ kolId: resolvedKolId, shifts });
      } else {
        if (!resolvedUserId)
          throw new Error("Không xác định được User ID của KOL.");

        const result = await registerKolAvailabilities({
          kolId: resolvedUserId, // backend: /schedule/{userId}
          date: pickedDate,
          shifts,
        });

        if (Array.isArray(result)) {
          const bad = result.find(
            (x) =>
              typeof x?.status === "number" &&
              x.status !== 201 &&
              x.status !== 200
          );
          if (bad) {
            const beMsg =
              (Array.isArray(bad?.message) && bad.message[0]) ||
              bad?.message ||
              "Khoảng thời gian này đã bị trùng với lịch làm việc khác";
            throw new Error(beMsg);
          }
        }
      }

      setSnack({
        open: true,
        type: "success",
        message: isAdmin
          ? "Tạo lịch làm việc thành công!"
          : "Đăng ký ca làm thành công!",
      });
      setShifts([]);
      setOpenEndIdx(null);

      if (resolvedKolId) await reloadMonthSchedule();
      if (onSuccess) onSuccess();
    } catch (e) {
      const httpStatus = e?.response?.status;
      const appStatus = e?.appStatus;
      const isConflict =
        httpStatus === 400 ||
        httpStatus === 409 ||
        appStatus === 400 ||
        appStatus === 409;

      if (isConflict) {
        const beMsg = extractApiMessage(e);
        const friendly =
          e?.message ||
          beMsg ||
          `Khoảng thời gian này bị trùng với lịch khác hoặc vi phạm đệm ±${MIN_GAP_MINUTES}’.`;
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
    } finally {
      setSaving(false);
    }
  };

  const loadingUI = resolving || (!isAdmin && !resolvedUserId);

  const canAddShift = React.useMemo(() => {
    if (!pickedDate || saving) return false;
    if (!shifts.length) return true;
    const last = shifts[shifts.length - 1];
    return !!(last?.start && last?.end);
  }, [pickedDate, saving, shifts]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} color="#0050ab" mb={1}>
          Đăng ký lịch làm việc
        </Typography>

        {loadingUI ? (
          <Typography>Đang tải thông tin KOL...</Typography>
        ) : !isAdmin && !resolvedUserId ? (
          <Typography color="error">
            Không tìm thấy User ID. Vui lòng đăng nhập bằng tài khoản KOL.
          </Typography>
        ) : (
          <>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="flex-start"
            >
              {/* Calendar chọn ngày */}
              <Card
                sx={{
                  p: 1,
                  border: "2px solid #93cef6",
                  borderRadius: 2,
                  minWidth: 360,
                }}
              >
                <StaticDatePicker
                  orientation="landscape"
                  defaultCalendarMonth={MIN_DATE}
                  minDate={MIN_DATE}
                  value={pickedDate}
                  onChange={(val) => {
                    const d = val && val.isValid() ? val.startOf("day") : null;
                    setPickedDate(d);
                    setShifts([]);
                    setOpenEndIdx(null);
                    if (d) setMonthAnchor(d.startOf("month"));
                  }}
                  onMonthChange={(month) => {
                    if (month) setMonthAnchor(month.startOf("month"));
                  }}
                  dayOfWeekFormatter={dayOfWeekLabel}
                  localeText={{ toolbarTitle: "Chọn ngày" }}
                  slotProps={{ actionBar: { actions: [] } }}
                />
              </Card>

              {/* Form ca */}
              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  border: "2px solid #93cef6",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography fontWeight={600}>
                    {pickedDate
                      ? `Ngày: ${pickedDate.format("dddd, DD/MM/YYYY")}`
                      : "Chọn ngày (≥ 7 ngày từ hôm nay) để đăng ký ca"}
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={addShift}
                    disabled={!pickedDate || saving || !canAddShift}
                    title={
                      !canAddShift
                        ? "Hãy chọn giờ kết thúc cho ca trước trước khi thêm ca mới"
                        : ""
                    }
                  >
                    Thêm ca
                  </Button>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1.5}>
                  {shifts.map((sh, idx) => {
                    const minEndTime = sh.start
                      ? sh.start.add(MIN_DURATION_MINUTES, "minute")
                      : null;

                    const maxStartTime = sh.end
                      ? sh.end.add(-MIN_DURATION_MINUTES, "minute")
                      : null;

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
                          views={["hours"]}
                          format="HH:mm"
                          maxTime={maxStartTime || latestStartTime || undefined}
                          disabled={saving}
                        />

                        <Typography>đến</Typography>
                        <TimePicker
                          value={sh.end}
                          onChange={(v) => {
                            updateShift(idx, "end", v);
                            setOpenEndIdx(null);
                          }}
                          ampm={false}
                          views={["hours"]}
                          format="HH:mm"
                          minTime={minEndTime || undefined}
                          disabled={saving || !sh.start}
                          open={openEndIdx === idx}
                          onOpen={() => setOpenEndIdx(idx)}
                          onClose={() => setOpenEndIdx(null)}
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
                      Hãy chọn ngày bên trái rồi bấm <b>Thêm ca</b>.
                    </Typography>
                  )}
                  {pickedDate && !shifts.length && (
                    <Typography color="text.secondary">
                      Bấm <b>Thêm ca</b> để đăng ký.
                    </Typography>
                  )}
                  {pickedDate && shifts.length > 0 && !canAddShift && (
                    <Typography color="text.secondary">
                      Hãy chọn <b>giờ kết thúc</b> cho ca hiện tại để có thể
                      thêm ca mới.
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
                    {saving
                      ? "Đang đăng ký..."
                      : `Lưu đăng ký ngày ${
                          pickedDate ? pickedDate.format("DD/MM") : ""
                        }`}
                  </Button>
                </Stack>
              </Card>
            </Stack>

            {/* Lịch RẢNH trong tháng */}
            <Card
              sx={{
                mt: 2,
                p: 2,
                border: "2px solid #93cef6",
                borderRadius: 2,
              }}
            >
              <Typography fontWeight={700} mb={1}>
                Lịch đã đăng ký trong tháng {monthAnchor.format("MM/YYYY")}
              </Typography>

              {loadingMonthSchedule ? (
                <Typography color="text.secondary">
                  Đang tải lịch đã đăng ký...
                </Typography>
              ) : !monthScheduleByDay.length ? (
                <Typography color="text.secondary">
                  Chưa có đã đăng ký nào trong tháng này.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {monthScheduleByDay.map((d) => (
                    <Box
                      key={d.date}
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        border: "1px solid #e3f0ff",
                        backgroundColor: "#f8fbff",
                      }}
                    >
                      <Typography fontWeight={600} variant="body2">
                        {dayjs(d.date).format("dddd, DD/MM/YYYY")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {d.items
                          .map(
                            (ev) =>
                              `${dayjs(ev.startAt).format("HH:mm")}–${dayjs(
                                ev.endAt
                              ).format("HH:mm")}`
                          )
                          .join("  •  ")}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>
          </>
        )}

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
