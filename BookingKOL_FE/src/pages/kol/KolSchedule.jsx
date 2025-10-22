// src/pages/kol/KolSchedule.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/vi";
import { DatePicker, Empty, message } from "antd";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import SchedulerGrid from "../../components/kol/kol-schedule/SchedulerGrid";
import {
  getKolProfileByUserId,
  getKolTimeline,
} from "../../services/kol/KolAPI";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

dayjs.extend(isoWeek);
dayjs.locale("vi");

/* ================= CONFIG ================= */
const ENABLE_MOCK_FALLBACK = true;
const DEFAULT_COLOR_AVAILABLE = "#3b82f6"; // Xanh dương: lịch rảnh
const DEFAULT_COLOR_UNAVAILABLE = "#ef4444"; // Đỏ: booking

/** Tạo mock items trong khoảng from..to */
function makeMockItems(from, to) {
  const items = [];
  for (
    let d = dayjs(from).startOf("day");
    d.isBefore(to);
    d = d.add(1, "day")
  ) {
    const s1 = d.hour(9).minute(0).second(0);
    const e1 = d.hour(11).minute(0).second(0);
    const s2 = d.hour(14).minute(0).second(0);
    const e2 = d.hour(16).minute(0).second(0);
    items.push(
      // Lịch rảnh (AVAILABLE) — xanh
      {
        id: `mk-${d.format("YYYYMMDD")}-1`,
        startAt: s1.toISOString(),
        endAt: e1.toISOString(),
        status: "AVAILABLE",
        note: "Lịch rảnh",
        color: DEFAULT_COLOR_AVAILABLE,
      },
      // Booking — đỏ (thêm bookingTitle để nhận diện)
      {
        id: `mk-${d.format("YYYYMMDD")}-2`,
        startAt: s2.toISOString(),
        endAt: e2.toISOString(),
        status: "BOOKING",
        bookingTitle: "Booking demo",
        color: DEFAULT_COLOR_UNAVAILABLE,
      }
    );
  }
  return items;
}

/* ================= Helpers parse/map ================= */
const fmtDay = (d) => dayjs(d).format("DD");
const fmtHour = (d) => dayjs(d).format("HH");

const parseStart = (item) => {
  const raw =
    item?.startTime ||
    item?.startDate ||
    item?.startAt ||
    item?.startDateTime ||
    item?.start;
  return dayjs(raw);
};

const parseEnd = (item, fallback) => {
  const raw =
    item?.endTime ||
    item?.endDate ||
    item?.endAt ||
    item?.endDateTime ||
    item?.end;
  const d = dayjs(raw);
  return d.isValid() ? d : dayjs(fallback).add(1, "hour");
};

// Nhận diện booking vs availability
const isBookingLike = (item) => {
  const s = String(item?.status || "").toLowerCase();
  return (
    s.includes("book") ||
    !!item?.bookingTitle ||
    !!item?.bookingId ||
    !!item?.orderId ||
    !!item?.campaignTitle
  );
};

const getColor = (item) =>
  isBookingLike(item) ? DEFAULT_COLOR_UNAVAILABLE : DEFAULT_COLOR_AVAILABLE;

// Title dùng cho thẻ hiển thị
const getTitle = (item) =>
  isBookingLike(item)
    ? item?.bookingTitle || item?.title || item?.note || "Booking"
    : "Lịch rảnh"; // đổi Available -> Lịch rảnh

/**
 * Chuẩn hóa dữ liệu về dạng:
 * { goalsTitle: [], goalList: [{ day: "DD", task: [{ time: "HH", description: Task[] }] }] }
 * Trong đó mỗi Task có:
 *   { id, description, colorCode, startTime, endTime, status, isBooking, ... }
 */
const toGoalsShape = (items, rangeFrom, rangeTo) => {
  const buckets = {};
  items.forEach((raw, idx) => {
    const s = parseStart(raw);
    if (!s.isValid()) return;
    if (dayjs(s).isBefore(dayjs(rangeFrom), "day")) return;
    if (dayjs(s).isAfter(dayjs(rangeTo), "day")) return;

    const e = parseEnd(raw, s);
    const dayKey = fmtDay(s);
    const hourKey = fmtHour(s);

    const rec = {
      id: raw.id || `${s.toISOString()}_${idx}`,
      description: getTitle(raw), // "Lịch rảnh" hoặc bookingTitle
      colorCode: getColor(raw), // xanh cho rảnh, đỏ cho booking
      goalsTitle: raw.goalTitle || "",
      status: raw.status || (isBookingLike(raw) ? "BOOKING" : "AVAILABLE"),
      startTime: s.format("HH:mm:ss"),
      endTime: e.format("HH:mm:ss"),
      isBooking: isBookingLike(raw),

      // giữ thêm nếu cần
      category: raw.category || "",
      isDone: !!raw.isDone,
      goalId: raw.goalId || "",
    };

    if (!buckets[dayKey]) buckets[dayKey] = {};
    if (!buckets[dayKey][hourKey]) buckets[dayKey][hourKey] = [];
    if (!buckets[dayKey][hourKey].some((x) => x.id === rec.id)) {
      buckets[dayKey][hourKey].push(rec);
    }
  });

  const goalList = Object.keys(buckets)
    .sort((a, b) => Number(a) - Number(b))
    .map((dayKey) => {
      const hours = Object.keys(buckets[dayKey]).sort(
        (a, b) => Number(a) - Number(b)
      );
      const task = hours.map((hh) => ({
        time: hh,
        description: buckets[dayKey][hh].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        ),
      }));
      return { day: dayKey, task };
    });

  return { goalsTitle: [], goalList };
};

export default function KolSchedule() {
  const { kolId: kolIdParam } = useParams();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;

  const [range, setRange] = useState("week"); // "day" | "week" | "month"
  const [anchorDate, setAnchorDate] = useState(dayjs());
  const [kolId, setKolId] = useState(kolIdParam || null);
  const [loading, setLoading] = useState(false);
  const [goalsByDay, setGoalsByDay] = useState({
    goalsTitle: [],
    goalList: [],
  });

  // Tính from/to + nhãn header theo range
  const { fromDate, toDate, headerLabel } = useMemo(() => {
    if (range === "day") {
      const from = anchorDate.startOf("day");
      const to = anchorDate.endOf("day");
      return {
        fromDate: from,
        toDate: to,
        headerLabel: `${anchorDate.format("dddd")}, ${anchorDate.format(
          "DD/MM/YYYY"
        )}`,
      };
    }
    if (range === "week") {
      const from = anchorDate.startOf("isoWeek"); // Monday
      const to = anchorDate.endOf("isoWeek");
      return {
        fromDate: from,
        toDate: to,
        headerLabel: `${from.format("DD/MM/YYYY")} - ${to.format(
          "DD/MM/YYYY"
        )}`,
      };
    }
    // month
    const from = anchorDate.startOf("month").startOf("isoWeek");
    const to = anchorDate.endOf("month").endOf("isoWeek");
    return {
      fromDate: from,
      toDate: to,
      headerLabel: anchorDate.format("MMMM, YYYY"),
    };
  }, [range, anchorDate]);

  // Resolve kolId nếu thiếu: lấy theo userId
  useEffect(() => {
    let mounted = true;
    const resolveKolId = async () => {
      if (kolIdParam) {
        setKolId(kolIdParam);
        return;
      }
      if (!userId) return;
      try {
        const me = await getKolProfileByUserId(userId);
        if (mounted) setKolId(me?.id || null);
      } catch {
        if (ENABLE_MOCK_FALLBACK) {
          console.warn("[Schedule] Không lấy được KOL ID, dùng mock.");
          setKolId(null);
        } else {
          message.error("Không lấy được thông tin KOL.");
        }
      }
    };
    resolveKolId();
    return () => {
      mounted = false;
    };
  }, [kolIdParam, userId]);

  // Gọi API timeline
  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      let list = [];
      if (kolId) {
        const payload = await getKolTimeline({
          kolId,
          startDate: fromDate.toISOString(),
          endDate: toDate.toISOString(),
          page: 0,
          size: 500,
        });
        list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
      }

      if ((!kolId || !list.length) && ENABLE_MOCK_FALLBACK) {
        console.warn("[Schedule] Dùng mock fallback");
        list = makeMockItems(fromDate, toDate);
      }

      setGoalsByDay(toGoalsShape(list, fromDate, toDate));
    } catch (e) {
      console.error(e);
      if (ENABLE_MOCK_FALLBACK) {
        console.warn("[Schedule] API lỗi, dùng mock fallback");
        setGoalsByDay(
          toGoalsShape(makeMockItems(fromDate, toDate), fromDate, toDate)
        );
      } else {
        message.error("Không tải được lịch làm việc.");
        setGoalsByDay({ goalsTitle: [], goalList: [] });
      }
    } finally {
      setLoading(false);
    }
  }, [kolId, fromDate, toDate]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Điều hướng prev/next
  const handlePrev = () => {
    if (range === "day") setAnchorDate((d) => d.subtract(1, "day"));
    else if (range === "week") setAnchorDate((d) => d.subtract(1, "week"));
    else setAnchorDate((d) => d.subtract(1, "month"));
  };
  const handleNext = () => {
    if (range === "day") setAnchorDate((d) => d.add(1, "day"));
    else if (range === "week") setAnchorDate((d) => d.add(1, "week"));
    else setAnchorDate((d) => d.add(1, "month"));
  };
  const handleRangeChange = (val) => setRange(val);
  const handleDateChange = (d) => d && setAnchorDate(d);

  const showEmpty = !loading && goalsByDay?.goalList?.length === 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 mt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <IoIosArrowBack className="text-[#7bb4fb] md:!text-[22px]" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <IoIosArrowForward className="text-[#7bb4fb] md:!text-[22px]" />
          </button>

          <DatePicker
            value={anchorDate}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </div>

        <p className="text-[#0050ab] text-xl md:text-2xl lg:text-3xl font-bold capitalize">
          {headerLabel}
        </p>

        <div className="rounded-full border flex overflow-hidden">
          <button
            className={`px-4 py-1 ${
              range === "day" ? "bg-[#0050ab] text-white" : ""
            }`}
            onClick={() => handleRangeChange("day")}
          >
            Ngày
          </button>
          <button
            className={`px-4 py-1 ${
              range === "week" ? "bg-[#0050ab] text-white" : ""
            }`}
            onClick={() => handleRangeChange("week")}
          >
            Tuần
          </button>
          <button
            className={`px-4 py-1 ${
              range === "month" ? "bg-[#0050ab] text-white" : ""
            }`}
            onClick={() => handleRangeChange("month")}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Grid */}
      {showEmpty ? (
        <div className="w-full h-[480px] flex items-center justify-center">
          <Empty description="Không có dữ liệu" />
        </div>
      ) : (
        <SchedulerGrid
          range={range}
          dayDuties={goalsByDay}
          fromDate={fromDate.format("YYYY-MM-DD")}
          toDate={toDate.format("YYYY-MM-DD")}
        />
      )}
    </div>
  );
}
