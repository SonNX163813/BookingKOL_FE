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

/** Compute min selectable date + min start hour on that min date (match BE: now + 7 days exact time) */
function computeMinRule() {
  const now = dayjs();
  const minAllowed = now.add(7, "day"); // BE rule (exact 7 days)

  // Base min date is that day (startOf day)
  let minDate = minAllowed.startOf("day");

  // Because UI selects only hours (minute=0), we must round up to next hour if now has minutes/seconds
  let firstHour = minAllowed.hour();
  const hasMinutePart =
    minAllowed.minute() !== 0 ||
    minAllowed.second() !== 0 ||
    minAllowed.millisecond() !== 0;

  if (hasMinutePart) firstHour += 1;

  // If rounding pushes hour >= 24 => shift to next day 00:00
  if (firstHour >= 24) {
    minDate = minDate.add(1, "day").startOf("day");
    firstHour = 0;
  }

  // Ensure there is at least one valid start hour on minDate given MIN_DURATION (avoid end spilling to next day)
  const latestStart = minDate
    .hour(23)
    .minute(0)
    .second(0)
    .millisecond(0)
    .subtract(MIN_DURATION_MINUTES, "minute");

  // If firstHour is later than latestStart hour => no valid slot on that minDate, bump minDate to next day
  if (firstHour > latestStart.hour()) {
    minDate = minDate.add(1, "day").startOf("day");
    firstHour = 0;
  }

  return { minDate, firstStartHourOnMinDate: firstHour };
}

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

  const minRule = React.useMemo(() => computeMinRule(), []);
  const MIN_DATE = minRule.minDate;
  const MIN_FIRST_HOUR = minRule.firstStartHourOnMinDate;

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

  const isMinSelectableDay = React.useMemo(() => {
    return !!pickedDate && pickedDate.isSame(MIN_DATE, "day");
  }, [pickedDate, MIN_DATE]);

  const minStartTimeForPickedDay = React.useMemo(() => {
    if (!pickedDate) return null;
    if (!pickedDate.isSame(MIN_DATE, "day")) return null;
    return pickedDate.hour(MIN_FIRST_HOUR).minute(0).second(0).millisecond(0);
  }, [pickedDate, MIN_DATE, MIN_FIRST_HOUR]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (shifts.length) {
      const last = shifts[shifts.length - 1];
      if (!last?.start || !last?.end) {
        setOpenEndIdx(shifts.length - 1);
        return;
      }
    }

    let start = pickedDate.hour(9).minute(0).second(0).millisecond(0);

    // ✅ nếu là ngày min, default start >= minStartHour
    if (isMinSelectableDay && minStartTimeForPickedDay) {
      const h = Math.max(9, minStartTimeForPickedDay.hour());
      start = pickedDate.hour(h).minute(0).second(0).millisecond(0);
    }

    if (shifts.length) {
      const last = shifts[shifts.length - 1];
      start = last.end.add(MIN_GAP_MINUTES, "minute").minute(0).second(0);
    }

    const newShift = { start, end: null };

    setShifts((s) => {
      const next = [...s, newShift];
      setOpenEndIdx(next.length - 1);
      return next;
    });
  };

  const updateShift = (idx, field, val) => {
    setShifts((arr) =>
      arr.map((s, i) => {
        if (i !== idx) return s;

        if (!val) {
          if (field === "start") return { ...s, start: null, end: null };
          return { ...s, end: null };
        }

        let nextTime = normalizeAtPickedDate(val);
        if (!nextTime) return s;

        // ✅ clamp start on min day to >= minStartTimeForPickedDay
        if (field === "start" && minStartTimeForPickedDay) {
          if (nextTime.isBefore(minStartTimeForPickedDay)) {
            nextTime = minStartTimeForPickedDay;
          }
        }

        if (field === "start") {
          return { ...s, start: nextTime, end: null };
        }

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

  /* -------- Disable submit if invalid (no UI message) -------- */
  const validationError = React.useMemo(() => {
    if (!pickedDate) return "NO_DATE";
    if (!shifts.length) return "NO_SHIFT";

    const sorted = [...shifts].sort((a, b) =>
      a.start && b.start ? a.start.diff(b.start) : 0
    );

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      if (!s.start || !s.end) return "MISSING_TIME";

      // ✅ min day rule: start must be >= minStartTimeForPickedDay
      if (
        minStartTimeForPickedDay &&
        s.start.isBefore(minStartTimeForPickedDay)
      )
        return "BE_MIN_7D_TIME";

      const duration = s.end.diff(s.start, "minute");
      if (duration < MIN_DURATION_MINUTES) return "DURATION_TOO_SHORT";

      if (i > 0) {
        const prev = sorted[i - 1];
        const gap = s.start.diff(prev.end, "minute");
        if (gap < MIN_GAP_MINUTES) return "GAP_TOO_SHORT";
      }

      const sIv = {
        startISO: s.start.toISOString(),
        endISO: s.end.toISOString(),
      };
      const hit = blocked.find((b) =>
        overlaps(sIv.startISO, sIv.endISO, b.startISO, b.endISO)
      );
      if (hit) return "OVERLAP_BLOCKED";
    }

    return null;
  }, [pickedDate, shifts, blocked, minStartTimeForPickedDay]);

  const canSubmit = !!pickedDate && shifts.length > 0 && !validationError;

  const canAddShift = React.useMemo(() => {
    if (!pickedDate || saving) return false;
    if (!shifts.length) return true;
    const last = shifts[shifts.length - 1];
    return !!(last?.start && last?.end);
  }, [pickedDate, saving, shifts]);

  /* -------- Submit (no UI message; backend/interceptor handles) -------- */
  const handleSave = async () => {
    if (!canSubmit) return;

    try {
      setSaving(true);

      if (isAdmin) {
        if (!resolvedKolId) return;
        await adminRegisterKolSchedule({ kolId: resolvedKolId, shifts });
      } else {
        if (!resolvedUserId) return;

        await registerKolAvailabilities({
          kolId: resolvedUserId, // backend: /schedule/{userId}
          date: pickedDate,
          shifts,
        });
      }

      setShifts([]);
      setOpenEndIdx(null);

      if (resolvedKolId) await reloadMonthSchedule();
      if (onSuccess) onSuccess();
    } catch (e) {
      // no UI message
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const loadingUI = resolving || (!isAdmin && !resolvedUserId);

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

                    const minStartTime = minStartTimeForPickedDay || undefined;

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
                          minTime={minStartTime}
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
                    disabled={!canSubmit || saving || loadingBlocked}
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
      </Box>
    </LocalizationProvider>
  );
}
