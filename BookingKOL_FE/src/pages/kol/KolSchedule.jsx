import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePicker, Empty, Spin } from "antd";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useParams } from "react-router-dom";

import SchedulerGrid from "../../components/kol/kol-schedule/SchedulerGrid";
import { getKolTimeline } from "../../services/kol/KolAPI"; // bạn đã thêm hàm này trong KolAPI
// Nếu bạn đã tách normalize ra file riêng, hãy dùng:
// import { normalizeKolTimeline } from "./normalizeKolTimeline";

/** ====== Helper: build mảng ngày trong khoảng [fromDate, toDate] (YYYY-MM-DD) ====== */
const eachDateStrings = (fromIso, toIso) => {
  const out = [];
  let cur = dayjs(fromIso);
  const end = dayjs(toIso);
  while (cur.isSame(end) || cur.isBefore(end)) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return out;
};

/** ====== Helper: chuẩn hóa data API về Goals cho SchedulerGrid ======
 * API mẫu bạn cung cấp:
 * {
 *   id, startAt, endAt, status, note, timeLine, kolId, fullName, email, phone, avatarUrl
 * }
 * Ta sẽ map thành:
 * goals = {
 *   goalsTitle: [{ title: 'Lịch làm', colorCode: '#3b82f6' }],
 *   goalList: [
 *     { day: '18', task: [ { time:'06', description:[{...event}]} ] }
 *   ]
 * }
 */
const normalizeKolTimeline = (records = [], fromDate, toDate) => {
  // gom event theo ngày "YYYY-MM-DD"
  const byDate = {};
  for (const r of records) {
    const start = dayjs(r.startAt);
    const end = dayjs(r.endAt);
    if (!start.isValid() || !end.isValid()) continue;

    const dateKey = start.format("YYYY-MM-DD");
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push({
      id: r.id,
      description: r.note || "Lịch làm",
      status: r.status || "",
      colorCode: "#3b82f6", // có thể đổi theo status nếu muốn
      goalsTitle: "Lịch làm",
      startTime: start.format("HH:mm:ss"),
      endTime: end.format("HH:mm:ss"),
      goalId: r.kolId || "kol", // field bắt buộc cho TaskPopup hiện tại
      // các field còn lại cho đồng bộ type cũ:
      time: start.format("HH:mm:ss"),
      title: r.note || "Lịch làm",
      category: "",
      isDone: false,
    });
  }

  // đảm bảo có đủ ngày trong khoảng, kể cả ngày không có event
  const allDates = eachDateStrings(fromDate, toDate);
  const goalList = allDates.map((d) => {
    const day = d.slice(8, 10); // 'DD'
    const events = (byDate[d] || []).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    // group theo giờ (HH)
    const byHour = {};
    events.forEach((ev) => {
      const hourKey = ev.startTime.slice(0, 2); // 'HH'
      if (!byHour[hourKey]) byHour[hourKey] = [];
      byHour[hourKey].push(ev);
    });

    const task = Object.keys(byHour)
      .sort((a, b) => a.localeCompare(b))
      .map((hh) => ({
        time: hh,
        description: byHour[hh], // list GoalDetailsByTime
      }));

    return { day, task };
  });

  return {
    goalsTitle: [{ title: "Lịch làm", colorCode: "#3b82f6" }],
    goalList,
  };
};

/** ====== Helper: tính from/to theo range ====== */
const computeRange = (anchorIso, range) => {
  const d = dayjs(anchorIso);
  if (range === "day") {
    const from = d.startOf("day").format("YYYY-MM-DD");
    const to = d.endOf("day").format("YYYY-MM-DD");
    return { from, to, label: d.format("ddd, DD/MM/YYYY") };
  }
  if (range === "week") {
    // dayjs tuần mặc định bắt đầu chủ nhật
    const from = d.startOf("week").format("YYYY-MM-DD");
    const to = d.endOf("week").format("YYYY-MM-DD");
    return {
      from,
      to,
      label: `${dayjs(from).format("DD/MM/YYYY")} - ${dayjs(to).format(
        "DD/MM/YYYY"
      )}`,
    };
  }
  // month
  const from = d.startOf("month").format("YYYY-MM-DD");
  const to = d.endOf("month").format("YYYY-MM-DD");
  return { from, to, label: d.format("MMMM, YYYY") };
};

export default function KolSchedule() {
  const { kolId: routeKolId } = useParams();
  // bạn có thể truyền ?kolName nhưng không bắt buộc
  const [kolId, setKolId] = useState(routeKolId || "");
  const [range, setRange] = useState("week"); // 'day' | 'week' | 'month'
  const [anchorDate, setAnchorDate] = useState(dayjs().format("YYYY-MM-DD"));

  const { from, to, label } = useMemo(
    () => computeRange(anchorDate, range),
    [anchorDate, range]
  );

  const [loading, setLoading] = useState(false);
  const [goalsByDay, setGoalsByDay] = useState(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!kolId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getKolTimeline({
        kolId,
        startDate: from,
        endDate: to,
        page: 0,
        size: 500,
      });
      const records = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      const normalized = normalizeKolTimeline(records, from, to);
      setGoalsByDay(normalized);
    } catch (e) {
      console.error(e);
      setError("Không thể tải lịch làm.");
      setGoalsByDay(null);
    } finally {
      setLoading(false);
    }
  }, [kolId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onPrev = () => {
    const d = dayjs(anchorDate);
    const nextAnchor =
      range === "day"
        ? d.subtract(1, "day")
        : range === "week"
        ? d.subtract(1, "week")
        : d.subtract(1, "month");
    setAnchorDate(nextAnchor.format("YYYY-MM-DD"));
  };

  const onNext = () => {
    const d = dayjs(anchorDate);
    const nextAnchor =
      range === "day"
        ? d.add(1, "day")
        : range === "week"
        ? d.add(1, "week")
        : d.add(1, "month");
    setAnchorDate(nextAnchor.format("YYYY-MM-DD"));
  };

  const onPickDay = (d) => {
    if (!d) return;
    setAnchorDate(d.format("YYYY-MM-DD"));
  };

  return (
    <div className="w-full px-4 py-4">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100"
          >
            <IoIosArrowBack className="text-[#7bb4fb] md:text-[22px]" />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100"
          >
            <IoIosArrowForward className="text-[#7bb4fb] md:text-[22px]" />
          </button>

          <div className="ml-3">
            <DatePicker
              value={dayjs(anchorDate)}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={onPickDay}
              bordered
              size="middle"
            />
          </div>
        </div>

        {/* Range switch */}
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                range === r ? "bg-white shadow border" : "text-gray-600"
              }`}
            >
              {r === "day" ? "Ngày" : r === "week" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="text-[#0050ab] text-xl md:text-2xl font-bold mb-3">
        {label}
      </div>

      {/* Body */}
      <div className="w-full">
        {loading ? (
          <div className="w-full flex items-center justify-center py-16">
            <Spin />
          </div>
        ) : error ? (
          <div className="w-full flex items-center justify-center py-16">
            <Empty description={error} />
          </div>
        ) : !goalsByDay ? (
          <div className="w-full flex items-center justify-center py-16">
            <Empty description="Không có dữ liệu" />
          </div>
        ) : (
          <SchedulerGrid range={range} goalsByDay={goalsByDay} />
        )}
      </div>
    </div>
  );
}
