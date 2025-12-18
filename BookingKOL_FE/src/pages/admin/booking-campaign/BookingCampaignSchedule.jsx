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
  Empty,
  Grid,
  Popconfirm,
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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetWorktimesByBooking,
  adminCreateWorktime,
  adminSearchFreeSlots,
  adminEditScheduledWorktime, // dùng API edit mới
  adminDeleteScheduledWorktime, // ✅ thêm API xóa (đổi tên nếu dự án bạn khác)
} from "../../../services/admin/AdminWorktimeCampaignAPI";
import { adminGetCampaignBookingDetail } from "../../../services/admin/AdminBookingCampaignAPI";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
} from "../../../constants/mySingleBookingStatuses";

dayjs.locale("vi");
const { Text } = Typography;
const { RangePicker: TimeRangePicker } = TimePicker;
const { useBreakpoint } = Grid;

/** ===== Helpers ===== */
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

const normalizeUpper = (val) =>
  val && typeof val === "string" ? val.toUpperCase() : val;

const formatArrayText = (items) => {
  if (!Array.isArray(items) || !items.length)
    return "Không có KOL nào được chọn";
  return items
    .map((x) => x?.displayName || x?.name || x?.id)
    .filter(Boolean)
    .join(", ");
};

/** ===== Repeat type label ===== */
const REPEAT_TYPE_LABEL = {
  WEEKLY: "Hàng tuần",
  DAILY: "Hàng ngày",
  MONTHLY: "Hàng tháng",
  ONCE: "Một lần",
  NONE: "Không lặp",
};
const formatRepeatType = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  const raw = String(value).trim();
  const upper = normalizeUpper(raw);
  return REPEAT_TYPE_LABEL[upper] ?? raw;
};

// mapping nhỏ cho status campaign
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
  PENDING_ASSIGNMENT: "Chưa có KOL",
};

const WORKTIME_STATUS_COLOR = {
  AVAILABLE: "processing",
  ASSIGNED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  CANCELLED: "error",
  PENDING_ASSIGNMENT: "default",
};

/** ===== Worktime role (kolRole) =====
 *  KOL = Host chính
 *  LIVE = Trợ live
 */
const WORKTIME_ROLE_LABEL = {
  KOL: "Host chính",
  LIVE: "Trợ live",
};

const WORKTIME_ROLE_COLOR = {
  KOL: "geekblue",
  LIVE: "purple",
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

  // ✅ auto-open dropdown KOL (edit)
  const [editKolDropdownOpen, setEditKolDropdownOpen] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm] = Form.useForm();

  // Create: KOL options
  const [kolOptions, setKolOptions] = useState([]);
  const [kolLoading, setKolLoading] = useState(false);
  const [slotByKolId, setSlotByKolId] = useState({});

  // Edit: KOL options
  const [editKolOptions, setEditKolOptions] = useState([]);
  const [editKolLoading, setEditKolLoading] = useState(false);
  const [editSlotByKolId, setEditSlotByKolId] = useState({});

  // ✅ Thu gọn / mở rộng phần “Thông tin Booking Campaign”
  const [campaignInfoCollapsed, setCampaignInfoCollapsed] = useState(false);

  // ✅ loading khi xóa
  const [deletingId, setDeletingId] = useState(null);

  // ISO without milliseconds
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

  // ✅ disabledTime: chỉ cho chọn trong khoảng 1–3 giờ
  const makeDisabledTimeMax3Hours = (form, fieldName = "timeRange") => {
    return (_date, type) => {
      const range = form.getFieldValue(fieldName) || [];
      const start = Array.isArray(range) ? range[0] : null;
      const end = Array.isArray(range) ? range[1] : null;

      const startHour = start ? dayjs(start).hour() : null;
      const endHour = end ? dayjs(end).hour() : null;

      let minHour = 0;
      let maxHour = 23;

      if (type === "start") {
        if (endHour != null) {
          minHour = Math.max(0, endHour - 3);
          maxHour = Math.max(minHour, endHour - 1);
        } else {
          minHour = 0;
          maxHour = 22;
        }
      } else {
        if (startHour != null) {
          minHour = Math.min(23, startHour + 1);
          maxHour = Math.min(23, startHour + 3);
        } else {
          minHour = 1;
          maxHour = 23;
        }
      }

      const disabledHours = () => {
        const res = [];
        for (let h = 0; h < 24; h++) {
          if (h < minHour || h > maxHour) res.push(h);
        }
        return res;
      };

      const disabledMinutes = () => {
        const res = [];
        for (let m = 0; m < 60; m++) if (m !== 0) res.push(m);
        return res;
      };

      return { disabledHours, disabledMinutes };
    };
  };

  // ✅ VALIDATOR: để lỗi hiện dưới ô TimeRange
  const makeTimeRangeValidator = (form) => async (_rule, range) => {
    const workDate = form.getFieldValue("workDate");

    if (!workDate) return Promise.resolve();
    if (!Array.isArray(range) || range.length !== 2) return Promise.resolve();

    const [startTime, endTime] = range;
    if (!startTime || !endTime) return Promise.resolve();

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

    if (!endAt.isAfter(startAt)) {
      return Promise.reject(
        new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu.")
      );
    }

    const diff = endAt.diff(startAt, "minute");
    if (diff < 60)
      return Promise.reject(new Error("Lịch làm việc phải tối thiểu 1 giờ."));
    if (diff > 180)
      return Promise.reject(new Error("Lịch làm việc phải tối đa 3 giờ."));

    return Promise.resolve();
  };

  /** ===== Booking detail ===== */
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
        const dow = refDayStart.day();
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

  // ===== build start/end from date + timeRange =====
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
    if (diff < 60) throw new Error("Lịch làm việc phải tối thiểu 1 giờ.");
    if (diff > 180) throw new Error("Lịch làm việc phải tối đa 3 giờ.");

    return { startAt, endAt };
  };

  // ===== fetch KOL free slots cover range =====
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
      const st = normalizeUpper(slot?.status);
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
      (currentKolId ? "KOL tham gia" : "");

    setEditKolOptions(
      currentKolId
        ? [{ value: currentKolId, label: currentKolLabel || "KOL tham gia" }]
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

    setEditKolDropdownOpen(true);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingRecord(null);
    editForm.resetFields();
    setEditKolOptions([]);
    setEditSlotByKolId({});
    setEditKolDropdownOpen(false);
  };

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
      setEditKolOptions([]);
      setEditKolDropdownOpen(false);
      return;
    }

    let canceled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setEditKolLoading(true);
        setEditKolDropdownOpen(true);

        const { options, slotMap } = await fetchAvailableKolsFor({
          workDate: watchedEditWorkDate,
          timeRange: watchedEditTimeRange,
          signal: controller.signal,
          size: 500,
        });

        if (canceled) return;

        const currentKolIdRaw = editForm.getFieldValue("kolId");
        const currentKolId =
          currentKolIdRaw != null && currentKolIdRaw !== ""
            ? String(currentKolIdRaw)
            : editingRecord?.kolId
            ? String(editingRecord.kolId)
            : null;

        let rangeChanged = true;
        try {
          const { startAt, endAt } = buildStartEndFromDateAndRange(
            watchedEditWorkDate,
            watchedEditTimeRange
          );
          const newStartIso = toIsoNoMs(startAt);
          const newEndIso = toIsoNoMs(endAt);

          const oldStartIso = editingRecord?.startAt
            ? toIsoNoMs(dayjs(editingRecord.startAt))
            : null;
          const oldEndIso = editingRecord?.endAt
            ? toIsoNoMs(dayjs(editingRecord.endAt))
            : null;

          if (oldStartIso && oldEndIso) {
            rangeChanged =
              newStartIso !== oldStartIso || newEndIso !== oldEndIso;
          }
        } catch (_err) {
          rangeChanged = true;
        }

        setEditSlotByKolId(slotMap);

        if (rangeChanged) {
          setEditKolOptions(options);

          if (
            (currentKolId && !slotMap?.[currentKolId]) ||
            (options?.length || 0) === 0
          ) {
            editForm.setFieldsValue({ kolId: undefined });
          }

          setEditKolDropdownOpen(true);
        } else {
          const currentKolLabel =
            editingRecord?.kolName ||
            editingRecord?.kol?.fullName ||
            editingRecord?.kol?.name ||
            (currentKolId ? "KOL đã gán" : "");

          const finalOptions = [...options];
          if (
            currentKolId &&
            !finalOptions.some((o) => String(o.value) === currentKolId)
          ) {
            finalOptions.unshift({
              value: currentKolId,
              label: currentKolLabel || "KOL đã gán",
            });
          }

          setEditKolOptions(finalOptions);
          setEditKolDropdownOpen(true);
        }
      } catch (e) {
        if (canceled) return;
        message.error(
          e?.message || "Không tải được danh sách KOL rảnh (edit)."
        );
        setEditSlotByKolId({});
        setEditKolOptions([]);
        setEditKolDropdownOpen(false);
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

      const scheduledWorkTimeId = getScheduledId(record);
      if (!scheduledWorkTimeId) {
        message.error("Không tìm thấy scheduledWorkTimeId để cập nhật.");
        return;
      }

      const selectedKolId = values?.kolId ? String(values.kolId) : null;

      const basePayload = {
        scheduledWorkTimeId,
        startAt: toIsoNoMs(startAt),
        endAt: toIsoNoMs(endAt),
        note: values.note || null,
      };

      let availabilityId;
      if (selectedKolId) {
        const slot = editSlotByKolId?.[selectedKolId];
        if (!slot?.id) {
          message.error(
            "KOL này không có slot AVAILABLE cover đúng khoảng giờ. Vui lòng chọn KOL khác."
          );
          return;
        }
        availabilityId = slot.id;
      }

      await adminEditScheduledWorktime({
        ...basePayload,
        ...(selectedKolId && availabilityId
          ? { kolId: selectedKolId, availabilityId }
          : {}),
      });

      setLocalOverrides((prev) => ({
        ...prev,
        [key]: {
          startAt: basePayload.startAt,
          endAt: basePayload.endAt,
          note: basePayload.note,
        },
      }));

      message.success(
        selectedKolId
          ? "Đã cập nhật lịch & KOL cho ca làm việc."
          : "Đã cập nhật lịch làm việc."
      );

      setEditingKey(null);
      setEditingRecord(null);
      editForm.resetFields();
      setEditKolOptions([]);
      setEditSlotByKolId({});
      setEditKolDropdownOpen(false);
      await refetchWorktimes();
    } catch (e) {
      if (e?.errorFields?.length) return;
      message.error(e?.message || "Cập nhật thất bại.");
    }
  };

  // ✅ Xóa worktime
  const handleDeleteWorktime = async (record) => {
    const scheduledWorkTimeId = getScheduledId(record);
    if (!scheduledWorkTimeId) {
      message.error("Không tìm thấy scheduledWorkTimeId để xóa.");
      return;
    }

    try {
      setDeletingId(String(scheduledWorkTimeId));
      await adminDeleteScheduledWorktime(scheduledWorkTimeId);

      // dọn override nếu có
      const key = getRowKey(record);
      setLocalOverrides((prev) => {
        if (!prev?.[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });

      // nếu đang edit đúng dòng đó thì cancel
      if (isEditing(record)) cancelEdit();

      message.success("Đã xóa lịch làm việc.");
      await refetchWorktimes();
    } catch (e) {
      message.error(e?.message || "Xóa lịch làm việc thất bại.");
    } finally {
      setDeletingId(null);
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
      kolId: undefined,
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
      if (e?.errorFields?.length) return;
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
    setEditKolDropdownOpen(false);

    await Promise.allSettled([refetchBookingDetail(), refetchWorktimes()]);
    message.success("Đã làm mới.");
  };

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
            validateTrigger={["onChange", "onBlur"]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        );
      },
    },
    {
      title: "Giờ thực hiện",
      key: "workTimeCol",
      width: 240,
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
            dependencies={["workDate"]}
            rules={[
              { required: true, message: "Chọn khoảng giờ" },
              { validator: makeTimeRangeValidator(editForm) },
            ]}
            style={{ marginBottom: 0 }}
            validateTrigger={["onChange", "onBlur"]}
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
      title: "Vai trò",
      dataIndex: "kolRole",
      key: "kolRole",
      width: 140,
      render: (v) => {
        const role = normalizeUpper(v);
        if (!role) return "--";
        return (
          <Tag color={WORKTIME_ROLE_COLOR[role] ?? "default"}>
            {WORKTIME_ROLE_LABEL[role] ?? role}
          </Tag>
        );
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
              open={editKolDropdownOpen}
              onDropdownVisibleChange={(open) => setEditKolDropdownOpen(open)}
              placeholder={
                editKolLoading
                  ? "Đang tải KOL rảnh..."
                  : "Chọn KOL cho lịch làm việc"
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (v) => {
        const s = normalizeUpper(v);
        if (!s) return "--";
        return (
          <Tag color={WORKTIME_STATUS_COLOR[s] ?? "default"}>
            {WORKTIME_STATUS_LABEL[s] ?? s}
          </Tag>
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
      width: 240,
      fixed: "right",
      render: (_v, record) => {
        const editing = isEditing(record);
        const scheduledId = getScheduledId(record);
        const isDeletingThis =
          scheduledId != null && String(scheduledId) === String(deletingId);

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
          <Space>
            <Button
              icon={<Pencil size={16} />}
              onClick={() => startEdit(record)}
              disabled={editingKey !== null || isDeletingThis}
            >
              Sửa
            </Button>

            <Popconfirm
              title="Xóa lịch làm việc này?"
              description="Hành động này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteWorktime(record)}
              disabled={editingKey !== null || !scheduledId || isDeletingThis}
            >
              <Button
                danger
                icon={<Trash2 size={16} />}
                loading={isDeletingThis}
                disabled={editingKey !== null || !scheduledId}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
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

        {/* ✅ Thông tin Booking Campaign (có thu gọn) */}
        <Card
          className="shadow-sm"
          bordered={false}
          title={
            <Space>
              <FileText size={18} />
              <span>Thông tin Booking Campaign</span>
            </Space>
          }
          extra={
            <Button
              size="small"
              type="default"
              icon={
                campaignInfoCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )
              }
              onClick={() => setCampaignInfoCollapsed((p) => !p)}
            >
              {campaignInfoCollapsed ? "Mở rộng" : "Thu gọn"}
            </Button>
          }
          loading={loadingBookingDetail}
        >
          {campaignInfoCollapsed ? null : errorBookingDetail ? (
            <Alert
              type="error"
              showIcon
              message="Không thể tải chi tiết booking campaign."
              description={String(errorBookingDetail?.message ?? "")}
            />
          ) : bookingRequestsFromCampaign.length ? (
            bookingRequestsFromCampaign.map((record, index) => {
              const bookingStatus = normalizeUpper(record?.status);

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

              const contractStatus = normalizeUpper(record?.contractStatus);
              const contractStatusLabel =
                CONTRACT_STATUS_LABEL[contractStatus] ?? contractStatus ?? "--";
              const contractStatusColor = getStatusColor(contractStatus);

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

                    {contractStatus && (
                      <Descriptions.Item label="Trạng thái hợp đồng">
                        <Tag color={contractStatusColor}>
                          {contractStatusLabel}
                        </Tag>
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item
                      label="Mục tiêu chiến dịch"
                      span={screens.lg ? 3 : 1}
                    >
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {record?.campaignObjective ?? "--"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày bắt đầu chiến dịch">
                      {formatDate(record?.startDate)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày kết thúc">
                      {formatDate(record?.endDate)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng số giờ">
                      {record?.hours != null ? `${record.hours} giờ` : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Đơn giá">
                      {formatCurrency(record?.unitPrice)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giảm giá (%)">
                      {formatCurrency(record?.discount)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng tiền (VND)">
                      {formatCurrency(record?.totalAmount)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo (email)">
                      <Text copyable>{record?.createdByEmail ?? "--"}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Host chính tham gia">
                      {formatArrayText(kolsForBooking)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trợ Live tham gia">
                      {formatArrayText(livesForBooking)}
                    </Descriptions.Item>

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
                  scroll={{ x: 1850 }}
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
                  validateTrigger={["onChange", "onBlur"]}
                >
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Giờ thực hiện"
                  name="timeRange"
                  dependencies={["workDate"]}
                  rules={[
                    { required: true, message: "Chọn giờ thực hiện" },
                    { validator: makeTimeRangeValidator(createForm) },
                  ]}
                  validateTrigger={["onChange", "onBlur"]}
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
              label="Chọn KOL / trợ live cho ca làm việc"
              name="kolId"
              tooltip="Bạn có thể chọn KOL đã đăng ký lịch trong khoảng giờ này để gán cho ca làm việc."
            >
              <Select
                showSearch
                allowClear
                loading={kolLoading}
                placeholder={
                  !watchedWorkDate || !watchedTimeRange
                    ? "Chọn ngày và giờ trước"
                    : kolLoading
                    ? "Đang tải danh sách KOL đã đăng ký..."
                    : "Chọn KOL"
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
              Giới hạn thời gian: Lịch làm việc phải tối thiểu 1 giờ, tối đa 3
              giờ.
            </Text>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
