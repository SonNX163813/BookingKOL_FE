import dayjs from "dayjs";

function toHms(input) {
  if (!input) return "00:00:00";
  const d = dayjs(input);
  if (d.isValid()) return d.format("HH:mm:ss");
  const m = String(input).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const h = m[1].padStart(2, "0");
    const mi = m[2].padStart(2, "0");
    const s = (m[3] || "00").padStart(2, "0");
    return `${h}:${mi}:${s}`;
  }
  return "00:00:00";
}

// chuyển API timeline -> {goalsTitle, goalList}
export function normalizeKolTimelineToGoals(data) {
  const byDay = {};

  (data || []).forEach((item) => {
    const baseDay = dayjs(item.startAt || item.endAt || new Date()).format(
      "YYYY-MM-DD"
    );
    const colorBase = "#4C8DF6";

    if (Array.isArray(item.timeLine) && item.timeLine.length) {
      item.timeLine.forEach((tl) => {
        (byDay[baseDay] ||= []).push({
          id: tl.id || item.id,
          description:
            tl.note || item.note || tl.status || item.status || "Task",
          colorCode: colorBase,
          startTime: toHms(tl.start),
          endTime: toHms(tl.end),
          goalId: item.kolId,
          status: tl.status || item.status || "string",
          category: "",
          goalsTitle: item.fullName || "Lịch làm",
          title: tl.note || item.note || "",
          isDone: false,
        });
      });
    } else {
      (byDay[baseDay] ||= []).push({
        id: item.id,
        description: item.note || item.status || "Task",
        colorCode: colorBase,
        startTime: toHms(item.startAt),
        endTime: toHms(item.endAt),
        goalId: item.kolId,
        status: item.status || "string",
        category: "",
        goalsTitle: item.fullName || "Lịch làm",
        title: item.note || "",
        isDone: false,
      });
    }
  });

  const goalList = Object.entries(byDay).map(([ymd, tasks]) => {
    const descByHour = {};
    tasks.forEach((t) => {
      const hourKey = (t.startTime || "00:00:00").slice(0, 2);
      (descByHour[hourKey] ||= []).push(t);
    });
    const task = Object.keys(descByHour).map((hour) => ({
      time: hour,
      description: descByHour[hour].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    }));
    return {
      day: String(Number(ymd.slice(8, 10))), // "DD" không leading zero
      task,
    };
  });

  const goalsTitle = [{ title: "Lịch làm", colorCode: "#4C8DF6" }];

  return { goalsTitle, goalList };
}
