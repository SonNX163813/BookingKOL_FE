import React, { useMemo } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

const toDayjs = (value) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const mergeDateAndTime = (date, time) => {
  const dateMoment = toDayjs(date)?.startOf("day");
  const timeMoment = toDayjs(time);
  if (!dateMoment || !timeMoment) return null;
  return dateMoment
    .hour(timeMoment.hour())
    .minute(timeMoment.minute())
    .second(0)
    .millisecond(0);
};

const formatIso = (value) =>
  value ? value.format("YYYY-MM-DDTHH:mm:ssZ") : null;

const BookingScheduleStep = ({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  STYLE,
  TEXT,
}) => {
  const normalizedDate = useMemo(
    () => toDayjs(selectedDate)?.startOf("day") ?? null,
    [selectedDate]
  );

  const startMoment = useMemo(() => {
    if (!selectedTime) return null;
    if (dayjs.isDayjs(selectedTime.start)) return selectedTime.start;
    if (selectedTime.startAt) return toDayjs(selectedTime.startAt);
    if (dayjs.isDayjs(selectedTime))
      return mergeDateAndTime(normalizedDate, selectedTime);
    return null;
  }, [selectedTime, normalizedDate]);

  const endMoment = useMemo(() => {
    if (!selectedTime) return null;
    if (dayjs.isDayjs(selectedTime.end)) return selectedTime.end;
    if (selectedTime.endAt) return toDayjs(selectedTime.endAt);
    return null;
  }, [selectedTime]);

  // Giờ tối thiểu cho cùng ngày hôm nay
  const minSelectableTime = useMemo(() => {
    if (!normalizedDate) return null;
    const now = dayjs().second(0).millisecond(0);
    return normalizedDate.isSame(now, "day") ? now : null;
  }, [normalizedDate]);

  // Giờ tối thiểu cho giờ kết thúc
  const minEndTime = useMemo(() => {
    if (!startMoment) return null;
    return startMoment.add(1, "minute");
  }, [startMoment]);

  // ✅ So sánh hợp lý giữa start và end
  const isEndTimeValid = useMemo(() => {
    if (!startMoment || !endMoment) return true;
    const sameDay = startMoment.isSame(endMoment, "day");
    return sameDay
      ? endMoment.isAfter(startMoment)
      : endMoment.isAfter(startMoment, "day");
  }, [startMoment, endMoment]);

  // 🟦 Chọn ngày bắt đầu
  const handleStartDateChange = (value) => {
    if (!value) {
      onSelectDate?.(null);
      onSelectTime?.(null);
      return;
    }

    const newDate = value.startOf("day");
    onSelectDate?.(newDate);

    if (!onSelectTime) return;

    const nextStart = mergeDateAndTime(newDate, startMoment || dayjs());
    let nextEnd = endMoment ? mergeDateAndTime(newDate, endMoment) : null;

    if (nextEnd && !nextEnd.isAfter(nextStart)) nextEnd = null;

    onSelectTime({
      start: nextStart,
      end: nextEnd,
      startAt: formatIso(nextStart),
      endAt: formatIso(nextEnd),
    });
  };

  // 🟩 Chọn ngày kết thúc
  const handleEndDateChange = (value) => {
    if (!onSelectTime || !value) return;
    const newDate = value.startOf("day");

    let newEndMoment = endMoment
      ? newDate.hour(endMoment.hour()).minute(endMoment.minute())
      : newDate
          .hour(startMoment?.hour() ?? 0)
          .minute(startMoment?.minute() ?? 0);

    // Nếu ngày kết thúc < ngày bắt đầu → đẩy lên cùng hoặc sau
    if (startMoment && newDate.isBefore(startMoment, "day")) {
      newEndMoment = startMoment
        .add(1, "day")
        .hour(startMoment.hour())
        .minute(startMoment.minute());
    }

    onSelectTime({
      start: startMoment,
      end: newEndMoment,
      startAt: formatIso(startMoment),
      endAt: formatIso(newEndMoment),
    });
  };

  // 🟨 Chọn giờ bắt đầu
  const handleStartTimeChange = (value) => {
    if (!onSelectTime || !normalizedDate) return;
    if (!value) {
      onSelectTime(
        selectedTime?.end ? { start: null, end: selectedTime.end } : null
      );
      return;
    }

    const sanitized = toDayjs(value)?.second(0).millisecond(0);
    if (!sanitized) return;
    const nextStart = mergeDateAndTime(normalizedDate, sanitized);

    if (minSelectableTime && nextStart.isBefore(minSelectableTime)) return;

    let nextEnd = endMoment;
    if (
      nextEnd &&
      nextEnd.isSame(nextStart, "day") &&
      !nextEnd.isAfter(nextStart)
    )
      nextEnd = null;

    onSelectTime({
      start: nextStart,
      end: nextEnd,
      startAt: formatIso(nextStart),
      endAt: formatIso(nextEnd),
    });
  };

  // 🟥 Chọn giờ kết thúc
  const handleEndTimeChange = (value) => {
    if (!onSelectTime || !startMoment || !normalizedDate) return;
    if (!value) {
      onSelectTime({ start: startMoment, end: null });
      return;
    }

    const sanitized = toDayjs(value)?.second(0).millisecond(0);
    if (!sanitized) return;
    const nextEnd = mergeDateAndTime(endMoment ?? normalizedDate, sanitized);

    const sameDay = nextEnd.isSame(startMoment, "day");
    if (sameDay && !nextEnd.isAfter(startMoment)) return; // cùng ngày phải sau start

    onSelectTime({
      start: startMoment,
      end: nextEnd,
      startAt: formatIso(startMoment),
      endAt: formatIso(nextEnd),
    });
  };

  const hasStart = Boolean(startMoment);
  const hasEnd = Boolean(endMoment);

  const summaryMessage = hasStart
    ? hasEnd
      ? isEndTimeValid
        ? `Bắt đầu: ${startMoment.format(
            "DD/MM/YYYY HH:mm"
          )}\nKết thúc: ${endMoment.format("DD/MM/YYYY HH:mm")}`
        : "⚠️ Giờ kết thúc phải sau giờ bắt đầu (nếu cùng ngày)"
      : `Bắt đầu: ${startMoment.format("DD/MM/YYYY HH:mm")}`
    : "Vui lòng chọn thời gian bắt đầu";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={3}>
        <Box
          sx={{
            borderRadius: STYLE.radius,
            border: `1px solid ${STYLE.border}`,
            backgroundColor: STYLE.surface,
            boxShadow: STYLE.shadow,
            p: 3,
          }}
        >
          <Stack spacing={2}>
            {/* Title */}
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeRoundedIcon sx={{ color: STYLE.accent }} />
              <Typography
                variant="subtitle1"
                sx={{ color: STYLE.textPrimary, fontWeight: 600 }}
              >
                {TEXT?.form?.scheduleTitle || "Lịch đặt thời gian"}
              </Typography>
            </Stack>

            {/* Start Date & Time */}
            <Stack spacing={1}>
              <Typography sx={{ color: STYLE.textSecondary, fontWeight: 500 }}>
                Thời gian bắt đầu
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker
                  value={startMoment}
                  onChange={handleStartDateChange}
                  disablePast
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true, placeholder: "Chọn ngày" },
                  }}
                />
                <TimePicker
                  value={startMoment}
                  onChange={handleStartTimeChange}
                  ampm={false}
                  format="HH:mm"
                  minTime={minSelectableTime ?? undefined}
                  slotProps={{
                    textField: { fullWidth: true, placeholder: "Chọn giờ" },
                  }}
                />
              </Stack>
            </Stack>

            {/* End Date & Time */}
            <Stack spacing={1}>
              <Typography sx={{ color: STYLE.textSecondary, fontWeight: 500 }}>
                Thời gian kết thúc
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker
                  value={endMoment}
                  onChange={handleEndDateChange}
                  disablePast
                  format="DD/MM/YYYY"
                  minDate={startMoment || undefined}
                  disabled={!hasStart}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: hasStart
                        ? "Chọn ngày"
                        : "Chọn thời gian bắt đầu trước",
                    },
                  }}
                />
                <TimePicker
                  value={endMoment}
                  onChange={handleEndTimeChange}
                  ampm={false}
                  format="HH:mm"
                  views={["hours", "minutes"]}
                  minutesStep={1}
                  minTime={minEndTime ?? undefined}
                  disabled={!hasStart}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: hasStart
                        ? "Chọn giờ"
                        : "Chọn thời gian bắt đầu trước",
                    },
                  }}
                />
              </Stack>
            </Stack>

            {/* Summary */}
            <Alert
              severity={
                hasStart && hasEnd && isEndTimeValid
                  ? "success"
                  : !isEndTimeValid
                  ? "error"
                  : "info"
              }
              icon={
                !isEndTimeValid ? (
                  <WarningRoundedIcon />
                ) : hasStart && hasEnd ? undefined : (
                  <InfoRoundedIcon />
                )
              }
              sx={{
                borderRadius: "16px",
                border: `1px dashed ${STYLE.border}`,
                backgroundColor:
                  hasStart && hasEnd && isEndTimeValid
                    ? "rgba(74, 116, 218, 0.08)"
                    : !isEndTimeValid
                    ? "rgba(211, 47, 47, 0.08)"
                    : STYLE.subtleSurface,
                whiteSpace: "pre-line",
              }}
            >
              {summaryMessage}
            </Alert>
          </Stack>
        </Box>
      </Stack>
    </LocalizationProvider>
  );
};

export default BookingScheduleStep;
