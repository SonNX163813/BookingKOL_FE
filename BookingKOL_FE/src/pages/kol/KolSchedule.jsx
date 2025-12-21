import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/vi";
import { ConfigProvider, DatePicker, message } from "antd";
import viVN from "antd/locale/vi_VN";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import SchedulerGrid from "../../components/kol/kol-schedule/SchedulerGrid";
import { getKolProfileByUserId } from "../../services/kol/KolAPI";

// ✅ IMPORTANT: lấy fetchDayDuties từ ScheduleAPI (file bạn vừa sửa)
import { fetchDayDuties } from "../../services/kol/ScheduleAPI";

import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ===== Việt hoá dayjs: T2..T7, CN và tuần bắt đầu từ Thứ Hai ===== */
dayjs.extend(isoWeek);
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
});

export default function KolSchedule() {
  const { kolId: kolIdParam } = useParams();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;

  const [range, setRange] = useState("week"); // "day" | "week" | "month"
  const [anchorDate, setAnchorDate] = useState(dayjs());
  const [kolId, setKolId] = useState(kolIdParam || null);
  const [loading, setLoading] = useState(false);
  const [dayDuties, setDayDuties] = useState({ goalList: [] });

  // from/to + nhãn header theo range
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
      const from = anchorDate.startOf("isoWeek");
      const to = anchorDate.endOf("isoWeek");
      return {
        fromDate: from,
        toDate: to,
        headerLabel: `${from.format("DD/MM/YYYY")} - ${to.format(
          "DD/MM/YYYY"
        )}`,
      };
    }
    const from = anchorDate.startOf("month").startOf("day");
    const to = anchorDate.endOf("month").endOf("day");
    return {
      fromDate: from,
      toDate: to,
      headerLabel: anchorDate.format("MMMM, YYYY"),
    };
  }, [range, anchorDate]);

  // Resolve kolId nếu thiếu: lấy theo userId
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (kolIdParam) {
        setKolId(kolIdParam);
        return;
      }
      if (!userId) return;
      try {
        const me = await getKolProfileByUserId(userId);
        if (mounted) setKolId(me?.id || null);
      } catch {
        message.error("Không lấy được thông tin KOL.");
        if (mounted) setKolId(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kolIdParam, userId]);

  // Load lịch
  const load = useCallback(async () => {
    if (!kolId) return;
    setLoading(true);
    try {
      // ✅ dùng fetchDayDuties từ ScheduleAPI -> slot booking sẽ có workTimeId/kolWorkTimeId
      const data = await fetchDayDuties({ kolId, range, fromDate });
      setDayDuties(data || { goalList: [] });
    } catch (e) {
      console.warn("[Schedule] load failed:", e);
      setDayDuties({ goalList: [] });
      message.error("Không tải được lịch làm việc.");
    } finally {
      setLoading(false);
    }
  }, [kolId, range, fromDate]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <ConfigProvider locale={viVN}>
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

        {/* Lưới lịch */}
        <SchedulerGrid
          range={range}
          dayDuties={dayDuties}
          fromDate={fromDate}
          toDate={toDate}
        />

        {loading && (
          <div className="mt-2 text-sm text-gray-500">Đang tải lịch…</div>
        )}
      </div>
    </ConfigProvider>
  );
}
