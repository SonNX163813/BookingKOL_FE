import React, { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const BookingScheduleStep = ({ onSelectSchedule, STYLE, TEXT }) => {
  const now = dayjs();
  const [selectedDate, setSelectedDate] = useState(now);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  // Khi chọn giờ bắt đầu
  const handleStartTimeChange = (time) => {
    if (!time) return;
    const selected = time.minute(0).second(0);
    const startAt = dayjs(
      `${selectedDate.format("YYYY-MM-DD")}T${selected.format("HH")}:00:00`
    );

    if (startAt.isBefore(now, "minute")) {
      toast.error("Không thể chọn thời gian trong quá khứ!");
      return;
    }

    setStartTime(selected);
    setEndTime(null);
  };

  // Khi chọn giờ kết thúc
  const handleEndTimeChange = (time) => {
    if (!time) return;
    if (!startTime) {
      toast.warn("Vui lòng chọn giờ bắt đầu trước!");
      return;
    }

    const selected = time.minute(0).second(0);

    let startAt = dayjs(
      `${selectedDate.format("YYYY-MM-DD")}T${startTime.format("HH")}:00:00`
    );
    let endAt = dayjs(
      `${selectedDate.format("YYYY-MM-DD")}T${selected.format("HH")}:00:00`
    );

    // Nếu kết thúc < bắt đầu → hiểu là qua ngày hôm sau
    if (endAt.isBefore(startAt)) {
      endAt = endAt.add(1, "day");
    }

    const diffHours = endAt.diff(startAt, "hour", true);

    if (diffHours > 3) {
      toast.error("Thời lượng không được vượt quá 3 tiếng!");
      return;
    }

    if (startAt.isBefore(now, "minute")) {
      toast.error("Không thể chọn thời gian trong quá khứ!");
      return;
    }

    setEndTime(selected);
    if (onSelectSchedule) onSelectSchedule(startAt, endAt);
  };

  /* ------------------------- RENDER ------------------------- */
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
            {TEXT?.form?.scheduleTitle || "Chọn ngày và giờ"}
          </Typography>
        </Stack>

        {/* Chọn ngày */}
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${STYLE.border}`,
            mb: 2,
          }}
        >
          <DateCalendar
            disablePast
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setStartTime(null);
              setEndTime(null);
            }}
          />
        </Box>

        {/* Chọn giờ bắt đầu và kết thúc */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TimePicker
            label="Giờ bắt đầu"
            ampm={false}
            views={["hours"]}
            value={startTime}
            onChange={handleStartTimeChange}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: STYLE.subtleSurface,
              },
            }}
          />
          <TimePicker
            label="Giờ kết thúc"
            ampm={false}
            views={["hours"]}
            value={endTime}
            onChange={handleEndTimeChange}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: STYLE.subtleSurface,
              },
            }}
          />
        </Stack>

        {/* Hiển thị kết quả */}
        {startTime && (
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: STYLE.textPrimary }}
          >
            Ngày bắt đầu:{" "}
            <Typography component="span" sx={{ color: STYLE.accent }}>
              {selectedDate.format("DD/MM/YYYY")}
            </Typography>
          </Typography>
        )}

        {startTime &&
          endTime &&
          (() => {
            let startAt = dayjs(
              `${selectedDate.format("YYYY-MM-DD")}T${startTime.format(
                "HH"
              )}:00:00`
            );
            let endAt = dayjs(
              `${selectedDate.format("YYYY-MM-DD")}T${endTime.format(
                "HH"
              )}:00:00`
            );

            // Nếu giờ kết thúc nhỏ hơn bắt đầu → hiểu là qua ngày hôm sau
            if (endAt.isBefore(startAt)) {
              endAt = endAt.add(1, "day");
            }

            const nextDay =
              endAt.date() !== selectedDate.date()
                ? ` (ngày ${endAt.format("DD/MM")})`
                : "";

            return (
              <Typography
                variant="subtitle2"
                sx={{ mt: 1, fontWeight: 600, color: STYLE.textPrimary }}
              >
                Thời gian:{" "}
                <Typography component="span" sx={{ color: STYLE.accent }}>
                  {startAt.format("HH:00")} {selectedDate.format("DD/MM")} →{" "}
                  {endAt.format("HH:00") + nextDay}
                </Typography>
              </Typography>
            );
          })()}

        {/* Gợi ý UX */}
        <Typography
          variant="body2"
          sx={{
            mt: 1.5,
            color: STYLE.textSecondary,
            fontStyle: "italic",
            fontSize: "0.85rem",
          }}
        >
          💡 Nếu chọn giờ kết thúc nhỏ hơn giờ bắt đầu, hệ thống sẽ tự hiểu là
          lịch qua ngày hôm sau.
        </Typography>
      </Box>
    </LocalizationProvider>
  );
};

export default BookingScheduleStep;
