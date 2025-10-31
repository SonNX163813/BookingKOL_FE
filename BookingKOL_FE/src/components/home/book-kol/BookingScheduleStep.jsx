import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { getKolFreeTimeSlots } from "../../../services/booking/BookingAPI";
import "dayjs/locale/vi"; // import ngôn ngữ tiếng Việt cho dayjs

const BookingScheduleStep = ({ kolId, onSelectSchedule, STYLE, TEXT }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day"));
  const [freeTimeSlots, setFreeTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);
  const [activeSlotId, setActiveSlotId] = useState(null);

  /* -------------------- Lấy lịch trống từ API -------------------- */
  useEffect(() => {
    if (!kolId) return;

    const controller = new AbortController();
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const slots = await getKolFreeTimeSlots({
          kolId,
          signal: controller.signal,
        });
        setFreeTimeSlots(slots || []);
      } catch (error) {
        if (!controller.signal.aborted) setFreeTimeSlots([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchSlots();
    return () => controller.abort();
  }, [kolId]);

  /* -------------------- Gom nhóm slot theo ngày -------------------- */
  const slotsByDate = useMemo(() => {
    const map = {};
    freeTimeSlots.forEach(({ startAt, endAt }) => {
      const start = dayjs(startAt);
      const end = dayjs(endAt);
      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return;

      const dateKey = start.format("YYYY-MM-DD");
      map[dateKey] = map[dateKey] || [];

      const slot = {
        id: `${startAt}-${endAt}`,
        start,
        end,
        startHour: start.hour(),
        endHour: end.hour(),
        displayHours: [],
      };

      let cursor = start.clone();
      while (cursor.isBefore(end)) {
        const hourValue = cursor.hour();
        slot.displayHours.push({
          hour: hourValue,
          position: hourValue === slot.startHour ? "start" : "middle",
        });
        cursor = cursor.add(1, "hour");
      }

      const endHourValue = end.hour();
      const lastEntry = slot.displayHours.at(-1);

      if (!lastEntry || lastEntry.hour !== endHourValue) {
        slot.displayHours.push({
          hour: endHourValue,
          position: "end",
        });
      } else {
        slot.displayHours[slot.displayHours.length - 1] = {
          hour: lastEntry.hour,
          position: "end",
        };
      }

      map[dateKey].push(slot);
    });

    Object.values(map).forEach((slots) => {
      slots.sort((a, b) => a.startHour - b.startHour);
    });

    return map;
  }, [freeTimeSlots]);

  const selectedDateKey = selectedDate.format("YYYY-MM-DD");
  const highlightedDates = useMemo(
    () => new Set(Object.keys(slotsByDate)),
    [slotsByDate]
  );
  const dailySlots = useMemo(
    () => slotsByDate[selectedDateKey] || [],
    [slotsByDate, selectedDateKey]
  );
  useEffect(() => {
    if (!activeSlotId) return;
    if (!dailySlots.some((slot) => slot.id === activeSlotId)) {
      setActiveSlotId(null);
      setStartHour(null);
      setEndHour(null);
    }
  }, [dailySlots, activeSlotId]);

  const resolveSlotForHour = useCallback(
    (hour) => {
      let fallback = null;
      for (const slot of dailySlots) {
        if (hour >= slot.startHour && hour < slot.endHour) {
          return slot;
        }
        if (fallback === null && hour === slot.endHour) {
          fallback = slot;
        }
      }
      return fallback;
    },
    [dailySlots]
  );

  const HighlightedDay = useMemo(() => {
    const accentColor = STYLE?.accent || "#1976d2";
    const textPrimary = STYLE?.textPrimary;

    return function HighlightedDay(dayProps) {
      const { day, outsideCurrentMonth, disabled, selected } = dayProps;
      const dateKey =
        day && typeof day.format === "function"
          ? day.format("YYYY-MM-DD")
          : null;
      const isHighlighted =
        !!dateKey && highlightedDates.has(dateKey) && !outsideCurrentMonth;

      const highlightStyles =
        isHighlighted && !disabled
          ? {
              backgroundColor: selected
                ? accentColor
                : alpha(accentColor, 0.12),
              color: selected ? "#fff" : textPrimary,
              border: `1px solid ${alpha(accentColor, selected ? 0.48 : 0.28)}`,
              "&:hover": {
                backgroundColor: selected
                  ? accentColor
                  : alpha(accentColor, 0.24),
              },
            }
          : {};

      return (
        <PickersDay
          {...dayProps}
          sx={{ position: "relative", ...highlightStyles }}
        />
      );
    };
  }, [highlightedDates, STYLE?.accent, STYLE?.textPrimary]);

  /* -------------------- Xử lý chọn giờ -------------------- */
  const handleSelectHour = (hour) => {
    const currentSlot =
      activeSlotId && dailySlots
        ? dailySlots.find((slot) => slot.id === activeSlotId)
        : null;
    let slot = resolveSlotForHour(hour);

    if (
      currentSlot &&
      startHour !== null &&
      endHour === null &&
      hour >= currentSlot.startHour &&
      hour <= currentSlot.endHour
    ) {
      slot = currentSlot;
    }

    if (!slot) {
      toast.error("KOL không có lịch trong giờ này!");
      return;
    }

    if (!activeSlotId || activeSlotId !== slot.id) {
      setActiveSlotId(slot.id);
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    if (startHour === null) {
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    if (endHour === null && startHour === hour) {
      setStartHour(null);
      setEndHour(null);
      setActiveSlotId(null);
      return;
    }

    if (endHour === null) {
      const min = Math.min(startHour, hour);
      const max = Math.max(startHour, hour);

      if (min < slot.startHour || max > slot.endHour) {
        toast.error("Giờ bạn chọn không nằm trong cùng ca làm việc!");
        return;
      }

      const duration = max - min;

      if (duration < 1) {
        toast.warn("Thời lượng tối thiểu là 1 tiếng!");
        return;
      }
      if (duration > 3) {
        toast.warn("Thời lượng tối đa là 3 tiếng!");
        return;
      }

      setStartHour(min);
      setEndHour(max);
      return;
    }

    if (hour === startHour || hour === endHour) {
      setStartHour(null);
      setEndHour(null);
      setActiveSlotId(null);
      return;
    }

    if (hour > startHour && hour < endHour) {
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    setStartHour(hour);
    setEndHour(null);
  };

  const handleResetSelection = useCallback(() => {
    setStartHour(null);
    setEndHour(null);
    setActiveSlotId(null);
  }, []);

  /* -------------------- Gửi dữ liệu ra ngoài -------------------- */
  useEffect(() => {
    if (typeof onSelectSchedule !== "function") return;
    if (startHour === null || endHour === null) {
      onSelectSchedule(null, null);
      return;
    }
    const startTime = selectedDate.clone().hour(startHour).minute(0);
    const endTime = selectedDate.clone().hour(endHour).minute(0);
    onSelectSchedule(startTime, endTime);
  }, [startHour, endHour, selectedDate, onSelectSchedule]);

  /* -------------------- Render -------------------- */
  const hasSelection = startHour !== null;
  const hasCompletedSelection = startHour !== null && endHour !== null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box
        sx={{
          borderRadius: STYLE.radius,
          border: `1px solid ${STYLE.border}`,
          backgroundColor: STYLE.surface,
          boxShadow: STYLE.shadow,
          p: 3,
        }}
      >
        {/* Tiêu đề */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <AccessTimeRoundedIcon sx={{ color: STYLE.accent }} />
          <Typography
            variant="subtitle1"
            sx={{ color: STYLE.textPrimary, fontWeight: 600 }}
          >
            {TEXT?.form?.scheduleTitle || "Chọn lịch livestream"}
          </Typography>
        </Stack>

        {/* Chọn ngày */}
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${STYLE.border}`,
            mb: 3,
            overflow: "hidden",
          }}
        >
          <DateCalendar
            disablePast
            value={selectedDate}
            slots={{
              day: HighlightedDay,
            }}
            onChange={(date) => {
              if (!date) return;
              setSelectedDate(date.startOf("day"));
              setStartHour(null);
              setEndHour(null);
              setActiveSlotId(null);
            }}
            shouldDisableDate={(date) => {
              if (!date) return true;
              const key = date.format("YYYY-MM-DD");
              return !slotsByDate[key];
            }}
          />
        </Box>

        {/* Giờ livestream */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center", // ✅ căn giữa theo trục dọc
            flexWrap: "wrap", // ✅ giúp responsive nếu nhỏ
            gap: 1.5, // ✅ thêm khoảng cách giữa phần trái/phải
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 600,
                color: STYLE.textPrimary,
                fontSize: "1rem",
              }}
            >
              Chọn khung giờ livestream
            </Typography>
            <Typography
              sx={{ color: STYLE.textSecondary, fontSize: "0.85rem", mt: 0.5 }}
            >
              Chọn giờ bắt đầu và giờ kết thúc (tối đa 3 tiếng)
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={handleResetSelection}
            sx={{
              fontWeight: 600,
              px: 2.5,
              py: 0.8,
              borderRadius: 2,
              textTransform: "none",
              color: STYLE.accent,
              borderColor: STYLE.accent,
              "&:hover": {
                backgroundColor: alpha(STYLE.accent, 0.08),
              },
            }}
          >
            Đặt lại
          </Button>
        </Box>

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography sx={{ color: STYLE.textSecondary }}>
              Đang tải lịch trống...
            </Typography>
          </Stack>
        ) : dailySlots.length === 0 ? (
          <Typography sx={{ color: STYLE.textSecondary }}>
            Không có lịch trống trong ngày này.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {dailySlots.map((slot, index) => {
              const slotDisabled =
                !!activeSlotId &&
                activeSlotId !== slot.id &&
                startHour !== null;
              return (
                <Box key={`${slot.id}-${index}`}>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: STYLE.textSecondary,
                      fontWeight: 500,
                      mb: 1,
                    }}
                  >
                    {`Khung giờ: ${slot.start.format(
                      "HH:mm"
                    )} - ${slot.end.format("HH:mm")}`}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(80px, 1fr))",
                      gap: 1.5,
                    }}
                  >
                    {slot.displayHours.map(({ hour, position }, idx) => {
                      const belongsToActiveSlot = slot.id === activeSlotId;
                      const isStart =
                        belongsToActiveSlot &&
                        startHour !== null &&
                        hour === startHour;
                      const isEnd =
                        belongsToActiveSlot &&
                        endHour !== null &&
                        hour === endHour;
                      const isInRange =
                        belongsToActiveSlot &&
                        startHour !== null &&
                        endHour !== null &&
                        hour > startHour &&
                        hour < endHour;
                      const active = isStart || isEnd || isInRange;
                      const key = `${slot.id}-${hour}-${position}-${idx}`;
                      const baseBg = slotDisabled
                        ? "#f2f2f2"
                        : active
                        ? STYLE.accent
                        : "#fff";

                      return (
                        <Button
                          key={key}
                          onClick={() => handleSelectHour(hour)}
                          variant={active ? "contained" : "outlined"}
                          disabled={slotDisabled}
                          sx={{
                            borderRadius:
                              !belongsToActiveSlot || !active
                                ? "12px"
                                : isStart && endHour !== null
                                ? "12px 0 0 12px"
                                : isEnd
                                ? "0 12px 12px 0"
                                : isInRange
                                ? "0"
                                : "12px",
                            height: 48,
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: slotDisabled
                              ? STYLE.textSecondary
                              : active
                              ? "#fff"
                              : STYLE.textPrimary,
                            backgroundColor: baseBg,

                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: slotDisabled
                                ? "none"
                                : "translateY(-2px)",
                              backgroundColor: slotDisabled
                                ? "#e8e8e8"
                                : active
                                ? STYLE.accentHover
                                : alpha(STYLE.textSecondary, 0.12),
                            },
                          }}
                        >
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}

        {/* Hiển thị thời gian chọn */}
        {hasSelection && (
          <Stack
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 3, textAlign: "center" }}
          >
            <Typography sx={{ fontWeight: 600, color: STYLE.textPrimary }}>
              {hasCompletedSelection ? (
                <>
                  Thời gian livestream:&nbsp;
                  <Typography component="span" sx={{ color: STYLE.accent }}>
                    {`${startHour}:00 - ${endHour}:00, ${selectedDate.format(
                      "DD/MM"
                    )}`}
                  </Typography>
                </>
              ) : (
                <>
                  Giờ bắt đầu:&nbsp;
                  <Typography component="span" sx={{ color: STYLE.accent }}>
                    {`${startHour}:00, ${selectedDate.format("DD/MM")}`}
                  </Typography>
                </>
              )}
            </Typography>
          </Stack>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default BookingScheduleStep;
