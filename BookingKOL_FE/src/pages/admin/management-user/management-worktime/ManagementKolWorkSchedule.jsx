// src/pages/admin/management-user/management-worktime/ManagementKolWorkSchedule.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  message,
  DatePicker,
  Segmented,
  Modal,
  Form,
  Row,
  Col,
  Select,
  Upload,
  ConfigProvider,
  Alert,
  Pagination,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { useQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { get, post, api } from "../../../../config/axios-config";
import { API_PATHS } from "../../../../constants/apiPath";
import { adminCreateBookingSingleRequest } from "../../../../services/admin/AdminBookingSingleRequestAPI";
import {
  getKolProfiles,
  resolveAvatarUrl,
} from "../../../../services/kol/KolAPI";

// ✅ LẤY USER LIST GIỐNG ManagementCustomer (nhưng bỏ search UI)
import { useGetAllBrands } from "../../../../hook/admin/management-user/useGetAllBrands";

dayjs.locale("vi");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MAX_KEYWORD_LEN = 100;

// ✅ build url xem file theo id (đổi theo BE nếu khác) - dùng cho avatar fallback
const FILE_VIEW_BUILDER =
  API_PATHS?.FILE?.view ||
  API_PATHS?.FILE?.getById ||
  API_PATHS?.FILE?.download ||
  ((id) => `/v1/files/${encodeURIComponent(id)}`);

const STATUS_META = {
  PENDING: { label: "Chờ duyệt", color: "gold" },
  APPROVED: { label: "Đã duyệt", color: "green" },
  REJECT: { label: "Từ chối", color: "red" },
  REJECTED: { label: "Từ chối", color: "red" },
};

// ✅ mapping role label theo yêu cầu
const ROLE_LABEL_VI = {
  KOL: "Host chính",
  LIVE: "Trợ live",
};

const safeText = (v) =>
  v === null || v === undefined || v === "" ? "" : String(v);

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.data,
    payload?.result,
    payload?.content,
    payload?.data?.data,
    payload?.data?.result,
    payload?.data?.content,
  ];

  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function extractErrMsg(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Có lỗi xảy ra"
  );
}

function pickKolId(row) {
  return row?.kolId || row?.kol?.id || row?.kol?.kolId || null;
}

function getCancelRowId(r) {
  return (
    r?.id ||
    r?.cancelRequestId ||
    r?.requestId ||
    r?.cancelId ||
    r?.cancelReqId ||
    null
  );
}

function getCancelWorkTimeId(r) {
  return (
    r?.workTimeId || r?.worktimeId || r?.work_time_id || r?.workTime?.id || null
  );
}

function pickFirst(obj, paths = []) {
  for (const p of paths) {
    const parts = String(p).split(".");
    let cur = obj;
    let ok = true;
    for (const k of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, k)) cur = cur[k];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== null && cur !== undefined && cur !== "") return cur;
  }
  return undefined;
}

function formatDateTime(v) {
  if (!v) return "";
  const d = dayjs(v);
  if (!d.isValid()) return safeText(v);
  return d.format("DD/MM/YYYY HH:mm");
}

function formatDateOnly(v) {
  if (!v) return "";
  const d = dayjs(v);
  if (!d.isValid()) return safeText(v);
  return d.format("DD/MM/YYYY");
}

function formatTimeOnly(v) {
  if (!v) return "";
  const d = dayjs(v);
  if (d.isValid()) return d.format("HH:mm");
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  return safeText(v);
}

function getTimeRange(row) {
  const start =
    row?.startAt ||
    row?.startTime ||
    row?.fromTime ||
    row?.startDateTime ||
    row?.beginAt;

  const end =
    row?.endAt ||
    row?.endTime ||
    row?.toTime ||
    row?.endDateTime ||
    row?.finishAt;

  const s = formatTimeOnly(start);
  const e = formatTimeOnly(end);

  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

function toIso(v) {
  if (!v) return "";
  const d = dayjs(v);
  if (d.isValid()) return d.toISOString();
  return typeof v === "string" ? v : "";
}

// =====================
// API: CANCEL REQUESTS
// =====================
async function adminGetAllCancelRequests({ signal } = {}) {
  const url =
    API_PATHS?.CANCEL_ADMIN?.getAll || "/v1/requests/admin/cancel/all";

  const res = await get({
    url,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}

// =====================
// API: REGISTER AVAILABILITY  ✅ /availabilities/admin/add
// =====================
const API_ADD_REGISTER_AVAILABILITY =
  API_PATHS?.SCHEDULER_ADMIN?.adminAddAvailability ||
  "/v1/availabilities/admin/add";

async function adminAddRegisterAvailability(payload, { signal } = {}) {
  const res = await post({
    url: API_ADD_REGISTER_AVAILABILITY,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

// =====================
// API: BOOKING DETAIL BY workTimeId
// =====================
async function adminGetBookingDetailByWorkTimeId(workTimeId, { signal } = {}) {
  if (!workTimeId) throw new Error("workTimeId là bắt buộc");

  const builder =
    API_PATHS?.BOOKING_REQUEST?.getDetailByWorkTime ||
    ((id) => `/v1/requests/booking/detail/${encodeURIComponent(id)}`);

  const res = await get({
    url: builder(workTimeId),
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}

// =====================
// TAB 1 - KOL TIMELINE ALL
// =====================
const PATH_KOL_TIMELINE_ALL =
  API_PATHS?.SCHEDULER_ADMIN?.kolTimelineAll ||
  "/v1/availabilities/time-line/kol/all";

async function adminGetKolTimelineAll({
  startDate,
  endDate,
  page = 0,
  size = 100,
  signal,
} = {}) {
  const params = { page, size };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await api.get(PATH_KOL_TIMELINE_ALL, {
    params,
    ...(signal ? { signal } : {}),
  });

  const raw = res?.data ?? res;
  const list = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  return list;
}

// ✅ resolve avatar từ fileUsageDtos (fallback nếu resolveAvatarUrl chưa handle id-only)
function resolveAvatarFromFileUsageDtos(profile) {
  const list = Array.isArray(profile?.fileUsageDtos)
    ? profile.fileUsageDtos
    : [];
  const preferred = list[0];
  if (!preferred) return "";

  const url =
    preferred?.url ||
    preferred?.fileUrl ||
    preferred?.path ||
    preferred?.filePath ||
    preferred?.downloadUrl ||
    preferred?.previewUrl ||
    preferred?.file?.url ||
    preferred?.file?.fileUrl ||
    preferred?.file?.path;

  if (typeof url === "string" && url.trim()) return url.trim();

  const fileId = preferred?.id || preferred?.fileId || preferred?.file?.id;
  if (fileId) return FILE_VIEW_BUILDER(fileId);

  return "";
}

function resolveKolAvatarSafe(profile) {
  const byUtil = resolveAvatarUrl?.(profile);
  if (byUtil) return byUtil;

  const byDtos = resolveAvatarFromFileUsageDtos(profile);
  if (byDtos) return byDtos;

  return profile?.avatarUrl || profile?.avatar || "";
}

export default function ManagementKolWorkSchedule() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("registered");

  // TAB 1
  const [scheduleKeyword, setScheduleKeyword] = useState("");
  const [range, setRange] = useState(null);

  // TAB 2
  const [cancelKeyword, setCancelKeyword] = useState("");
  const [selectedCancelRow, setSelectedCancelRow] = useState(null);
  const [viewingWorktimeId, setViewingWorktimeId] = useState(null);

  // ✅ Modal thêm lịch làm việc
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  // watch startAt để disable endAt theo startAt
  const startAtWatch = Form.useWatch("startAt", createForm);

  // ✅ KOL select options (hiển thị avatar + displayName) - ALL ROLE
  const [kolSelectOptions, setKolSelectOptions] = useState([]);
  const [kolSelectLoading, setKolSelectLoading] = useState(false);

  // =========================
  // ✅ USERS: dùng hook giống ManagementCustomer (BỎ SEARCH, chỉ phân trang)
  // =========================
  const [userPage, setUserPage] = useState(0);
  const [userSize, setUserSize] = useState(500); // ✅ default 500

  const {
    isLoadingGetAllBrands: userLoading,
    ResponseGetAllBrands: usersResponse,
    refetchGetAllBrands: refetchUsers,
  } = useGetAllBrands(userPage, userSize, undefined);

  // 🔥 nếu hook không auto-refetch theo params, bật thêm effect này (an toàn):
  useEffect(() => {
    refetchUsers?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userSize]);

  const userList = usersResponse?.data?.content || [];
  const userTotal = usersResponse?.data?.totalElements || 0;

  const userMapRef = useRef({}); // id -> user (tích lũy các page đã load)

  useEffect(() => {
    const next = { ...(userMapRef.current || {}) };
    (userList || []).forEach((u) => {
      const id = u?.userId || u?.id;
      if (!id) return;
      next[String(id)] = u;
    });
    userMapRef.current = next;
  }, [userList]);

  const userOptions = useMemo(() => {
    return (userList || [])
      .map((u) => {
        const id = u?.userId || u?.id;
        if (!id) return null;

        const fullName = u?.fullName || u?.displayName || u?.name || "";
        const email = u?.email || "";
        const phone = u?.phone || "";

        const labelMain = fullName || email || phone || String(id);
        const labelSub = [email, phone].filter(Boolean).join(" • ");

        return {
          value: String(id),
          label: (
            <div className="flex flex-col leading-tight">
              <span className="font-medium">{labelMain}</span>
              {labelSub ? (
                <span className="text-xs text-gray-500">{labelSub}</span>
              ) : null}
            </div>
          ),
        };
      })
      .filter(Boolean);
  }, [userList]);

  const onUserChange = (userId) => {
    const u = userId ? userMapRef.current?.[String(userId)] : null;
    if (!u) return;

    createForm.setFieldsValue({
      fullName: u?.fullName || u?.displayName || u?.name || "",
      phone: u?.phone || "",
      email: u?.email || "",
    });
  };

  // ✅ Attachments theo BookingFlow: giữ File local, không upload trước
  const [fileList, setFileList] = useState([]);

  const attachedFiles = useMemo(() => {
    return (fileList || []).map((f) => f?.originFileObj).filter(Boolean); // File[]
  }, [fileList]);

  // =========================
  // ✅ RULE: chỉ chọn từ hôm nay + giờ hiện tại trở đi (phút = 00)
  // =========================
  const disabledDateFromToday = (current) => {
    if (!current) return false;
    return current.isBefore(dayjs().startOf("day"));
  };

  const minHourFromNow = () => {
    const now = dayjs();
    const needNextHour = now.minute() > 0 || now.second() > 0;
    return now.hour() + (needNextHour ? 1 : 0); // 0..24
  };

  // ✅ CHỈ disable HOURS (tránh bug OK/Now disable)
  const disabledTimeStart = (current) => {
    if (!current) return {};
    const isToday = dayjs(current).isSame(dayjs(), "day");
    if (!isToday) return {};
    const minH = minHourFromNow();
    return {
      disabledHours: () =>
        Array.from({ length: 24 }, (_, h) => h).filter((h) => h < minH),
    };
  };

  const disabledDateEnd = (current) => {
    if (!current) return false;

    const today = dayjs().startOf("day");
    const startDay = startAtWatch ? dayjs(startAtWatch).startOf("day") : null;

    const minDay = startDay && startDay.isAfter(today) ? startDay : today;

    if (
      startAtWatch &&
      dayjs(current).isSame(dayjs(startAtWatch), "day") &&
      dayjs(startAtWatch).hour() >= 23
    ) {
      return true;
    }

    return dayjs(current).isBefore(minDay);
  };

  const disabledTimeEnd = (current) => {
    if (!current) return {};
    let minH = 0;

    if (dayjs(current).isSame(dayjs(), "day")) {
      minH = Math.max(minH, minHourFromNow());
    }

    if (startAtWatch && dayjs(current).isSame(dayjs(startAtWatch), "day")) {
      minH = Math.max(minH, dayjs(startAtWatch).hour() + 1);
    }

    return {
      disabledHours: () =>
        Array.from({ length: 24 }, (_, h) => h).filter((h) => h < minH),
    };
  };

  const timePanelDefault = useMemo(() => {
    const now = dayjs();
    const addH = now.minute() > 0 || now.second() > 0 ? 1 : 0;
    return now.add(addH, "hour").minute(0).second(0).millisecond(0);
  }, []);

  // ===== load KOL options: HIỂN THỊ TẤT CẢ ROLE =====
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchProfiles = async () => {
      try {
        setKolSelectLoading(true);

        const res = await getKolProfiles({
          signal: controller.signal,
          params: { page: 0, size: 500 },
        });

        if (ignore) return;

        const list =
          (Array.isArray(res?.content) && res.content) ||
          (Array.isArray(res?.data?.content) && res.data.content) ||
          (Array.isArray(res?.data) && res.data) ||
          [];

        const opts = list.map((item) => {
          const id = item?.id;
          const name =
            item?.displayName ||
            item?.fullName ||
            item?.username ||
            item?.email ||
            item?.phone ||
            id;

          const avatar = resolveKolAvatarSafe(item);

          const roleRaw = String(item?.role || "").toUpperCase();
          const roleLabel = ROLE_LABEL_VI[roleRaw] || roleRaw || "UNKNOWN";
          const secondary = item?.email || item?.phone || "";

          return {
            value: id,
            label: (
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                )}
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{name}</span>
                    <Tag style={{ marginInlineEnd: 0 }} color="blue">
                      {roleLabel}
                    </Tag>
                  </div>
                  {secondary ? (
                    <span className="text-xs text-gray-500">{secondary}</span>
                  ) : null}
                </div>
              </div>
            ),
          };
        });

        setKolSelectOptions(opts);
      } catch (err) {
        if (!ignore) {
          console.error("Fetch profiles error:", err);
          message.error("Không tải được danh sách KOL/Users");
          setKolSelectOptions([]);
        }
      } finally {
        if (!ignore) setKolSelectLoading(false);
      }
    };

    fetchProfiles();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  // ===== TAB 1 QUERY =====
  const startDate = useMemo(() => {
    if (!range?.[0]) return undefined;
    return range[0].format("YYYY-MM-DD");
  }, [range]);

  const endDate = useMemo(() => {
    if (!range?.[1]) return undefined;
    return range[1].format("YYYY-MM-DD");
  }, [range]);

  const timelineQuery = useQuery({
    queryKey: ["admin-kol-timeline-all", startDate, endDate],
    queryFn: ({ signal }) =>
      adminGetKolTimelineAll({
        startDate,
        endDate,
        page: 0,
        size: 200,
        signal,
      }),
    staleTime: 15_000,
    enabled: activeTab === "registered",
  });

  const timelineList = useMemo(
    () => normalizeList(timelineQuery.data),
    [timelineQuery.data]
  );

  const filteredTimelineRows = useMemo(() => {
    const kw = scheduleKeyword.trim().toLowerCase();
    if (!kw) return timelineList;

    return timelineList.filter((r) => {
      const haystack = [
        r?.id,
        r?.availabilityId,
        r?.workTimeId,
        r?.scheduledWorkTimeId,
        r?.bookingRequestId,
        r?.status,
        r?.type,
        r?.note,
        r?.platform,
        r?.startAt,
        r?.endAt,
        r?.kolName,
        r?.kol?.fullName,
        r?.kol?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(kw);
    });
  }, [timelineList, scheduleKeyword]);

  const timelineColumns = useMemo(
    () => [
      {
        title: "STT",
        key: "__idx",
        width: 70,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "KOL",
        key: "kol",
        width: 320,
        render: (_, r) => {
          const name = r?.kolName || r?.kol?.fullName || r?.kol?.name || "";
          const sub = r?.kol?.email || r?.email || r?.phone || "";
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name}</div>
              {sub ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Ngày",
        key: "date",
        width: 150,
        render: (_, r) => (
          <span>{formatDateOnly(r?.startAt || r?.date || r?.createdAt)}</span>
        ),
      },
      {
        title: "Khung giờ",
        key: "timeRange",
        width: 140,
        render: (_, r) => <span>{getTimeRange(r)}</span>,
      },
      {
        title: "Ngày tạo",
        key: "createdAt",
        width: 180,
        render: (_, r) => formatDateTime(r?.createdAt),
      },
    ],
    []
  );

  // ===== TAB 2 QUERY =====
  const cancelQuery = useQuery({
    queryKey: ["admin-cancel-requests"],
    queryFn: ({ signal }) => adminGetAllCancelRequests({ signal }),
    staleTime: 15_000,
    enabled: activeTab === "cancel",
  });

  const cancelList = useMemo(
    () => normalizeList(cancelQuery.data),
    [cancelQuery.data]
  );

  const filteredCancelRows = useMemo(() => {
    const kw = cancelKeyword.trim().toLowerCase();
    if (!kw) return cancelList;

    return cancelList.filter((r) => {
      const haystack = [
        getCancelRowId(r),
        getCancelWorkTimeId(r),
        r?.reason,
        r?.status,
        r?.adminNote,
        r?.kolName,
        r?.kol?.fullName,
        r?.kol?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(kw);
    });
  }, [cancelList, cancelKeyword]);

  // ✅ Mutation tạo lịch làm việc (single request)
  const createSingleBookingMutation = useMutation({
    mutationFn: async ({ payload, signal }) =>
      adminCreateBookingSingleRequest(payload, { signal }),
    onSuccess: () => {
      message.success("Tạo lịch làm việc thành công.");
      setCreateOpen(false);
      cancelQuery.refetch();
      timelineQuery.refetch();
    },
    onError: (err) => {
      // ✅ lỗi là stop loading ngay để tạo lại
      message.error(extractErrMsg(err));
      setCreateLoading(false);
    },
    onSettled: () => {
      // ✅ luôn đảm bảo không bị kẹt loading
      setCreateLoading(false);
    },
  });

  // ✅ Mutation: thêm lịch đăng ký
  const addRegisterMutation = useMutation({
    mutationFn: async ({ cancelRow, signal }) => {
      const workTimeId = getCancelWorkTimeId(cancelRow);
      if (!workTimeId) throw new Error("Dòng đang chọn không có workTimeId.");

      const detail = await adminGetBookingDetailByWorkTimeId(workTimeId, {
        signal,
      });

      const kolId = String(
        pickKolId(cancelRow) || pickFirst(detail, ["kolId", "kol.id"]) || ""
      );
      if (!kolId) throw new Error("Không lấy được kolId để thêm lịch đăng ký.");

      const startAtRaw =
        pickFirst(detail, [
          "startAt",
          "workTime.startAt",
          "scheduledWorkTime.startAt",
          "scheduledWorkTimes.0.startAt",
          "workTimes.0.startAt",
        ]) ||
        cancelRow?.startAt ||
        cancelRow?.startTime;

      const endAtRaw =
        pickFirst(detail, [
          "endAt",
          "workTime.endAt",
          "scheduledWorkTime.endAt",
          "scheduledWorkTimes.0.endAt",
          "workTimes.0.endAt",
        ]) ||
        cancelRow?.endAt ||
        cancelRow?.endTime;

      const startAt = toIso(startAtRaw);
      const endAt = toIso(endAtRaw);

      if (!startAt || !endAt)
        throw new Error("Không lấy được startAt/endAt để thêm lịch đăng ký.");

      return adminAddRegisterAvailability(
        { kolId, startAt, endAt },
        { signal }
      );
    },
    onSuccess: () => {
      message.success("Đã thêm lịch đăng ký.");
      cancelQuery.refetch();
      timelineQuery.refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const viewDetailMutation = useMutation({
    mutationFn: ({ workTimeId }) =>
      adminGetBookingDetailByWorkTimeId(workTimeId),
    onSuccess: (data) => {
      const requestId =
        data?.id ||
        data?.bookingRequestId ||
        data?.bookingRequest?.id ||
        data?.booking?.id;

      if (!requestId) {
        message.error(
          "Không lấy được bookingRequestId từ API detail theo workTimeId."
        );
        return;
      }

      navigate(`/admin/management-booking-requests/${requestId}`);
    },
    onError: (err) => message.error(extractErrMsg(err)),
    onSettled: () => setViewingWorktimeId(null),
  });

  const isAnyActionLoading =
    createSingleBookingMutation.isPending ||
    addRegisterMutation.isPending ||
    viewDetailMutation.isPending ||
    createLoading;

  const ensureCancelRowSelected = () => {
    if (activeTab !== "cancel") {
      message.warning(
        "Vui lòng chuyển sang tab 'Danh sách yêu cầu huỷ đơn' và chọn 1 dòng."
      );
      return null;
    }
    if (!selectedCancelRow) {
      message.warning("Bạn chưa chọn dòng nào trong danh sách yêu cầu huỷ.");
      return null;
    }
    const workTimeId = getCancelWorkTimeId(selectedCancelRow);
    if (!workTimeId) {
      message.warning("Dòng đang chọn không có workTimeId.");
      return null;
    }
    return selectedCancelRow;
  };

  // ✅ MỞ POPUP tạo lịch làm việc
  const openCreateModal = async () => {
    setCreateOpen(true);
    setCreateLoading(false);

    setFileList([]);
    createForm.resetFields();

    setUserPage(0);
    setUserSize(500); // ✅ default 500 khi mở
    refetchUsers?.();

    createForm.setFieldsValue({
      userId: undefined,
      kolId: undefined,
      fullName: "",
      phone: "",
      email: "",
      startAt: null,
      endAt: null,
      platform: "",
      description: "",
      location: "",
    });
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateLoading(false);
    createForm.resetFields();
    setFileList([]);
  };

  // ✅ Submit tạo lịch làm việc
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();

      const start = values?.startAt ? dayjs(values.startAt) : null;
      const end = values?.endAt ? dayjs(values.endAt) : null;

      if (!start?.isValid() || !end?.isValid()) {
        message.error("Thời gian bắt đầu/kết thúc không hợp lệ.");
        setCreateLoading(false);
        return;
      }
      if (!end.isAfter(start)) {
        message.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
        setCreateLoading(false);
        return;
      }

      const now = dayjs();
      const minStartTodayHour = minHourFromNow();
      if (start.isSame(now, "day")) {
        const minStart = now.startOf("day").hour(minStartTodayHour).minute(0);
        if (start.isBefore(minStart)) {
          message.error("Chỉ được chọn từ thời điểm hiện tại trở đi.");
          setCreateLoading(false);
          return;
        }
      }
      if (start.isBefore(now.startOf("day"))) {
        message.error("Không được chọn ngày trước hôm nay.");
        setCreateLoading(false);
        return;
      }

      setCreateLoading(true);

      const payload = {
        bookingSingleReqByAdmin: {
          userId: String(values.userId),
          kolId: String(values.kolId),
          fullName: safeText(values.fullName),
          phone: safeText(values.phone),
          email: safeText(values.email),
          startAt: start.minute(0).second(0).millisecond(0).toISOString(),
          endAt: end.minute(0).second(0).millisecond(0).toISOString(),
          platform: safeText(values.platform),
          description: safeText(values.description),
          location: safeText(values.location),
        },
        attachedFiles,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        await createSingleBookingMutation.mutateAsync({
          payload,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      // ✅ dù lỗi validate hay lỗi khác cũng đảm bảo stop loading
      if (e?.errorFields?.length) {
        setCreateLoading(false);
        return;
      }
      message.error(e?.message || "Tạo lịch thất bại.");
      setCreateLoading(false);
    }
  };

  const onClickAddRegister = () => {
    const row = ensureCancelRowSelected();
    if (!row) return;

    Modal.confirm({
      title: "Thêm lịch đăng ký",
      content: "Thêm lịch đăng ký (availability) cho dòng đang chọn?",
      okText: "Thêm",
      cancelText: "Hủy",
      onOk: async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
          await addRegisterMutation.mutateAsync({
            cancelRow: row,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      },
    });
  };

  const cancelColumns = useMemo(
    () => [
      {
        title: "STT",
        key: "__idx",
        width: 70,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "KOL",
        key: "kol",
        width: 320,
        render: (_, r) => {
          const name = r?.kolName || r?.kol?.fullName || r?.kol?.name || "";
          const sub = r?.kol?.email || r?.email || r?.phone || "";
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name}</div>
              {sub ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        render: (v) => <Text ellipsis={{ tooltip: v }}>{safeText(v)}</Text>,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (v) => {
          const meta = STATUS_META[v] || {
            label: safeText(v),
            color: "default",
          };
          return (
            <Tag color={meta.color} style={{ marginRight: 0 }}>
              {meta.label}
            </Tag>
          );
        },
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : ""),
      },
      {
        title: "Ngày duyệt",
        dataIndex: "approvedAt",
        key: "approvedAt",
        width: 180,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : ""),
      },
      {
        title: "Ghi chú admin",
        dataIndex: "adminNote",
        key: "adminNote",
        render: (v) => <Text ellipsis={{ tooltip: v }}>{safeText(v)}</Text>,
      },
      {
        title: "Thao tác",
        key: "action",
        align: "center",
        width: 120,
        fixed: "right",
        render: (_, record) => {
          const wtId = getCancelWorkTimeId(record);
          const loadingThisRow =
            viewDetailMutation.isPending &&
            viewingWorktimeId &&
            viewingWorktimeId === wtId;

          return (
            <div className="w-full flex justify-center">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!wtId) {
                    message.error("Không có workTimeId để xem chi tiết.");
                    return;
                  }
                  setViewingWorktimeId(wtId);
                  viewDetailMutation.mutate({ workTimeId: wtId });
                }}
                className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all flex items-center justify-center"
              >
                {loadingThisRow ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Eye size={18} className="font-semibold" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [viewDetailMutation.isPending, viewingWorktimeId]
  );

  const isScheduleKeywordMax =
    (scheduleKeyword || "").length >= MAX_KEYWORD_LEN;
  const isCancelKeywordMax = (cancelKeyword || "").length >= MAX_KEYWORD_LEN;

  return (
    <ConfigProvider locale={viVN}>
      <Card style={{ borderRadius: 12 }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Title level={4} style={{ marginBottom: 8 }}>
              Quản lý lịch KOL
            </Title>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Segmented
                options={[
                  { label: "Lịch KOL đã đăng ký", value: "registered" },
                  { label: "Danh sách yêu cầu huỷ đơn", value: "cancel" },
                ]}
                value={activeTab}
                onChange={(v) => {
                  setActiveTab(v);
                  if (v !== "cancel") setSelectedCancelRow(null);
                }}
              />

              <Space wrap>
                <Button
                  type="primary"
                  onClick={openCreateModal}
                  disabled={isAnyActionLoading}
                  loading={createLoading}
                >
                  Thêm lịch làm việc
                </Button>
              </Space>
            </div>
          </div>

          {activeTab === "registered" ? (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 260 }}>
                    <RangePicker
                      value={range}
                      onChange={(v) => setRange(v)}
                      allowClear
                      style={{ width: "100%" }}
                      placeholder={["Từ ngày", "Đến ngày"]}
                      format="DD/MM/YYYY"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 280 }}>
                    <Input
                      placeholder="Tìm theo tên KOL..."
                      value={scheduleKeyword}
                      maxLength={MAX_KEYWORD_LEN}
                      showCount={false}
                      onChange={(e) => {
                        const next = e?.target?.value ?? "";
                        setScheduleKeyword(
                          next.length > MAX_KEYWORD_LEN
                            ? next.slice(0, MAX_KEYWORD_LEN)
                            : next
                        );
                      }}
                      style={{ width: "100%" }}
                      allowClear
                    />
                    {isScheduleKeywordMax ? (
                      <Text
                        type="danger"
                        style={{ display: "block", marginTop: 4, fontSize: 12 }}
                      >
                        Đã đạt tối đa {MAX_KEYWORD_LEN} ký tự.
                      </Text>
                    ) : null}
                  </div>

                  <Button
                    onClick={() => timelineQuery.refetch()}
                    loading={timelineQuery.isFetching}
                    disabled={isAnyActionLoading}
                  >
                    Làm mới
                  </Button>
                </div>
              </div>

              <Table
                rowKey={(r) =>
                  r?.id ||
                  r?.availabilityId ||
                  `${pickKolId(r)}-${r?.startAt || ""}-${r?.endAt || ""}`
                }
                columns={timelineColumns}
                dataSource={filteredTimelineRows}
                loading={timelineQuery.isLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Space>
          ) : (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space
                wrap
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Space wrap>
                  <div style={{ width: 520, maxWidth: "100%" }}>
                    <Input
                      placeholder="Tìm theo tên KOL / mã yêu cầu / lý do / trạng thái..."
                      value={cancelKeyword}
                      maxLength={MAX_KEYWORD_LEN}
                      showCount={false}
                      onChange={(e) => {
                        const next = e?.target?.value ?? "";
                        setCancelKeyword(
                          next.length > MAX_KEYWORD_LEN
                            ? next.slice(0, MAX_KEYWORD_LEN)
                            : next
                        );
                      }}
                      style={{ width: "100%" }}
                      allowClear
                    />
                    {isCancelKeywordMax ? (
                      <Text
                        type="danger"
                        style={{ display: "block", marginTop: 4, fontSize: 12 }}
                      >
                        Đã đạt tối đa {MAX_KEYWORD_LEN} ký tự.
                      </Text>
                    ) : null}
                  </div>

                  <Button
                    onClick={() => cancelQuery.refetch()}
                    disabled={isAnyActionLoading}
                    loading={cancelQuery.isFetching}
                  >
                    Làm mới
                  </Button>
                </Space>
              </Space>

              <Table
                rowKey={(r) =>
                  getCancelRowId(r) ||
                  getCancelWorkTimeId(r) ||
                  `${pickKolId(r)}-${r?.createdAt || ""}`
                }
                columns={cancelColumns}
                dataSource={filteredCancelRows}
                loading={cancelQuery.isLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
                onRow={(record) => ({
                  onClick: () => setSelectedCancelRow(record),
                })}
                rowClassName={(record) =>
                  getCancelRowId(record) &&
                  getCancelRowId(record) === getCancelRowId(selectedCancelRow)
                    ? "bg-slate-50"
                    : ""
                }
              />
            </Space>
          )}

          {/* Popup tạo lịch làm việc */}
          <Modal
            open={createOpen}
            title="Thêm lịch làm việc"
            onCancel={closeCreateModal}
            onOk={handleCreate}
            okText="Tạo"
            cancelText="Hủy"
            confirmLoading={
              createSingleBookingMutation.isPending || createLoading
            }
            destroyOnClose
            maskClosable={
              !(createSingleBookingMutation.isPending || createLoading)
            }
          >
            <Form form={createForm} layout="vertical" disabled={createLoading}>
              {/* ✅ userId: CHỈ LIST, KHÔNG SEARCH */}
              <Form.Item
                label="Khách hàng"
                name="userId"
                rules={[
                  { required: true, message: "Vui lòng chọn khách hàng" },
                ]}
              >
                <Select
                  allowClear
                  loading={userLoading}
                  placeholder={userLoading ? "Đang tải..." : "Chọn khách hàng"}
                  options={userOptions}
                  showSearch={false}
                  filterOption={false}
                  notFoundContent={
                    userLoading ? "Đang tải..." : "Không có user"
                  }
                  onChange={onUserChange}
                />
              </Form.Item>

              {/* ✅ KOL list tất cả role (CHỈ LIST, KHÔNG SEARCH) */}
              <Form.Item
                label="Chọn người thực hiện"
                name="kolId"
                rules={[
                  { required: true, message: "Vui lòng chọn người thực hiện" },
                ]}
                style={{ marginTop: 12 }}
              >
                <Select
                  allowClear
                  placeholder={
                    kolSelectLoading
                      ? "Đang tải danh sách..."
                      : "Chọn người thực hiện"
                  }
                  loading={kolSelectLoading}
                  options={kolSelectOptions}
                  showSearch={false}
                  filterOption={false}
                  notFoundContent={
                    kolSelectLoading ? "Đang tải..." : "Không có dữ liệu"
                  }
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Bắt đầu"
                    name="startAt"
                    rules={[
                      { required: true, message: "Chọn thời gian bắt đầu" },
                    ]}
                  >
                    <DatePicker
                      className="w-full"
                      disabledDate={disabledDateFromToday}
                      showTime={{
                        format: "HH:mm",
                        minuteStep: 60,
                        showSecond: false,
                        defaultValue: timePanelDefault,
                      }}
                      disabledTime={disabledTimeStart}
                      format="DD/MM/YYYY HH:mm"
                      inputReadOnly
                      onChange={(val) => {
                        if (!val) return;
                        const d = dayjs(val).minute(0).second(0).millisecond(0);
                        createForm.setFieldValue("startAt", d);

                        const endVal = createForm.getFieldValue("endAt");
                        if (endVal && !dayjs(endVal).isAfter(d)) {
                          createForm.setFieldValue("endAt", null);
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Kết thúc"
                    name="endAt"
                    rules={[
                      { required: true, message: "Chọn thời gian kết thúc" },
                    ]}
                  >
                    <DatePicker
                      className="w-full"
                      disabledDate={disabledDateEnd}
                      showTime={{
                        format: "HH:mm",
                        minuteStep: 60,
                        showSecond: false,
                        defaultValue: timePanelDefault,
                      }}
                      disabledTime={disabledTimeEnd}
                      format="DD/MM/YYYY HH:mm"
                      inputReadOnly
                      onChange={(val) => {
                        if (!val) return;
                        const d = dayjs(val).minute(0).second(0).millisecond(0);
                        createForm.setFieldValue("endAt", d);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Nền tảng" name="platform">
                <Input />
              </Form.Item>

              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item label="Địa điểm" name="location">
                <Input />
              </Form.Item>

              {/* ✅ Upload theo BookingFlow: chỉ chọn file, không upload trước */}
              <Form.Item label="Tệp đính kèm">
                <Upload
                  multiple
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: fl }) => setFileList(fl)}
                  onRemove={(file) => {
                    setFileList((prev) =>
                      prev.filter((f) => f.uid !== file.uid)
                    );
                    return true;
                  }}
                >
                  <Button>Chọn tệp</Button>
                </Upload>
              </Form.Item>

              {!userLoading && userOptions.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="Không có dữ liệu user"
                  description="Hook useGetAllBrands trả về rỗng. Kiểm tra lại BE endpoint mà hook đang gọi."
                />
              ) : null}
            </Form>
          </Modal>
        </Space>
      </Card>
    </ConfigProvider>
  );
}
