// src/pages/admin/management-user/management-kol/AdminViewKolSchedule.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/vi";
import { ConfigProvider, DatePicker, message, Modal } from "antd";
import viVN from "antd/locale/vi_VN";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import SchedulerGrid from "../../../../components/kol/kol-schedule/SchedulerGrid";
import { adminFetchKolDayDuties } from "../../../../services/admin/AdminScheduleAPI";
import KolWorkRegistrationMui from "../../../kol/KolWorkRegistration";

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

export default function AdminViewKolSchedule() {
  const { kolId } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const qView = (params.get("view") || "month").toLowerCase();
  const initialRange = ["day", "week", "month"].includes(qView)
    ? qView
    : "month";

  const [range, setRange] = useState(initialRange); // "day" | "week" | "month"
  const [anchorDate, setAnchorDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [dayDuties, setDayDuties] = useState({ goalList: [] });

  const [openWorkReg, setOpenWorkReg] = useState(false);

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

  // Tải lịch: free-time + timeline (Admin API)
  const load = useCallback(async () => {
    if (!kolId) return;
    setLoading(true);
    try {
      const data = await adminFetchKolDayDuties({
        kolId,
        range,
        fromDate: anchorDate,
      });
      setDayDuties(data || { goalList: [] });
    } catch (e) {
      console.warn("[AdminViewKolSchedule] load failed:", e);
      setDayDuties({ goalList: [] });
      message.error("Không tải được lịch làm việc của KOL.");
    } finally {
      setLoading(false);
    }
  }, [kolId, range, anchorDate]);

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

  const handleAddSchedule = () => {
    setOpenWorkReg(true);
  };

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

          <p className="text-[#0050ab] text-xl md:text-2xl lg:text-3xl font-bold capitalize text-center">
            {headerLabel}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddSchedule}
              className="h-8 px-4 rounded-md bg-[#0050ab] text-white text-sm md:text-base font-semibold hover:opacity-90 transition-colors flex items-center justify-center border-2 border-[#0050ab]"
            >
              + Thêm lịch làm việc
            </button>

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
        </div>

        {/* Lưới lịch: luôn render ngay cả khi rỗng */}
        <SchedulerGrid
          range={range}
          dayDuties={dayDuties}
          fromDate={fromDate}
          toDate={toDate}
        />

        {loading && (
          <div className="mt-2 text-sm text-gray-500">Đang tải lịch…</div>
        )}

        {/* Popup đăng ký lịch làm việc */}
        <Modal
          title="Đăng ký lịch làm việc cho KOL"
          open={openWorkReg}
          onCancel={() => setOpenWorkReg(false)}
          footer={null}
          width={1100}
          destroyOnClose
        >
          <KolWorkRegistrationMui
            isAdmin
            adminKolId={kolId}
            onSuccess={() => {
              setOpenWorkReg(false);
              load();
            }}
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
}
