import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { getKolFreeTimeSlots } from "../../../services/booking/BookingAPI";

const BookingScheduleStep = ({ kolId, onSelectSchedule, STYLE, TEXT }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day"));
  const [freeTimeSlots, setFreeTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);

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
      map[dateKey] = map[dateKey] || new Set();
      let time = start.clone();
      while (time.isBefore(end) || time.hour() === end.hour()) {
        map[dateKey].add(time.hour());
        time = time.add(1, "hour");
      }
    });
    return map;
  }, [freeTimeSlots]);

  const selectedDateKey = selectedDate.format("YYYY-MM-DD");
  const availableHours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    []
  );

  const kolAvailableHours = useMemo(
    () => new Set(slotsByDate[selectedDateKey] || []),
    [slotsByDate, selectedDateKey]
  );

  /* -------------------- Xử lý chọn giờ -------------------- */
  const handleSelectHour = (hour) => {
    if (!kolAvailableHours.has(hour)) {
      toast.error("KOL không có lịch cho giờ đó!");
      return;
    }

    if (startHour === null) {
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    if (endHour === null) {
      const min = Math.min(startHour, hour);
      const max = Math.max(startHour, hour);
      const duration = max - min;

      if (duration < 1) {
        toast.warn("Khoảng thời gian tối thiểu là 1 tiếng!");
        return;
      }
      if (duration > 3) {
        toast.warn("Khoảng thời gian tối đa là 3 tiếng!");
        return;
      }

      // kiểm tra có đủ slot cho toàn bộ khoảng
      for (let h = min; h < max; h++) {
        if (!kolAvailableHours.has(h)) {
          toast.error("KOL không có lịch cho giờ đó!");
          return;
        }
      }

      setStartHour(min);
      setEndHour(max);
    } else {
      // reset nếu chọn lại
      setStartHour(hour);
      setEndHour(null);
    }
  };

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
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            onChange={(date) => {
              if (!date) return;
              setSelectedDate(date.startOf("day"));
              setStartHour(null);
              setEndHour(null);
            }}
            shouldDisableDate={(date) => {
              if (!date) return true;
              const key = date.format("YYYY-MM-DD");
              return !slotsByDate[key];
            }}
          />
        </Box>
        {/* Giờ livestream bắt đầu */}
        <Typography
          sx={{
            fontWeight: 600,
            mb: 1.5,
            color: STYLE.textPrimary,
            fontSize: "1rem",
          }}
        >
          Giờ livestream
        </Typography>

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography sx={{ color: STYLE.textSecondary }}>
              Đang tải...
            </Typography>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: 1.5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {availableHours.map((h) => {
              const isStart = h === startHour;
              const isEnd = h === endHour;
              const isInRange =
                startHour !== null &&
                endHour !== null &&
                h > startHour &&
                h < endHour;
              const active = isStart || isEnd || isInRange;
              const available = kolAvailableHours.has(h);

              return (
                <Button
                  key={h}
                  onClick={() => handleSelectHour(h)}
                  disabled={!available}
                  variant={active ? "contained" : "outlined"}
                  sx={{
                    borderRadius:
                      isStart && endHour !== null
                        ? "12px 0 0 12px"
                        : isEnd
                        ? "0 12px 12px 0"
                        : isInRange
                        ? "0"
                        : "12px",
                    height: 48,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: active
                      ? "#fff"
                      : available
                      ? STYLE.textPrimary
                      : STYLE.textSecondary,
                    backgroundColor: active
                      ? STYLE.accent
                      : available
                      ? "#fff"
                      : "rgba(0,0,0,0.05)",
                    borderColor: available ? STYLE.border : "transparent",
                    borderRight: isInRange || isStart ? "none" : undefined,
                    opacity: available ? 1 : 0.4,
                    transition: "all 0.2s ease",
                    position: "relative",
                    zIndex: active ? 2 : 1,
                    "&:hover": {
                      transform: available ? "translateY(-2px)" : "none",
                      backgroundColor: available
                        ? active
                          ? STYLE.accentHover
                          : STYLE.accentHover + "20"
                        : "rgba(0,0,0,0.05)",
                      zIndex: 3,
                    },
                  }}
                >
                  {`${h.toString().padStart(2, "0")}:00`}
                </Button>
              );
            })}
          </Box>
        )}

        {/* Hiển thị thời gian chọn */}
        {startHour !== null && endHour !== null && (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 600, color: STYLE.textPrimary }}>
              Khoảng livestream:&nbsp;
              <Typography component="span" sx={{ color: STYLE.accent }}>
                {`${startHour}:00 - ${endHour}:00, ${selectedDate.format(
                  "DD/MM"
                )}`}
              </Typography>
            </Typography>
          </Box>
        )}

        {/* Hiển thị thời gian chọn */}
        {/* {startHour !== null && endHour !== null && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 600, color: STYLE.textPrimary }}>
              Khoảng livestream:&nbsp;
              <Typography component="span" sx={{ color: STYLE.accent }}>
                {`${startHour}:00 - ${endHour}:00, ${selectedDate.format(
                  "DD/MM"
                )}`}
              </Typography>
            </Typography>
          </Box>
        )} */}
      </Box>
    </LocalizationProvider>
  );
};

export default BookingScheduleStep;
