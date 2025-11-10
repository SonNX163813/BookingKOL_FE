// src/pages/kol/KolScheduleChange.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Card, Typography, Space, Button, message, TimePicker } from "antd";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  getKolProfileByUserId,
  getKolFreeTime,
  removeKolAvailabilityRange,
} from "../../services/kol/KolAPI";

dayjs.locale("vi");
const { Title, Text } = Typography;

/** Chỉ cho phép đúng 1 phút, khóa toàn bộ phút khác */
const buildDisabledMinutes = (allowedMinute) => () =>
  Array.from({ length: 60 }, (_, i) => i).filter((m) => m !== allowedMinute);

export default function KolScheduleChange() {
  const { kolId: kolIdParam } = useParams();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;

  const [kolId, setKolId] = useState(kolIdParam || null);
  const [resolvingKolId, setResolvingKolId] = useState(!kolIdParam);

  // Tháng đang xem lịch rảnh
  const [monthAnchor, setMonthAnchor] = useState(dayjs());
  const [freeList, setFreeList] = useState([]);
  const [loadingFree, setLoadingFree] = useState(false);

  // Slot đang chọn để cắt giờ
  const [selectedSlotKey, setSelectedSlotKey] = useState(null);
  const [startRemove, setStartRemove] = useState(null);
  const [endRemove, setEndRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  /** ==== Resolve kolId giống KolSchedule ==== */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (kolIdParam) {
        setKolId(kolIdParam);
        setResolvingKolId(false);
        return;
      }
      if (!userId) {
        setResolvingKolId(false);
        return;
      }
      try {
        const me = await getKolProfileByUserId(userId);
        if (mounted) setKolId(me?.id || null);
      } catch (e) {
        console.warn("[KolScheduleChange] getKolProfileByUserId error:", e);
        if (mounted) setKolId(null);
      } finally {
        if (mounted) setResolvingKolId(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kolIdParam, userId]);

  /** ==== Header tháng ==== */
  const { headerLabel } = useMemo(
    () => ({
      headerLabel: monthAnchor.format("MMMM, YYYY"),
    }),
    [monthAnchor]
  );

  /** ==== Load free-time theo tháng ==== */
  const loadFreeTime = useCallback(async (currentKolId, baseDate) => {
    if (!currentKolId || !baseDate) return;
    setLoadingFree(true);
    try {
      const startISO = baseDate
        .startOf("month")
        .startOf("day")
        .toDate()
        .toISOString();
      const endISO = baseDate
        .endOf("month")
        .endOf("day")
        .toDate()
        .toISOString();

      const data =
        (await getKolFreeTime({
          kolId: currentKolId,
          startDate: startISO,
          endDate: endISO,
        })) || [];

      const sorted = [...data].sort((a, b) =>
        String(a.startAt).localeCompare(String(b.startAt))
      );
      setFreeList(sorted);
    } catch (e) {
      console.warn("[KolScheduleChange] loadFreeTime error:", e);
      setFreeList([]);
    } finally {
      setLoadingFree(false);
    }
  }, []);

  useEffect(() => {
    if (kolId) {
      loadFreeTime(kolId, monthAnchor);
    }
  }, [kolId, monthAnchor, loadFreeTime]);

  /** ==== Điều hướng tháng ==== */
  const handlePrevMonth = () =>
    setMonthAnchor((d) => d.subtract(1, "month").startOf("month"));
  const handleNextMonth = () =>
    setMonthAnchor((d) => d.add(1, "month").startOf("month"));

  /** ==== Chọn 1 ca để cắt giờ ==== */
  const onSelectSlot = (slot) => {
    const key = `${slot.availabilityId || ""}_${slot.startAt}`;
    setSelectedSlotKey(key);

    const slotStart = dayjs(slot.startAt);
    const slotEnd = dayjs(slot.endAt);

    if (slotStart.isValid() && slotEnd.isValid()) {
      // mặc định chọn full ca
      setStartRemove(slotStart);
      setEndRemove(slotEnd);
    } else {
      setStartRemove(null);
      setEndRemove(null);
    }
  };

  /** ==== Gọi remove-range ==== */
  const handleRemoveRange = async () => {
    if (!selectedSlotKey) {
      message.warning("Vui lòng chọn ca muốn thay đổi.");
      return;
    }

    const slot = freeList.find(
      (s) => `${s.availabilityId || ""}_${s.startAt}` === selectedSlotKey
    );
    if (!slot) {
      message.error("Không tìm thấy ca đã chọn. Vui lòng tải lại trang.");
      return;
    }

    const slotStart = dayjs(slot.startAt);
    const slotEnd = dayjs(slot.endAt);
    if (!slotStart.isValid() || !slotEnd.isValid()) {
      message.warning("Dữ liệu ca làm không hợp lệ.");
      return;
    }

    const finalStart =
      startRemove && startRemove.isValid() ? startRemove : slotStart;
    const finalEnd = endRemove && endRemove.isValid() ? endRemove : slotEnd;

    // 1) Bắt buộc start < end
    if (!finalStart.isBefore(finalEnd)) {
      message.warning("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    // 2) Chỉ trong khung ca rảnh
    if (finalStart.isBefore(slotStart) || finalEnd.isAfter(slotEnd)) {
      message.warning("Khung giờ hủy phải nằm trong khoảng của ca đã chọn.");
      return;
    }

    try {
      setRemoving(true);

      await removeKolAvailabilityRange({
        availabilityId: slot.availabilityId,
        startRemove: finalStart.toDate().toISOString(),
        endRemove: finalEnd.toDate().toISOString(),
      });

      message.success("Đã cập nhật lịch làm việc.");
      if (kolId) {
        loadFreeTime(kolId, monthAnchor);
      }
      setSelectedSlotKey(null);
      setStartRemove(null);
      setEndRemove(null);
    } catch (e) {
      console.warn("[KolScheduleChange] remove-range error:", e);
      const msg =
        e?.response?.data?.message?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Không thể cập nhật lịch. Vui lòng thử lại.";
      message.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card style={{ margin: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Hủy Lịch Làm
        </Title>

        {resolvingKolId ? (
          <Text>Đang xác định KOL ID...</Text>
        ) : !kolId ? (
          <Text type="danger">
            Không tìm thấy KOL ID. Vui lòng đăng nhập bằng tài khoản KOL.
          </Text>
        ) : (
          <>
            {/* ==== HEADER THÁNG & ĐIỀU HƯỚNG ==== */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <IoIosArrowBack className="text-[#7bb4fb]" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-full border-2 border-[#7bb4fb] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <IoIosArrowForward className="text-[#7bb4fb]" />
                </button>

                <Text strong>Lịch rảnh trong tháng {headerLabel}</Text>
              </div>

              {loadingFree && (
                <Text type="secondary">Đang tải lịch rảnh...</Text>
              )}
            </div>

            {/* ==== LIST CA RẢNH ==== */}
            {freeList.length === 0 ? (
              <Text type="secondary">Chưa có ca rảnh nào trong tháng này.</Text>
            ) : (
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                {freeList.map((slot) => {
                  const slotStart = dayjs(slot.startAt);
                  const slotEnd = dayjs(slot.endAt);
                  if (!slotStart.isValid() || !slotEnd.isValid()) return null;

                  const key = `${slot.availabilityId || ""}_${slot.startAt}`;
                  const isSelected = key === selectedSlotKey;

                  // phút gốc để khóa (chỉ cho đổi giờ)
                  const slotStartMinute = slotStart.minute();
                  const slotEndMinute = slotEnd.minute();

                  return (
                    <div
                      key={key}
                      style={{
                        border: isSelected
                          ? "2px solid #0050ab"
                          : "1px solid #e0efff",
                        borderRadius: 6,
                        padding: 8,
                        backgroundColor: isSelected ? "#f0f6ff" : "#f8fbff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <Text
                          strong
                          style={{ minWidth: 110, color: "#0050ab" }}
                        >
                          {slotStart.format("DD/MM/YYYY")}
                        </Text>
                        <Text style={{ minWidth: 120 }}>
                          {`${slotStart.format("HH:mm")} - ${slotEnd.format(
                            "HH:mm"
                          )}`}
                        </Text>

                        <Button
                          size="small"
                          type={isSelected ? "default" : "primary"}
                          onClick={() => onSelectSlot(slot)}
                        >
                          {isSelected ? "Đang chọn" : "Chọn ca này"}
                        </Button>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px dashed #c4d9ff",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <Text>Chọn khung giờ muốn hủy trong ca này:</Text>

                          {/* START TIME */}
                          <TimePicker
                            format="HH:mm"
                            value={startRemove || slotStart}
                            disabledMinutes={buildDisabledMinutes(
                              slotStartMinute
                            )}
                            disabledHours={() => {
                              // không cho chọn trước giờ bắt đầu ca
                              // và không cho lùi giờ nhỏ hơn lần chọn trước
                              const prev =
                                startRemove && startRemove.isValid()
                                  ? startRemove
                                  : slotStart;
                              let minHour = Math.max(
                                slotStart.hour(),
                                prev.hour()
                              );
                              // nếu đã có endRemove thì start không vượt quá end
                              let maxHour = endRemove
                                ? Math.min(slotEnd.hour(), endRemove.hour())
                                : slotEnd.hour();
                              if (maxHour < minHour) maxHour = minHour;
                              const disabled = [];
                              for (let h = 0; h < 24; h++) {
                                if (h < minHour || h > maxHour)
                                  disabled.push(h);
                              }
                              return disabled;
                            }}
                            onChange={(val) => {
                              if (!val) {
                                setStartRemove(null);
                                return;
                              }
                              const prev =
                                startRemove && startRemove.isValid()
                                  ? startRemove
                                  : slotStart;
                              let newHour = val.hour();

                              let minHour = Math.max(
                                slotStart.hour(),
                                prev.hour()
                              );
                              let maxHour = endRemove
                                ? Math.min(slotEnd.hour(), endRemove.hour())
                                : slotEnd.hour();

                              if (newHour < minHour) newHour = minHour;
                              if (newHour > maxHour) newHour = maxHour;

                              const next = slotStart
                                .hour(newHour)
                                .minute(slotStartMinute)
                                .second(0)
                                .millisecond(0);

                              setStartRemove(next);
                            }}
                          />

                          <span>-</span>

                          {/* END TIME */}
                          <TimePicker
                            format="HH:mm"
                            value={endRemove || slotEnd}
                            disabledMinutes={buildDisabledMinutes(
                              slotEndMinute
                            )}
                            disabledHours={() => {
                              const baseStart =
                                startRemove && startRemove.isValid()
                                  ? startRemove
                                  : slotStart;
                              let minHour = baseStart.hour(); // luôn >= start
                              let maxHour = slotEnd.hour();
                              if (maxHour < minHour) maxHour = minHour;
                              const disabled = [];
                              for (let h = 0; h < 24; h++) {
                                if (h < minHour || h > maxHour)
                                  disabled.push(h);
                              }
                              return disabled;
                            }}
                            onChange={(val) => {
                              if (!val) {
                                setEndRemove(null);
                                return;
                              }
                              const baseStart =
                                startRemove && startRemove.isValid()
                                  ? startRemove
                                  : slotStart;
                              let newHour = val.hour();

                              let minHour = baseStart.hour();
                              let maxHour = slotEnd.hour();

                              if (newHour < minHour) newHour = minHour;
                              if (newHour > maxHour) newHour = maxHour;

                              const next = slotEnd
                                .hour(newHour)
                                .minute(slotEndMinute)
                                .second(0)
                                .millisecond(0);

                              setEndRemove(next);
                            }}
                          />

                          <Button
                            danger
                            type="primary"
                            loading={removing}
                            onClick={handleRemoveRange}
                          >
                            Xóa khung giờ này
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Space>
            )}
          </>
        )}
      </Space>
    </Card>
  );
}
