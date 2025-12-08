// src/pages/admin/booking-campaign/BookingCampaignSchedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  DatePicker,
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
  Modal,
  Form,
  TimePicker,
  Input,
  Tooltip,
  Descriptions,
  Divider,
  Empty,
  Grid,
} from "antd";
import viVN from "antd/locale/vi_VN";
import {
  CalendarRange,
  Plus,
  Pencil,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetWorktimesByBooking,
  adminCreateWorktime,
  adminSearchFreeSlots,
  adminAssignScheduledWorktime,
} from "../../../services/admin/AdminWorktimeCampaignAPI";
import { adminGetCampaignBookingDetail } from "../../../services/admin/AdminBookingCampaignAPI";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../../constants/mySingleBookingStatuses";

dayjs.locale("vi");
const { Text, Title } = Typography;
const { RangePicker: TimeRangePicker } = TimePicker;
const { useBreakpoint } = Grid;

/** ===== Helpers (giống BookingCampaignDetail) ===== */
const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatDate = (value, pattern = "DD/MM/YYYY") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") return "--";
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const formatArrayText = (items) => {
  if (!Array.isArray(items) || !items.length) return "--";
  return items
    .map((x) => x?.displayName || x?.name || x?.id)
    .filter(Boolean)
    .join(", ");
};

// mapping nhỏ cho status campaign (để xử lý NEGOTIATING giống BookingCampaignDetail)
const CAMPAIGN_STATUS_LABEL = {
  REQUESTED: "Đang yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  IN_PROGRESS: "Đang triển khai",
  COMPLETED: "Hoàn tất",
};

const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  NEGOTIATING: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  IN_PROGRESS: "geekblue",
  COMPLETED: "blue",
};

/** Label + Color cho trạng thái hợp đồng */
const CONTRACT_STATUS_LABEL = {
  REQUESTED: "Đang yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn tất",
};

const getStatusColor = (status) => {
  if (!status) return "default";
  return STATUS_TAG_COLOR[status] ?? CAMPAIGN_STATUS_COLOR[status] ?? "default";
};

/** ===== Worktime status ===== */
const WORKTIME_STATUS_LABEL = {
  AVAILABLE: "Sẵn sàng",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const WORKTIME_STATUS_COLOR = {
  AVAILABLE: "processing",
  ASSIGNED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  CANCELLED: "error",
};

export default function BookingCampaignSchedule() {
  const { campaignId: campaignIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const prefilledBookingRequestId = location.state?.bookingRequestId || "";
  const prefilledCampaignName = location.state?.campaignName || "";

  const [bookingRequestId, setBookingRequestId] = useState(
    prefilledBookingRequestId
  );

  // Filter table
  const [worktimeFilterMode, setWorktimeFilterMode] = useState("month");
  const [worktimeFilterDate, setWorktimeFilterDate] = useState(dayjs());

  // Inline edit
  const [editForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [localOverrides, setLocalOverrides] = useState({});

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm] = Form.useForm();

  // Create: KOL options (optional)
  const [kolOptions, setKolOptions] = useState([]);
  const [kolLoading, setKolLoading] = useState(false);
  const [slotByKolId, setSlotByKolId] = useState({});

  // Edit: KOL options (optional)
  const [editKolOptions, setEditKolOptions] = useState([]);
  const [editKolLoading, setEditKolLoading] = useState(false);
  const [editSlotByKolId, setEditSlotByKolId] = useState({});

  // ISO without milliseconds (fix BE parse / filter)
  const toIsoNoMs = (d) =>
    dayjs(d)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");

  const getRowKey = (r) =>
    r?.scheduledWorkTimeId ||
    r?.kolWorkTimeId ||
    r?.id ||
    `${r?.startAt}_${r?.endAt}`;

  const getScheduledId = (r) =>
    r?.scheduledWorkTimeId || r?.id || r?.kolWorkTimeId || null;

  const isEditing = (record) => getRowKey(record) === editingKey;

  const normalizeList = (resp) => {
    if (!resp) return [];
    const candidates = [
      resp?.content,
      resp?.data?.content,
      resp?.data,
      resp?.result,
      resp,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (Array.isArray(c?.content)) return c.content;
      if (Array.isArray(c?.data)) return c.data;
    }
    return [];
  };

  // ✅ disabledTime: giới hạn 1–3 tiếng (UI khóa luôn)
  const makeDisabledTimeMax3Hours = (form, fieldName = "timeRange") => {
    return (_date, type) => {
      const range = form.getFieldValue(fieldName);
      const start = Array.isArray(range) ? range?.[0] : null;
      const end = Array.isArray(range) ? range?.[1] : null;

      const startHour = start ? dayjs(start).hour() : null;
      const endHour = end ? dayjs(end).hour() : null;

      let min = 0;
      let max = 23;

      if (type === "start") {
        min = 0;
        max = 22;

        if (Number.isInteger(endHour)) {
          min = Math.max(0, endHour - 3);
          max = Math.min(22, endHour - 1);
        }
      } else {
        min = 1;
        max = 23;

        if (Number.isInteger(startHour)) {
          min = Math.max(1, startHour + 1);
          max = Math.min(23, startHour + 3);
        }
      }

      const disabledHours = () => {
        if (min > max) return Array.from({ length: 24 }, (_, h) => h);
        const arr = [];
        for (let h = 0; h < 24; h++) if (h < min || h > max) arr.push(h);
        return arr;
      };

      const disabledMinutes = () => {
        const arr = [];
        for (let m = 0; m < 60; m++) if (m !== 0) arr.push(m);
        return arr;
      };

      return { disabledHours, disabledMinutes };
    };
  };

  /** ===== Booking detail (để render "Thông tin Booking Campaign") ===== */
  const {
    data: bookingDetailResp,
    isLoading: loadingBookingDetail,
    isFetching: fetchingBookingDetail,
    error: errorBookingDetail,
    refetch: refetchBookingDetail,
  } = useQuery({
    queryKey: ["admin-campaign-booking-detail", campaignIdParam],
    queryFn: () => adminGetCampaignBookingDetail(campaignIdParam),
    enabled: !!campaignIdParam,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const bookingDetail = bookingDetailResp?.data ?? bookingDetailResp ?? null;

  const campaignDisplayName =
    prefilledCampaignName ||
    bookingDetail?.campaignName ||
    bookingDetail?.name ||
    bookingDetail?.title ||
    "";

  const bookingRequestsFromCampaign = useMemo(
    () =>
      Array.isArray(bookingDetail?.bookingRequests)
        ? bookingDetail.bookingRequests
        : [],
    [bookingDetail?.bookingRequests]
  );

  // ===== suy ra bookingRequestId nếu chưa có =====
  useEffect(() => {
    if (prefilledBookingRequestId) return;
    if (!bookingRequestId && bookingRequestsFromCampaign.length > 0) {
      const first = bookingRequestsFromCampaign[0];
      if (first?.id) setBookingRequestId(String(first.id));
    }
  }, [
    prefilledBookingRequestId,
    bookingRequestId,
    bookingRequestsFromCampaign,
  ]);

  /** ===== Payment schedule columns ===== */
  const paymentScheduleColumns = useMemo(
    () => [
      {
        title: "Lần thanh toán",
        dataIndex: "installmentNumber",
        key: "installmentNumber",
        width: 120,
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        render: (v) => formatCurrency(v),
      },
      {
        title: "Hạn thanh toán",
        dataIndex: "dueDate",
        key: "dueDate",
        render: (v) => formatDate(v),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (v) => {
          const s = normalizeStatus(v);
          if (!s) return "--";
          return (
            <Tag color={PAYMENT_STATUS_COLOR[s] ?? "default"}>
              {PAYMENT_STATUS_LABEL[s] ?? s}
            </Tag>
          );
        },
      },
      {
        title: "Mã giao dịch",
        dataIndex: "transactionId",
        key: "transactionId",
        width: 220,
      },
      {
        title: "Trạng thái giao dịch",
        dataIndex: "transactionStatus",
        key: "transactionStatus",
        render: (v) => normalizeStatus(v) ?? "--",
      },
    ],
    []
  );

  // ===== Worktimes by bookingRequestId =====
  const {
    data: worktimeResp,
    isFetching: loadingWorktimes,
    refetch: refetchWorktimes,
    error: errorWorktimes,
  } = useQuery({
    queryKey: ["admin-scheduled-worktimes-by-booking", bookingRequestId],
    queryFn: async () => {
      if (!bookingRequestId) return null;
      return adminGetWorktimesByBooking(bookingRequestId);
    },
    enabled: !!bookingRequestId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const worktimeListRaw = useMemo(
    () => normalizeList(worktimeResp),
    [worktimeResp]
  );

  const worktimeList = useMemo(() => {
    return (worktimeListRaw || []).map((r) => {
      const k = getRowKey(r);
      const ov = localOverrides?.[k];
      return ov ? { ...r, ...ov } : r;
    });
  }, [worktimeListRaw, localOverrides]);

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

  // ===== Helpers build startAt/endAt from date + timeRange =====
  const buildStartEndFromDateAndRange = (workDate, timeRange) => {
    if (!workDate) throw new Error("Vui lòng chọn ngày thực hiện.");
    if (!Array.isArray(timeRange) || timeRange.length !== 2)
      throw new Error("Vui lòng chọn khoảng giờ.");

    const [startTime, endTime] = timeRange;
    if (!startTime || !endTime) throw new Error("Vui lòng chọn đủ giờ.");

    const base = dayjs(workDate).startOf("day");
    const startAt = base
      .hour(dayjs(startTime).hour())
      .minute(0)
      .second(0)
      .millisecond(0);

    const endAt = base
      .hour(dayjs(endTime).hour())
      .minute(0)
      .second(0)
      .millisecond(0);

    if (!endAt.isAfter(startAt)) throw new Error("Giờ kết thúc > giờ bắt đầu.");

    const diff = endAt.diff(startAt, "minute");
    if (diff < 60) throw new Error("Tối thiểu 1 giờ.");
    if (diff > 180) throw new Error("Tối đa 3 giờ.");

    return { startAt, endAt };
  };

  // ===== Load KOL AVAILABLE for a given (workDate + timeRange)
  const fetchAvailableKolsFor = async ({
    workDate,
    timeRange,
    signal,
    size = 500,
  }) => {
    const { startAt, endAt } = buildStartEndFromDateAndRange(
      workDate,
      timeRange
    );

    const dayStart = dayjs(workDate).startOf("day");
    const dayEnd = dayjs(workDate).endOf("day");

    const list = await adminSearchFreeSlots({
      startDate: toIsoNoMs(dayStart),
      endDate: toIsoNoMs(dayEnd),
      page: 0,
      size,
      signal,
    });

    const map = {};
    for (const slot of list || []) {
      const st = String(slot?.status || "").toUpperCase();
      if (st !== "AVAILABLE") continue;

      const s = slot?.startAt ? dayjs(slot.startAt) : null;
      const e = slot?.endAt ? dayjs(slot.endAt) : null;
      if (!s?.isValid() || !e?.isValid()) continue;

      const covers =
        (s.isSame(startAt) || s.isBefore(startAt)) &&
        (e.isSame(endAt) || e.isAfter(endAt));
      if (!covers) continue;

      const kolId = slot?.kolId ? String(slot.kolId) : null;
      if (!kolId) continue;

      if (!map[kolId]) map[kolId] = slot;
    }

    const options = Object.entries(map)
      .map(([kolId, slot]) => ({
        value: kolId,
        label: slot?.kolName || "KOL",
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    return { options, slotMap: map };
  };

  // ===== Inline edit handlers =====
  const startEdit = (record) => {
    const key = getRowKey(record);

    const currentKolId = record?.kolId ? String(record.kolId) : null;
    const currentKolLabel =
      record?.kolName ||
      record?.kol?.fullName ||
      record?.kol?.name ||
      (currentKolId ? "KOL đã gán" : "");

    // ✅ PRE-SEED option để Select KHÔNG nháy kolId
    setEditKolOptions(
      currentKolId
        ? [{ value: currentKolId, label: currentKolLabel || "KOL đã gán" }]
        : []
    );
    setEditSlotByKolId({});

    setEditingRecord(record);
    setEditingKey(key);

    const s = record?.startAt ? dayjs(record.startAt) : null;
    const e = record?.endAt ? dayjs(record.endAt) : null;

    editForm.setFieldsValue({
      workDate: s?.isValid() ? s : dayjs(),
      timeRange: s?.isValid() && e?.isValid() ? [s, e] : undefined,
      note: record?.note ?? null,
      kolId: currentKolId || undefined,
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingRecord(null);
    editForm.resetFields();
    setEditKolOptions([]);
    setEditSlotByKolId({});
  };

  // ✅ Auto load KOL options khi đang edit và user đổi ngày/giờ
  const watchedEditWorkDate = Form.useWatch("workDate", editForm);
  const watchedEditTimeRange = Form.useWatch("timeRange", editForm);

  useEffect(() => {
    if (!editingKey) return;

    if (
      !watchedEditWorkDate ||
      !Array.isArray(watchedEditTimeRange) ||
      watchedEditTimeRange.length !== 2 ||
      !watchedEditTimeRange[0] ||
      !watchedEditTimeRange[1]
    ) {
      setEditSlotByKolId({});
      return;
    }

    let canceled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setEditKolLoading(true);

        const { options, slotMap } = await fetchAvailableKolsFor({
          workDate: watchedEditWorkDate,
          timeRange: watchedEditTimeRange,
          signal: controller.signal,
          size: 500,
        });

        if (canceled) return;

        const currentKolId =
          (editingRecord?.kolId ? String(editingRecord.kolId) : null) ||
          (editForm.getFieldValue("kolId")
            ? String(editForm.getFieldValue("kolId"))
            : null);

        const currentKolLabel =
          editingRecord?.kolName ||
          editingRecord?.kol?.fullName ||
          editingRecord?.kol?.name ||
          (currentKolId ? "KOL đã gán" : "");

        const finalOptions = [...options];

        // ✅ đảm bảo KOL hiện tại luôn có label (không show kolId)
        if (
          currentKolId &&
          !finalOptions.some((o) => String(o.value) === currentKolId)
        ) {
          finalOptions.unshift({
            value: currentKolId,
            label: currentKolLabel || "KOL đã gán",
          });
        }

        setEditSlotByKolId(slotMap);
        setEditKolOptions(finalOptions);
      } catch (e) {
        if (canceled) return;
        message.error(
          e?.message || "Không tải được danh sách KOL rảnh (edit)."
        );
        setEditSlotByKolId({});
      } finally {
        if (!canceled) setEditKolLoading(false);
      }
    }, 350);

    return () => {
      canceled = true;
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey, watchedEditWorkDate, watchedEditTimeRange]);

  const saveEdit = async (record) => {
    try {
      const key = getRowKey(record);
      const values = await editForm.validateFields();

      const { startAt, endAt } = buildStartEndFromDateAndRange(
        values.workDate,
        values.timeRange
      );

      const selectedKolId = values?.kolId ? String(values.kolId) : null;
      const scheduledWorkTimeId = getScheduledId(record);

      // nếu user chọn KOL => gọi assign
      if (selectedKolId) {
        if (!scheduledWorkTimeId) {
          message.error("Không tìm thấy scheduledWorkTimeId để gán KOL.");
          return;
        }

        const slot = editSlotByKolId?.[selectedKolId];
        if (!slot?.id) {
          message.error(
            "KOL này không có slot AVAILABLE cover đúng khoảng giờ. Vui lòng chọn KOL khác."
          );
          return;
        }

        await adminAssignScheduledWorktime({
          scheduledWorkTimeId,
          kolId: selectedKolId,
          availabilityId: slot.id,
        });
      }

      // update UI time/note (vì chưa có API update time/note)
      setLocalOverrides((prev) => ({
        ...prev,
        [key]: {
          startAt: toIsoNoMs(startAt),
          endAt: toIsoNoMs(endAt),
          note: values.note || null,
        },
      }));

      message.success(
        selectedKolId ? "Đã cập nhật & gán/đổi KOL thành công." : "Đã cập nhật."
      );

      setEditingKey(null);
      setEditingRecord(null);
      editForm.resetFields();
      setEditKolOptions([]);
      setEditSlotByKolId({});
      await refetchWorktimes();
    } catch (e) {
      message.error(e?.message || "Cập nhật thất bại.");
    }
  };

  // ===== Create modal handlers =====
  const openCreateModal = () => {
    if (!bookingRequestId) {
      message.warning("Chưa xác định được Booking Request ID.");
      return;
    }

    setCreateOpen(true);
    setKolOptions([]);
    setSlotByKolId({});
    setKolLoading(false);

    createForm.resetFields();
    createForm.setFieldsValue({
      workDate: dayjs(),
      timeRange: undefined,
      kolId: undefined, // optional
      note: null,
    });
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setKolOptions([]);
    setSlotByKolId({});
    setKolLoading(false);
    createForm.resetFields();
  };

  // ✅ AUTO load KOL available for CREATE when date+time changes
  const watchedWorkDate = Form.useWatch("workDate", createForm);
  const watchedTimeRange = Form.useWatch("timeRange", createForm);

  useEffect(() => {
    if (!createOpen) return;

    if (
      !watchedWorkDate ||
      !Array.isArray(watchedTimeRange) ||
      watchedTimeRange.length !== 2 ||
      !watchedTimeRange[0] ||
      !watchedTimeRange[1]
    ) {
      setKolOptions([]);
      setSlotByKolId({});
      return;
    }

    let canceled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setKolLoading(true);

        const { options, slotMap } = await fetchAvailableKolsFor({
          workDate: watchedWorkDate,
          timeRange: watchedTimeRange,
          signal: controller.signal,
          size: 500,
        });

        if (canceled) return;

        setSlotByKolId(slotMap);
        setKolOptions(options);

        const currentKolId = createForm.getFieldValue("kolId");
        if (currentKolId && !slotMap?.[String(currentKolId)]) {
          createForm.setFieldsValue({ kolId: undefined });
        }
      } catch (e) {
        if (canceled) return;
        message.error(e?.message || "Không tải được danh sách KOL rảnh.");
        setKolOptions([]);
        setSlotByKolId({});
      } finally {
        if (!canceled) setKolLoading(false);
      }
    }, 350);

    return () => {
      canceled = true;
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, watchedWorkDate, watchedTimeRange]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();

      const { startAt, endAt } = buildStartEndFromDateAndRange(
        values.workDate,
        values.timeRange
      );

      const chosenKolId = values.kolId ? String(values.kolId) : null;
      const chosenSlot = chosenKolId ? slotByKolId?.[chosenKolId] : null;

      const payload = {
        bookingRequestId,
        startAt: toIsoNoMs(startAt),
        endAt: toIsoNoMs(endAt),
        note: values.note || null,
        ...(chosenKolId ? { kolId: chosenKolId } : {}),
        ...(chosenSlot?.id ? { availabilityId: chosenSlot.id } : {}),
      };

      setCreateSaving(true);
      await adminCreateWorktime(payload);

      message.success("Tạo lịch làm việc thành công.");
      closeCreateModal();
      await refetchWorktimes();
    } catch (e) {
      message.error(e?.message || "Tạo lịch thất bại.");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleRefresh = async () => {
    setWorktimeFilterMode("month");
    setWorktimeFilterDate(dayjs());
    setEditingKey(null);
    setEditingRecord(null);
    editForm.resetFields();
    setEditKolOptions([]);
    setEditSlotByKolId({});

    await Promise.allSettled([refetchBookingDetail(), refetchWorktimes()]);
    message.success("Đã làm mới.");
  };

  // ✅ nút chuyển ngày/tuần/tháng theo mode
  const shiftFilterDate = (dir) => {
    if (worktimeFilterMode === "all") return;

    const base = worktimeFilterDate ? dayjs(worktimeFilterDate) : dayjs();
    const unit =
      worktimeFilterMode === "day"
        ? "day"
        : worktimeFilterMode === "week"
        ? "week"
        : "month";

    setWorktimeFilterDate(base.add(dir, unit));
  };

  // ===== Worktime table columns =====
  const worktimeColumns = [
    {
      title: "STT",
      key: "stt",
      width: 70,
      align: "center",
      render: (_v, _r, index) => index + 1,
    },
    {
      title: "Ngày thực hiện",
      key: "workDateCol",
      width: 150,
      render: (_v, record) => {
        if (!isEditing(record)) {
          const s = record?.startAt ? dayjs(record.startAt) : null;
          return s?.isValid() ? s.format("DD/MM/YYYY") : "--";
        }
        return (
          <Form.Item
            name="workDate"
            rules={[{ required: true, message: "Chọn ngày" }]}
            style={{ marginBottom: 0 }}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        );
      },
    },
    {
      title: "Giờ thực hiện",
      key: "workTimeCol",
      width: 220,
      render: (_v, record) => {
        if (!isEditing(record)) {
          const s = record?.startAt ? dayjs(record.startAt) : null;
          const e = record?.endAt ? dayjs(record.endAt) : null;
          if (!s?.isValid() || !e?.isValid()) return "--";
          return `${s.format("HH:mm")} - ${e.format("HH:mm")}`;
        }
        return (
          <Form.Item
            name="timeRange"
            rules={[{ required: true, message: "Chọn khoảng giờ" }]}
            style={{ marginBottom: 0 }}
          >
            <TimeRangePicker
              format="HH"
              minuteStep={60}
              className="w-full"
              placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
              hideDisabledOptions
              disabledTime={makeDisabledTimeMax3Hours(editForm, "timeRange")}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (v) => {
        const s = String(v || "").toUpperCase();
        const label = WORKTIME_STATUS_LABEL[s] || v || "--";
        const color = WORKTIME_STATUS_COLOR[s] || "default";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "KOL",
      key: "kol",
      width: 240,
      render: (_v, record) => {
        if (!isEditing(record)) {
          return (
            record?.kolName ||
            record?.kol?.fullName ||
            record?.kol?.name ||
            "--"
          );
        }

        return (
          <Form.Item name="kolId" style={{ marginBottom: 0 }}>
            <Select
              showSearch
              allowClear
              loading={editKolLoading}
              placeholder={
                editKolLoading
                  ? "Đang tải KOL rảnh..."
                  : "Chọn KOL (không bắt buộc)"
              }
              options={editKolOptions}
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(String(input || "").toLowerCase())
              }
              notFoundContent={
                editKolLoading ? "Đang tải..." : "Không có KOL rảnh"
              }
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (_v, record) => {
        if (!isEditing(record)) return record?.note || "--";
        return (
          <Form.Item name="note" style={{ marginBottom: 0 }}>
            <Input placeholder="Ghi chú" />
          </Form.Item>
        );
      },
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 170,
      fixed: "right",
      render: (_v, record) => {
        const editing = isEditing(record);
        if (editing) {
          return (
            <Space>
              <Button
                type="primary"
                icon={<Save size={16} />}
                onClick={() => saveEdit(record)}
              >
                Lưu
              </Button>
              <Button icon={<X size={16} />} onClick={cancelEdit}>
                Hủy
              </Button>
            </Space>
          );
        }
        return (
          <Button
            icon={<Pencil size={16} />}
            onClick={() => startEdit(record)}
            disabled={editingKey !== null}
          >
            Sửa
          </Button>
        );
      },
    },
  ];

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Space size="middle" wrap>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate("/admin/management-booking-campaigns")}
            >
              Quay lại danh sách
            </Button>

            <Button
              icon={<CalendarRange size={16} />}
              onClick={handleRefresh}
              loading={fetchingBookingDetail}
            >
              Làm mới
            </Button>
          </Space>

          <div className="text-right">
            <h1 className="text-[18px] font-bold uppercase">Lịch làm việc</h1>
            {campaignDisplayName && (
              <Text type="secondary">
                Campaign: <Text strong>{campaignDisplayName}</Text>
              </Text>
            )}
          </div>
        </div>

        {/* ✅ Thông tin Booking Campaign */}
        <Card
          className="shadow-sm"
          bordered={false}
          title={
            <Space>
              <FileText size={18} />
              <span>Thông tin Booking Campaign</span>
            </Space>
          }
          loading={loadingBookingDetail}
        >
          {errorBookingDetail ? (
            <Alert
              type="error"
              showIcon
              message="Không thể tải chi tiết booking campaign."
              description={String(errorBookingDetail?.message ?? "")}
            />
          ) : bookingRequestsFromCampaign.length ? (
            bookingRequestsFromCampaign.map((record, index) => {
              // ✅ sort dueDate tăng dần
              const schedules = (
                Array.isArray(record?.paymentSchedules)
                  ? record.paymentSchedules
                  : []
              )
                .slice()
                .sort((a, b) => {
                  const da = a?.dueDate ? dayjs(a.dueDate) : null;
                  const db = b?.dueDate ? dayjs(b.dueDate) : null;

                  const va =
                    da && da.isValid()
                      ? da.valueOf()
                      : Number.POSITIVE_INFINITY;
                  const vb =
                    db && db.isValid()
                      ? db.valueOf()
                      : Number.POSITIVE_INFINITY;

                  return va - vb;
                });

              const bookingStatus = normalizeStatus(record?.status);

              const bookingStatusLabel =
                bookingStatus === "NEGOTIATING"
                  ? CAMPAIGN_STATUS_LABEL.NEGOTIATING
                  : BOOKING_STATUS_LABEL[bookingStatus] ??
                    bookingStatus ??
                    "--";

              const bookingStatusColor =
                bookingStatus === "NEGOTIATING"
                  ? CAMPAIGN_STATUS_COLOR.NEGOTIATING
                  : STATUS_TAG_COLOR[bookingStatus] ?? "default";

              const contractStatus = normalizeStatus(record?.contractStatus);
              const contractStatusLabel =
                CONTRACT_STATUS_LABEL[contractStatus] ?? contractStatus ?? "--";
              const contractStatusColor = getStatusColor(contractStatus);

              const contractFileUrl =
                record?.contractFileUrl?.match(/https?:\/\/\S+/)?.[0] ??
                record?.contractFileUrl ??
                "";

              const contractFileName = contractFileUrl
                ? decodeURIComponent(
                    contractFileUrl.split("/").pop().split("?")[0]
                  )
                : null;

              // ✅ 2 trường bạn nói: campaignKols / campaignLives
              // fallback về kols / lives nếu BE trả khác
              const kolsForBooking = Array.isArray(record?.campaignKols)
                ? record.campaignKols
                : Array.isArray(record?.kols)
                ? record.kols
                : [];

              const livesForBooking = Array.isArray(record?.campaignLives)
                ? record.campaignLives
                : Array.isArray(record?.lives)
                ? record.lives
                : [];

              return (
                <Card
                  key={record?.id ?? index}
                  type="inner"
                  className="mb-4 last:mb-0"
                  title={`Booking ${record?.bookingNumber ?? `#${index + 1}`}`}
                >
                  <Descriptions
                    bordered
                    size="middle"
                    column={screens.lg ? 3 : screens.md ? 2 : 1}
                    styles={{ label: { width: 200 } }}
                  >
                    <Descriptions.Item label="Trạng thái">
                      {bookingStatus ? (
                        <Tag color={bookingStatusColor}>
                          {bookingStatusLabel}
                        </Tag>
                      ) : (
                        "--"
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả" span={screens.lg ? 3 : 1}>
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {record?.description ?? "--"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Kiểu lặp">
                      {record?.repeatType ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Lặp đến">
                      {formatDate(record?.repeatUntil)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giá trị hợp đồng">
                      {formatCurrency(record?.contractAmount)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng giá trị booking">
                      {formatCurrency(record?.amount)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo (email)">
                      <Text copyable>{record?.createdByEmail ?? "--"}</Text>
                    </Descriptions.Item>

                    {/* ✅ CHỈ HIỆN NẾU CÓ DATA */}
                    {kolsForBooking.length > 0 && (
                      <Descriptions.Item label="KOL Livestream">
                        {formatArrayText(kolsForBooking)}
                      </Descriptions.Item>
                    )}

                    {livesForBooking.length > 0 && (
                      <Descriptions.Item label="Livestream">
                        {formatArrayText(livesForBooking)}
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Tạo lúc">
                      {formatDateTime(record?.createdAt)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lúc">
                      {formatDateTime(record?.updatedAt)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              );
            })
          ) : (
            <Empty description="Không có booking nào trong campaign này" />
          )}
        </Card>

        {/* Worktimes */}
        <Card
          bordered={false}
          className="flex-1 shadow-sm"
          title={
            <div className="flex items-center justify-between gap-3">
              <span>Danh sách lịch làm việc Campaign</span>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={openCreateModal}
                disabled={!bookingRequestId}
              >
                Thêm lịch làm việc
              </Button>
            </div>
          }
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
                    <Space size={6}>
                      <Tooltip title="Trước đó">
                        <Button
                          size="small"
                          shape="circle"
                          icon={<ChevronLeft size={16} />}
                          onClick={() => shiftFilterDate(-1)}
                        />
                      </Tooltip>

                      <DatePicker
                        picker={
                          worktimeFilterMode === "month" ? "month" : "date"
                        }
                        allowClear={false}
                        value={worktimeFilterDate}
                        onChange={(val) =>
                          setWorktimeFilterDate(val || dayjs())
                        }
                      />

                      <Tooltip
                        title={
                          worktimeFilterMode === "day"
                            ? "Ngày hôm sau"
                            : worktimeFilterMode === "week"
                            ? "Tuần sau"
                            : "Tháng sau"
                        }
                      >
                        <Button
                          size="small"
                          shape="circle"
                          icon={<ChevronRight size={16} />}
                          onClick={() => shiftFilterDate(1)}
                        />
                      </Tooltip>
                    </Space>
                  )}
                </Space>
              </div>

              {errorWorktimes && (
                <Alert
                  className="mb-3"
                  type="error"
                  showIcon
                  message="Không thể tải danh sách lịch."
                  description={String(errorWorktimes?.message ?? "")}
                />
              )}

              <Form form={editForm} component={false}>
                <Table
                  dataSource={visibleWorktimes}
                  columns={worktimeColumns}
                  rowKey={(r) => getRowKey(r)}
                  loading={loadingWorktimes}
                  pagination={false}
                  scroll={{ x: 1400 }}
                />
              </Form>
            </>
          )}
        </Card>

        {/* Create modal */}
        <Modal
          open={createOpen}
          title="Thêm lịch làm việc"
          onCancel={closeCreateModal}
          onOk={handleCreate}
          okText="Tạo"
          confirmLoading={createSaving}
          destroyOnClose
        >
          <Form form={createForm} layout="vertical">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Ngày thực hiện"
                  name="workDate"
                  rules={[{ required: true, message: "Chọn ngày thực hiện" }]}
                >
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Giờ thực hiện"
                  name="timeRange"
                  rules={[{ required: true, message: "Chọn giờ thực hiện" }]}
                >
                  <TimeRangePicker
                    format="HH"
                    minuteStep={60}
                    className="w-full"
                    placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
                    hideDisabledOptions
                    disabledTime={makeDisabledTimeMax3Hours(
                      createForm,
                      "timeRange"
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Chọn KOL / trợ live (không bắt buộc)"
              name="kolId"
              tooltip="Khi chọn KOL, hệ thống tự gán kolId + availabilityId theo lịch rảnh cover đúng khoảng giờ"
            >
              <Select
                showSearch
                allowClear
                loading={kolLoading}
                placeholder={
                  !watchedWorkDate || !watchedTimeRange
                    ? "Chọn ngày và giờ trước"
                    : kolLoading
                    ? "Đang tải danh sách KOL rảnh..."
                    : "Chọn KOL "
                }
                options={kolOptions}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label || "")
                    .toLowerCase()
                    .includes(String(input || "").toLowerCase())
                }
                notFoundContent={
                  kolLoading
                    ? "Đang tải..."
                    : "Không có KOL nào đăng ký lịch trong khoảng giờ này"
                }
              />
            </Form.Item>

            <Form.Item label="Ghi chú" name="note">
              <Input placeholder="Ghi chú" />
            </Form.Item>

            <Text type="secondary">
              Giới hạn thời gian: tối thiểu 1 giờ, tối đa 3 giờ.
            </Text>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
