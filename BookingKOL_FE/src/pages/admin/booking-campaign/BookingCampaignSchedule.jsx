// src/pages/admin/booking-campaign/BookingCampaignSchedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  DatePicker,
  TimePicker,
  Form,
  Input,
  Row,
  Col,
  Select,
  Space,
  Table,
  Typography,
  message,
  ConfigProvider,
  Alert,
  Tag,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { CalendarRange, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetWorktimesByBooking,
  adminCreateWorktime,
  adminSearchFreeSlots,
} from "../../../services/admin/AdminWorktimeCampaignAPI";
import { adminGetCampaignBookingDetail } from "../../../services/admin/AdminBookingCampaignAPI";

dayjs.locale("vi");
const { RangePicker } = DatePicker;
const { RangePicker: TimeRangePicker } = TimePicker;
const { Text } = Typography;

// ===== Booking status label + tag color =====
const BOOKING_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  REQUESTED: "Đã yêu cầu",
  PENDING: "Chờ xử lý",
  NEGOTIATING: "Đang đàm phán",
  APPROVED: "Đã phê duyệt",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Đang tranh chấp",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  EXPIRED: "Hết hạn",
  PAID: "Đã thanh toán",
  WAIT_FOR_REFUND: "Đợi hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  OVERPAID: "Thanh toán thừa",
  SIGNED: "Đã ký",
};

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  PENDING: "processing",
  NEGOTIATING: "cyan",
  APPROVED: "success",
  ACCEPTED: "success",
  CONFIRMED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  REJECTED: "error",
  CANCELLED: "error",
  CONTRACT_SIGNED: "purple",
  EXPIRED: "volcano",
  PAID: "success",
  WAIT_FOR_REFUND: "cyan",
  REFUNDED: "purple",
  SIGNED: "magenta",
};

export default function BookingCampaignSchedule() {
  const { campaignId: campaignIdParam } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();

  const prefilledBookingRequestId = location.state?.bookingRequestId || "";
  const prefilledCampaignName = location.state?.campaignName || "";

  const [bookingRequestId, setBookingRequestId] = useState(
    prefilledBookingRequestId
  );

  // Free slots + selected
  const [freeSlots, setFreeSlots] = useState([]);
  const [loadingFreeSlots, setLoadingFreeSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Filter KOL for free slots
  const [freeSlotKolFilter, setFreeSlotKolFilter] = useState(undefined);

  // Worktime filter
  const [worktimeFilterMode, setWorktimeFilterMode] = useState("month"); // all | day | week | month
  const [worktimeFilterDate, setWorktimeFilterDate] = useState(dayjs());

  // ===== UI key riêng cho từng slot (fix trường hợp 2 dòng chung availabilityId) =====
  const buildSlotUiKey = (slot) =>
    `${slot?.kolId ?? "kol"}__${slot?.id ?? "id"}__${slot?.startAt ?? "s"}__${
      slot?.endAt ?? "e"
    }`;

  const attachUiKey = (list) =>
    (list || []).map((s) => ({
      ...s,
      uiKey: s?.uiKey || buildSlotUiKey(s),
    }));

  // ===== disabledDate cho searchRange: từ hôm nay trở đi =====
  const disabledSearchDate = (current) => {
    if (!current) return false;
    return current < dayjs().startOf("day");
  };

  // ===== disabledDate cho workDate: chỉ chọn đúng ngày của slot đang chọn =====
  const disabledWorkDate = (current) => {
    if (!selectedSlot?.startAt) return false;
    if (!current) return false;
    const slotDay = dayjs(selectedSlot.startAt);
    return !dayjs(current).isSame(slotDay, "day");
  };

  const normalizeList = (resp) => {
    if (!resp) return [];
    const maybe =
      resp?.content ??
      resp?.data?.content ??
      resp?.data ??
      resp?.result ??
      resp;
    return Array.isArray(maybe) ? maybe : [];
  };

  // ===== Bounds giờ theo slot (để TimeRangePicker không chọn out range) =====
  const getSlotHourBounds = () => {
    if (!selectedSlot?.startAt || !selectedSlot?.endAt) return null;

    const s = dayjs(selectedSlot.startAt);
    const e = dayjs(selectedSlot.endAt);
    if (!s.isValid() || !e.isValid() || !e.isAfter(s)) return null;

    // slot qua ngày khác thì RangePicker format "HH" khó khóa chuẩn -> bỏ disable UI, vẫn validate ở submit
    if (!s.isSame(e, "day")) return null;

    // nếu startAt có phút > 0 => giờ hợp lệ đầu tiên là giờ kế tiếp (HH:00)
    const minStartHour = s.minute() > 0 ? s.hour() + 1 : s.hour();
    const maxEndHour = e.hour();

    if (maxEndHour - minStartHour < 1) return null; // không đủ 1 giờ
    return { minStartHour, maxEndHour };
  };

  // ✅ Fix "chọn giờ xong bấm OK không được": disabledTime CHỈ dựa theo slot (không đọc timeRange trong form)
  const disabledTimeBySlot = (_date, type) => {
    const bounds = getSlotHourBounds();
    if (!bounds) return {};

    const { minStartHour, maxEndHour } = bounds;

    const min = type === "start" ? minStartHour : minStartHour + 1;
    const max = type === "start" ? maxEndHour - 1 : maxEndHour;

    const disabledHours = () => {
      const arr = [];
      for (let h = 0; h < 24; h++) if (h < min || h > max) arr.push(h);
      return arr;
    };

    return { disabledHours };
  };

  /**
   * Reload slots theo searchRange trong form
   * - keepSelection: giữ filter KOL + selectedSlot (theo uiKey) nếu còn tồn tại sau reload
   * - silent: không warning nếu thiếu searchRange
   */
  const loadFreeSlotsByCurrentRange = async ({
    keepSelection = false,
    silent = false,
  } = {}) => {
    const range = form.getFieldValue("searchRange");
    if (!Array.isArray(range) || range.length !== 2) {
      if (!silent)
        message.warning("Vui lòng chọn khoảng thời gian muốn tìm lịch rảnh.");
      return false;
    }

    const [start, end] = range;
    const startDateIso = dayjs(start).toISOString();
    const endDateIso = dayjs(end).toISOString();

    const prevSelectedKey = selectedSlot?.uiKey || null;
    const prevKolFilter =
      form.getFieldValue("freeSlotKolId") || freeSlotKolFilter;

    try {
      setLoadingFreeSlots(true);

      const resp = await adminSearchFreeSlots({
        startDate: startDateIso,
        endDate: endDateIso,
        page: 0,
        size: 100,
      });

      const list = normalizeList(resp);
      const qStart = dayjs(startDateIso);
      const qEnd = dayjs(endDateIso);

      // FE lọc: AVAILABLE + overlap khoảng query
      const filtered = (list || []).filter((slot) => {
        const status = String(slot.status || "").toUpperCase();
        if (status !== "AVAILABLE") return false;
        if (!slot.startAt || !slot.endAt) return false;

        const s = dayjs(slot.startAt);
        const e = dayjs(slot.endAt);
        if (!s.isValid() || !e.isValid()) return false;

        return s.isBefore(qEnd) && e.isAfter(qStart);
      });

      const filteredWithKey = attachUiKey(filtered);
      setFreeSlots(filteredWithKey);

      if (!keepSelection) {
        setSelectedSlot(null);
        setFreeSlotKolFilter(undefined);
        form.setFieldsValue({
          kolDisplay: undefined,
          kolId: undefined,
          availabilityId: undefined,
          timeRange: undefined,
          workDate: undefined,
          freeSlotKolId: undefined,
        });
        return true;
      }

      // keep filter KOL
      const nextFilter = prevKolFilter || undefined;
      setFreeSlotKolFilter(nextFilter);
      form.setFieldsValue({ freeSlotKolId: nextFilter });

      // keep selected slot theo uiKey (nếu còn)
      if (prevSelectedKey) {
        const found = filteredWithKey.find((s) => s.uiKey === prevSelectedKey);

        if (found) {
          setSelectedSlot(found);

          const currentWorkDate = form.getFieldValue("workDate");
          const currentTimeRange = form.getFieldValue("timeRange");

          form.setFieldsValue({
            kolDisplay: found.kolName,
            kolId: found.kolId,
            availabilityId: found.id,
            workDate: currentWorkDate ?? dayjs(found.startAt),
            timeRange: currentTimeRange,
          });

          // nếu chưa có timeRange thì gợi ý giờ theo slot
          if (!currentTimeRange) {
            const s = dayjs(found.startAt);
            const e = dayjs(found.endAt);

            const suggestedStart =
              s.minute() > 0
                ? s.add(1, "hour").minute(0).second(0)
                : s.minute(0).second(0);

            let suggestedEnd = e.minute(0).second(0);
            if (!suggestedEnd.isAfter(suggestedStart)) {
              suggestedEnd = suggestedStart.add(1, "hour");
            }

            form.setFieldsValue({ timeRange: [suggestedStart, suggestedEnd] });
          }
        } else {
          // slot cũ không còn (đã bị consume) -> clear
          setSelectedSlot(null);
          form.setFieldsValue({
            kolDisplay: undefined,
            kolId: undefined,
            availabilityId: undefined,
          });
        }
      }

      return true;
    } catch (e) {
      console.error("Load free slots failed:", e);
      const beMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Không tìm được lịch rảnh, vui lòng thử lại.";
      message.error(beMsg);
      return false;
    } finally {
      setLoadingFreeSlots(false);
    }
  };

  // ===== Booking detail để suy ra bookingRequestId nếu chưa có =====
  const {
    data: bookingDetailResp,
    isLoading: loadingBookingDetail,
    error: errorBookingDetail,
  } = useQuery({
    queryKey: ["admin-campaign-booking-detail", campaignIdParam],
    queryFn: () => adminGetCampaignBookingDetail(campaignIdParam),
    enabled: !!campaignIdParam && !prefilledBookingRequestId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const bookingDetail = bookingDetailResp?.data ?? bookingDetailResp ?? null;

  const bookingRequestsFromCampaign = useMemo(
    () =>
      Array.isArray(bookingDetail?.bookingRequests)
        ? bookingDetail.bookingRequests
        : [],
    [bookingDetail?.bookingRequests]
  );

  useEffect(() => {
    if (prefilledBookingRequestId) return;

    if (!bookingRequestId && bookingRequestsFromCampaign.length > 0) {
      const first = bookingRequestsFromCampaign[0];
      if (first?.id) {
        const id = String(first.id);
        setBookingRequestId(id);
        form.setFieldsValue({ bookingRequestId: id });
      }
    }
  }, [
    prefilledBookingRequestId,
    bookingRequestId,
    bookingRequestsFromCampaign,
    form,
  ]);

  // ===== Worktimes by bookingRequestId =====
  const {
    data: worktimeResp,
    isFetching: loadingWorktimes,
    refetch: refetchWorktimes,
  } = useQuery({
    queryKey: ["admin-worktimes-by-booking", bookingRequestId],
    queryFn: async () => {
      if (!bookingRequestId) return null;
      return adminGetWorktimesByBooking(bookingRequestId);
    },
    enabled: !!bookingRequestId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const worktimeList = useMemo(() => {
    if (!worktimeResp) return [];
    const content = worktimeResp?.content ?? worktimeResp?.data?.content ?? [];
    return Array.isArray(content) ? content : [];
  }, [worktimeResp]);

  const visibleWorktimes = useMemo(() => {
    if (!worktimeList || worktimeList.length === 0) return [];
    if (worktimeFilterMode === "all" || !worktimeFilterDate)
      return worktimeList;

    const ref = worktimeFilterDate;

    return worktimeList.filter((w) => {
      if (!w?.startAt) return false;
      const start = dayjs(w.startAt);
      if (!start.isValid()) return false;

      if (worktimeFilterMode === "day") return start.isSame(ref, "day");

      if (worktimeFilterMode === "week") {
        const refDayStart = ref.startOf("day");
        const dow = refDayStart.day(); // 0-6
        const weekStart = refDayStart.subtract(dow, "day");
        const weekEnd = weekStart.add(7, "day");
        return (
          (start.isSame(weekStart) || start.isAfter(weekStart)) &&
          start.isBefore(weekEnd)
        );
      }

      if (worktimeFilterMode === "month") {
        return start.year() === ref.year() && start.month() === ref.month();
      }

      return true;
    });
  }, [worktimeList, worktimeFilterMode, worktimeFilterDate]);

  // ===== Options KOL từ freeSlots =====
  const freeSlotKolOptions = useMemo(() => {
    const map = new Map();
    freeSlots.forEach((slot) => {
      if (slot.kolId) {
        const key = String(slot.kolId);
        if (!map.has(key)) map.set(key, slot.kolName || key);
      }
    });

    // giữ filter value nếu options biến mất (hiếm)
    if (freeSlotKolFilter) {
      const key = String(freeSlotKolFilter);
      if (!map.has(key)) map.set(key, selectedSlot?.kolName || key);
    }

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [freeSlots, freeSlotKolFilter, selectedSlot?.kolName]);

  const filteredFreeSlots = useMemo(() => {
    if (!freeSlotKolFilter) return freeSlots;
    return freeSlots.filter(
      (slot) => String(slot.kolId) === String(freeSlotKolFilter)
    );
  }, [freeSlots, freeSlotKolFilter]);

  // ===== Search free slots =====
  const handleSearchFreeSlots = async () => {
    await loadFreeSlotsByCurrentRange({ keepSelection: false, silent: false });
  };

  // ===== Create worktime =====
  const handleCreateWorktime = async (values) => {
    try {
      const id =
        bookingRequestId ||
        prefilledBookingRequestId ||
        values.bookingRequestId?.trim();

      if (!id) {
        message.warning(
          "Booking Request ID chưa được xác định. Vui lòng quay lại trang trước hoặc đảm bảo campaign đã có booking."
        );
        return;
      }

      if (!selectedSlot) {
        message.warning("Vui lòng chọn một slot rảnh trước khi tạo lịch.");
        return;
      }

      const workDate = values.workDate;
      const timeRange = values.timeRange;

      if (!workDate) {
        message.warning("Vui lòng chọn ngày làm việc.");
        return;
      }

      if (!Array.isArray(timeRange) || timeRange.length !== 2) {
        message.warning("Vui lòng chọn khoảng giờ làm việc.");
        return;
      }

      const [startTime, endTime] = timeRange;
      if (!startTime || !endTime) {
        message.warning("Vui lòng chọn đủ giờ bắt đầu và giờ kết thúc.");
        return;
      }

      const baseDate = dayjs(workDate).startOf("day");
      const startAt = baseDate
        .hour(dayjs(startTime).hour())
        .minute(0)
        .second(0)
        .millisecond(0);

      const endAt = baseDate
        .hour(dayjs(endTime).hour())
        .minute(0)
        .second(0)
        .millisecond(0);

      if (!endAt.isAfter(startAt)) {
        message.error("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
        return;
      }

      const diffMinutes = endAt.diff(startAt, "minute");
      if (diffMinutes < 60) {
        message.error("Một lần tạo lịch tối thiểu là 1 giờ.");
        return;
      }
      if (diffMinutes > 180) {
        message.error("Một lần tạo lịch tối đa là 3 giờ.");
        return;
      }

      const slotStart = dayjs(selectedSlot.startAt);
      const slotEnd = dayjs(selectedSlot.endAt);

      if (startAt.isBefore(slotStart) || endAt.isAfter(slotEnd)) {
        message.error(
          "Khoảng thời gian tạo lịch phải nằm trong khoảng rảnh đã chọn."
        );
        return;
      }

      const kolId = selectedSlot.kolId;
      if (!kolId) {
        message.warning("Không xác định được KOL / trợ live từ slot đã chọn.");
        return;
      }

      const availabilityId = values.availabilityId || selectedSlot.id || null;

      const payload = {
        bookingRequestId: id,
        availabilityId,
        kolId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        note: values.note || null,
      };

      await adminCreateWorktime(payload);
      message.success("Tạo lịch làm việc thành công.");

      setBookingRequestId(id);
      form.setFieldsValue({ bookingRequestId: id });

      // ✅ refetch worktimes + refetch freeSlots nhưng GIỮ filter KOL & slot đang chọn (nếu còn)
      await Promise.all([
        refetchWorktimes(),
        loadFreeSlotsByCurrentRange({ keepSelection: true, silent: true }),
      ]);
    } catch (e) {
      console.error("Create worktime failed:", e);
      const beMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Tạo lịch thất bại, vui lòng kiểm tra lại.";
      message.error(beMsg);
    }
  };

  // ===== Worktime columns (KOL name + STATUS) =====
  const worktimeColumns = [
    {
      title: "KOL",
      key: "kol",
      width: 220,
      render: (_, r) =>
        r?.kolName ||
        r?.kol?.fullName ||
        r?.kol?.name ||
        r?.kol?.displayName ||
        r?.kolId ||
        "--",
    },
    {
      title: "Bắt đầu",
      dataIndex: "startAt",
      key: "startAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      width: 180,
    },
    {
      title: "Kết thúc",
      dataIndex: "endAt",
      key: "endAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      width: 180,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (v) => {
        const s = String(v || "").toUpperCase();
        const label = BOOKING_STATUS_LABEL[s] || v || "--";
        const color = STATUS_TAG_COLOR[s] || "default";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (v) => v || "--",
      ellipsis: true,
    },
  ];

  // ===== Free slot columns =====
  const freeSlotColumns = [
    {
      title: "KOL / Trợ live",
      dataIndex: "kolName",
      key: "kolName",
      width: 220,
      render: (v) => v || "--",
    },
    {
      title: "Bắt đầu rảnh",
      dataIndex: "startAt",
      key: "startAt",
      width: 180,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
    },
    {
      title: "Kết thúc rảnh",
      dataIndex: "endAt",
      key: "endAt",
      width: 180,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => {
        const s = String(v || "AVAILABLE").toUpperCase();
        return s === "AVAILABLE" ? "Sẵn Sàng" : v || "Sẵn Sàng";
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type={selectedSlot?.uiKey === record.uiKey ? "primary" : "default"}
          onClick={() => {
            const recordWithKey = {
              ...record,
              uiKey: record.uiKey || buildSlotUiKey(record),
            };

            setSelectedSlot(recordWithKey);

            const s = dayjs(recordWithKey.startAt);
            const e = dayjs(recordWithKey.endAt);

            // gợi ý start = ceil lên giờ nếu có phút
            const suggestedStart =
              s.minute() > 0
                ? s.add(1, "hour").minute(0).second(0)
                : s.minute(0).second(0);

            // gợi ý end = floor về HH:00
            let suggestedEnd = e.minute(0).second(0);
            if (!suggestedEnd.isAfter(suggestedStart)) {
              suggestedEnd = suggestedStart.add(1, "hour");
            }

            form.setFieldsValue({
              kolDisplay: recordWithKey.kolName,
              kolId: recordWithKey.kolId,
              availabilityId: recordWithKey.id, // ✅ vẫn gửi về BE theo availabilityId
              workDate: dayjs(recordWithKey.startAt),
              timeRange: [suggestedStart, suggestedEnd],
            });
          }}
        >
          {selectedSlot?.uiKey === record.uiKey ? "Đang chọn" : "Chọn"}
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold uppercase">Lịch làm việc</h1>
              <p className="text-[14px] text-gray-600">
                Tạo và xem lịch làm việc theo Booking Request, dựa trên lịch
                rảnh của KOL / trợ live.
              </p>
              {prefilledCampaignName && (
                <Text type="secondary">Campaign: {prefilledCampaignName}</Text>
              )}
            </div>
          </div>

          <Space>
            <Button
              type="primary"
              onClick={() => {
                form.resetFields();
                setBookingRequestId("");
                setFreeSlots([]);
                setSelectedSlot(null);
                setFreeSlotKolFilter(undefined);
                setWorktimeFilterMode("month");
                setWorktimeFilterDate(dayjs());
              }}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {/* FORM */}
        <Card bordered={false} className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateWorktime}
            initialValues={{ bookingRequestId: prefilledBookingRequestId }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Form.Item label="Booking Request ID" name="bookingRequestId">
                  <Input disabled placeholder="Booking Request ID" />
                </Form.Item>
              </Col>

              <Col xs={24} md={16}>
                <Form.Item
                  label="Khoảng thời gian muốn tìm lịch rảnh"
                  name="searchRange"
                  tooltip="Chọn khoảng thời gian mong muốn, hệ thống sẽ trả về các KOL / trợ live rảnh trong khoảng đó"
                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng chọn khoảng thời gian muốn tìm lịch rảnh.",
                    },
                  ]}
                >
                  <RangePicker
                    showTime={{ format: "HH", minuteStep: 60 }}
                    format="DD/MM/YYYY HH:00"
                    className="w-full"
                    placeholder={["Bắt đầu", "Kết thúc"]}
                    disabledDate={disabledSearchDate}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Button
                  type="primary"
                  onClick={handleSearchFreeSlots}
                  loading={loadingFreeSlots}
                  style={{ backgroundColor: "#10B981", borderColor: "#10B981" }}
                >
                  Tìm KOL / trợ live rảnh
                </Button>
              </Col>
            </Row>

            {/* Free slots */}
            {freeSlots.length > 0 && (
              <Card
                className="mt-4"
                size="small"
                title="Lịch rảnh của KOL / trợ live trong khoảng đã chọn"
              >
                <Row gutter={[12, 12]} className="mb-3">
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Chọn KOL / trợ live để hiển thị lịch rảnh"
                      name="freeSlotKolId"
                    >
                      <Select
                        allowClear
                        placeholder="Tất cả KOL / trợ live"
                        options={freeSlotKolOptions}
                        value={freeSlotKolFilter}
                        onChange={(val) => {
                          const v = val || undefined;
                          setFreeSlotKolFilter(v);
                          form.setFieldsValue({ freeSlotKolId: v });
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Table
                  dataSource={filteredFreeSlots}
                  columns={freeSlotColumns}
                  rowKey={(r) => r.uiKey}
                  pagination={false}
                  scroll={{ x: "auto" }}
                />
              </Card>
            )}

            {/* Config time */}
            <div className="mt-6 border-t pt-4">
              <h2 className="text-base font-semibold mb-2">
                Cấu hình thời gian cụ thể cho lịch làm việc
              </h2>

              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="KOL / trợ live"
                    name="kolDisplay"
                    tooltip="Được chọn từ bảng slot rảnh bên trên"
                  >
                    <Input disabled placeholder="Chưa chọn slot rảnh nào" />
                  </Form.Item>

                  <Form.Item name="kolId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="availabilityId" hidden>
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ngày làm việc"
                    name="workDate"
                    rules={[{ required: true, message: "Chọn ngày làm việc" }]}
                  >
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      disabled={!selectedSlot}
                      disabledDate={disabledWorkDate}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Khoảng giờ tạo lịch"
                    name="timeRange"
                    rules={[
                      { required: true, message: "Chọn khoảng giờ" },
                      () => ({
                        validator(_, value) {
                          if (!value || value.length !== 2)
                            return Promise.resolve();

                          const [startTime, endTime] = value || [];
                          if (!startTime || !endTime) return Promise.resolve();

                          if (!dayjs(endTime).isAfter(dayjs(startTime))) {
                            return Promise.reject(
                              new Error(
                                "Giờ kết thúc phải lớn hơn giờ bắt đầu."
                              )
                            );
                          }

                          const diffMinutes = endTime.diff(startTime, "minute");
                          if (diffMinutes < 60) {
                            return Promise.reject(
                              new Error("Một lần tạo lịch tối thiểu là 1 giờ.")
                            );
                          }
                          if (diffMinutes > 180) {
                            return Promise.reject(
                              new Error("Một lần tạo lịch tối đa là 3 giờ.")
                            );
                          }

                          // bảo hiểm: nằm trong slot đã chọn
                          const workDate = form.getFieldValue("workDate");
                          if (
                            selectedSlot?.startAt &&
                            selectedSlot?.endAt &&
                            workDate
                          ) {
                            const base = dayjs(workDate).startOf("day");
                            const s = base
                              .hour(dayjs(startTime).hour())
                              .minute(0)
                              .second(0)
                              .millisecond(0);
                            const e = base
                              .hour(dayjs(endTime).hour())
                              .minute(0)
                              .second(0)
                              .millisecond(0);

                            const slotS = dayjs(selectedSlot.startAt);
                            const slotE = dayjs(selectedSlot.endAt);

                            if (s.isBefore(slotS) || e.isAfter(slotE)) {
                              return Promise.reject(
                                new Error(
                                  "Khoảng giờ tạo lịch phải nằm trong khoảng rảnh đã chọn."
                                )
                              );
                            }
                          }

                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <TimeRangePicker
                      format="HH"
                      minuteStep={60}
                      className="w-full"
                      placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
                      disabled={!selectedSlot}
                      hideDisabledOptions
                      disabledTime={disabledTimeBySlot}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Ghi chú" name="note">
                    <Input placeholder="Ghi chú (không bắt buộc)" />
                  </Form.Item>

                  <div className="flex items-center justify-end">
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<Plus />}
                      disabled={!selectedSlot}
                    >
                      Tạo lịch
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {loadingBookingDetail && !prefilledBookingRequestId && (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message="Đang lấy Booking Request ID từ Campaign..."
              />
            )}
            {errorBookingDetail && !prefilledBookingRequestId && (
              <Alert
                className="mt-2"
                type="error"
                showIcon
                message="Không thể lấy Booking Request ID từ Campaign."
                description={String(errorBookingDetail?.message ?? "")}
              />
            )}
          </Form>
        </Card>

        {/* Worktimes */}
        <Card
          bordered={false}
          className="flex-1 shadow-sm"
          title="Lịch đăng ký của KOL / trợ live"
        >
          {!bookingRequestId ? (
            <Alert
              message="Chưa xác định được Booking Request ID"
              description="Vui lòng mở màn hình này từ trang Chi tiết / Tạo booking campaign, hoặc đảm bảo campaign đã có Booking Request."
              type="info"
              showIcon
            />
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <Text strong>
                  Danh sách lịch cho Booking: {bookingRequestId}
                </Text>

                <Space size="small" wrap>
                  <Select
                    value={worktimeFilterMode}
                    onChange={(val) => {
                      setWorktimeFilterMode(val);
                      if (val === "all") setWorktimeFilterDate(null);
                      else if (!worktimeFilterDate)
                        setWorktimeFilterDate(dayjs());
                    }}
                    style={{ width: 150 }}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "day", label: "Theo ngày" },
                      { value: "week", label: "Theo tuần" },
                      { value: "month", label: "Theo tháng" },
                    ]}
                  />
                  {worktimeFilterMode !== "all" && (
                    <DatePicker
                      picker={worktimeFilterMode === "month" ? "month" : "date"}
                      allowClear={false}
                      placeholder={
                        worktimeFilterMode === "day"
                          ? "Chọn ngày"
                          : worktimeFilterMode === "week"
                          ? "Chọn ngày trong tuần"
                          : "Chọn tháng"
                      }
                      value={worktimeFilterDate}
                      onChange={(val) => setWorktimeFilterDate(val || dayjs())}
                    />
                  )}
                </Space>
              </div>

              <Table
                dataSource={visibleWorktimes}
                columns={worktimeColumns}
                rowKey={(r) => r.id || `${r.startAt}_${r.endAt}`}
                loading={loadingWorktimes}
                pagination={false}
                scroll={{ x: "auto" }}
              />
            </>
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
}
