// src/pages/admin/management-user/management-worktime/ManagementKolWorkSchedule.jsx
import React, { useMemo, useState } from "react";
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
} from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { get, post, api } from "../../../../config/axios-config";
import { API_PATHS } from "../../../../constants/apiPath";
import { adminCreateBookingSingleRequest } from "../../../../services/admin/AdminBookingSingleRequestAPI";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MAX_KEYWORD_LEN = 100;

const STATUS_META = {
  PENDING: { label: "Chờ duyệt", color: "gold" },
  APPROVED: { label: "Đã duyệt", color: "green" },
  REJECT: { label: "Từ chối", color: "red" },
  REJECTED: { label: "Từ chối", color: "red" },
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

// ✅ cancel row id có thể khác tên field
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

// ✅ workTimeId có thể khác key / nằm nested
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

function asStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return [String(v)];
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
// API: KOL MAP (HIDE ID)
// =====================
async function adminGetKolsPage({ page = 0, size = 200, signal } = {}) {
  const base = API_PATHS?.MANAGEMENT_USER?.managementKOL || "/v1/admin/kol/all";
  const res = await get({
    url: `${base}?page=${page}&size=${size}`,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

async function buildKolMapByIds(kolIds, { signal } = {}) {
  const need = new Set((kolIds || []).filter(Boolean));
  const map = new Map();
  if (need.size === 0) return map;

  const size = 200;
  const maxPages = 50;
  let page = 0;

  while (page < maxPages && need.size > 0) {
    const payload = await adminGetKolsPage({ page, size, signal });

    const content = Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload?.data?.content)
      ? payload.data.content
      : Array.isArray(payload)
      ? payload
      : [];

    for (const k of content) {
      const id = k?.id;
      if (!id) continue;

      if (need.has(id)) {
        map.set(id, {
          id,
          fullName: (k?.fullName || k?.name || k?.displayName || "").trim(),
          email: (k?.email || "").trim(),
          phone: (k?.phone || k?.phoneNumber || "").trim(),
        });
        need.delete(id);
      }
    }

    const totalPages =
      payload?.totalPages ?? payload?.data?.totalPages ?? undefined;
    const last = payload?.last ?? payload?.data?.last ?? undefined;

    if (last === true) break;
    if (typeof totalPages === "number" && page >= totalPages - 1) break;
    if (!content.length) break;

    page += 1;
  }

  return map;
}

// =====================
// API: REGISTER SCHEDULE
// =====================
const API_ADD_REGISTER_SCHEDULE =
  API_PATHS?.SCHEDULER_ADMIN?.adminSchedule ||
  "/v1/availabilities/admin/schedule";

async function adminAddRegisterSchedule(payload, { signal } = {}) {
  const res = await post({
    url: API_ADD_REGISTER_SCHEDULE,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

// =====================
// API: BOOKING DETAIL BY workTimeId
// =====================
async function adminGetBookingDetailByWorkTimeId(workTimeId, { signal } = {}) {
  if (!workTimeId) throw new Error("workTimeId is required");

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

  const timelineKolIds = useMemo(() => {
    const s = new Set();
    for (const r of timelineList) {
      const id = pickKolId(r);
      if (id) s.add(id);
    }
    return Array.from(s);
  }, [timelineList]);

  const timelineKolMapQuery = useQuery({
    queryKey: ["admin-kol-map-by-ids", "timeline", timelineKolIds.join("|")],
    queryFn: ({ signal }) => buildKolMapByIds(timelineKolIds, { signal }),
    enabled: activeTab === "registered" && timelineKolIds.length > 0,
    staleTime: 60_000,
  });

  const timelineKolMap = timelineKolMapQuery.data || new Map();

  const filteredTimelineRows = useMemo(() => {
    const kw = scheduleKeyword.trim().toLowerCase();
    if (!kw) return timelineList;

    return timelineList.filter((r) => {
      const info = timelineKolMap.get(pickKolId(r));
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
        info?.fullName,
        info?.email,
        info?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(kw);
    });
  }, [timelineList, scheduleKeyword, timelineKolMap]);

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
          const info = timelineKolMap.get(pickKolId(r));
          const name = (info?.fullName || "").trim();
          const email = (info?.email || "").trim();
          const phone = (info?.phone || "").trim();
          const sub = email || phone;

          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name || ""}</div>
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
    [timelineKolMap]
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

  const cancelKolIds = useMemo(() => {
    const s = new Set();
    for (const r of cancelList) {
      const id = pickKolId(r);
      if (id) s.add(id);
    }
    return Array.from(s);
  }, [cancelList]);

  const cancelKolMapQuery = useQuery({
    queryKey: ["admin-kol-map-by-ids", "cancel", cancelKolIds.join("|")],
    queryFn: ({ signal }) => buildKolMapByIds(cancelKolIds, { signal }),
    enabled: activeTab === "cancel" && cancelKolIds.length > 0,
    staleTime: 60_000,
  });

  const cancelKolMap = cancelKolMapQuery.data || new Map();

  const filteredCancelRows = useMemo(() => {
    const kw = cancelKeyword.trim().toLowerCase();
    if (!kw) return cancelList;

    return cancelList.filter((r) => {
      const info = cancelKolMap.get(pickKolId(r));
      const haystack = [
        getCancelRowId(r),
        getCancelWorkTimeId(r),
        r?.reason,
        r?.status,
        r?.adminNote,
        info?.fullName,
        info?.email,
        info?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(kw);
    });
  }, [cancelList, cancelKeyword, cancelKolMap]);

  // ✅ mutation: tạo booking single req
  const createSingleBookingMutation = useMutation({
    mutationFn: async ({ cancelRow }) => {
      const workTimeId = getCancelWorkTimeId(cancelRow);
      if (!workTimeId) throw new Error("Không có workTimeId để tạo lịch.");

      const detail = await adminGetBookingDetailByWorkTimeId(workTimeId);

      const kolId =
        pickKolId(cancelRow) || pickFirst(detail, ["kolId", "kol.id"]);
      const userId = pickFirst(detail, [
        "userId",
        "customerId",
        "user.id",
        "customer.id",
        "bookingRequest.userId",
        "bookingRequest.customerId",
      ]);

      const fullName = pickFirst(detail, [
        "fullName",
        "user.fullName",
        "user.name",
        "customer.fullName",
        "customer.name",
        "bookingRequest.fullName",
      ]);

      const phone = pickFirst(detail, [
        "phone",
        "user.phone",
        "user.phoneNumber",
        "customer.phone",
        "customer.phoneNumber",
        "bookingRequest.phone",
      ]);

      const email = pickFirst(detail, [
        "email",
        "user.email",
        "customer.email",
        "bookingRequest.email",
      ]);

      const startAt = pickFirst(detail, [
        "startAt",
        "workTime.startAt",
        "scheduledWorkTime.startAt",
        "scheduledWorkTimes.0.startAt",
        "workTimes.0.startAt",
      ]);

      const endAt = pickFirst(detail, [
        "endAt",
        "workTime.endAt",
        "scheduledWorkTime.endAt",
        "scheduledWorkTimes.0.endAt",
        "workTimes.0.endAt",
      ]);

      const platform = pickFirst(detail, [
        "platform",
        "bookingRequest.platform",
        "livestreamPlatform",
      ]);

      const description = pickFirst(detail, [
        "description",
        "bookingRequest.description",
        "note",
        "bookingRequest.note",
      ]);

      const location = pickFirst(detail, [
        "location",
        "bookingRequest.location",
        "livestreamAddress",
        "bookingRequest.livestreamAddress",
        "address",
      ]);

      const attachedFiles = asStringArray(
        pickFirst(detail, ["attachedFiles", "files", "attachments"])
      );

      const payload = {
        bookingSingleReqByAdmin: {
          userId,
          kolId,
          fullName,
          phone,
          email,
          startAt,
          endAt,
          platform: safeText(platform),
          description: safeText(description),
          location: safeText(location),
        },
        attachedFiles,
      };

      return adminCreateBookingSingleRequest(payload);
    },
    onSuccess: () => {
      message.success("Đã tạo booking single request (Thêm lịch làm việc).");
      cancelQuery.refetch();
      timelineQuery.refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const addRegisterMutation = useMutation({
    mutationFn: (payload) => adminAddRegisterSchedule(payload),
    onSuccess: () => {
      message.success("Đã gọi API thêm lịch đăng ký.");
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
    viewDetailMutation.isPending;

  // ✅ helper: đảm bảo có chọn dòng tab cancel
  const ensureCancelRowSelected = () => {
    if (activeTab !== "cancel") {
      setActiveTab("cancel");
      setSelectedCancelRow(null);
      message.info(
        "Chuyển sang tab 'Danh sách yêu cầu huỷ đơn' — hãy chọn 1 dòng để thao tác."
      );
      return null;
    }
    if (!selectedCancelRow) {
      message.warning("Bạn chưa chọn dòng nào trong danh sách yêu cầu huỷ.");
      return null;
    }
    const cancelId = getCancelRowId(selectedCancelRow);
    const workTimeId = getCancelWorkTimeId(selectedCancelRow);
    if (!cancelId) {
      message.warning("Dòng đang chọn không có cancelRequestId/id.");
      return null;
    }
    if (!workTimeId) {
      message.warning("Dòng đang chọn không có workTimeId.");
      return null;
    }
    return selectedCancelRow;
  };

  const buildRegisterPayloadFromSelected = () => ({
    cancelRequestId: getCancelRowId(selectedCancelRow),
    kolId: pickKolId(selectedCancelRow),
    workTimeId: getCancelWorkTimeId(selectedCancelRow),
  });

  // ✅ CLICK handlers (nút luôn bấm được)
  const onClickCreateWork = () => {
    const row = ensureCancelRowSelected();
    if (!row) return;

    Modal.confirm({
      title: "Thêm lịch làm việc",
      content: "Tạo booking single request cho dòng đang chọn?",
      okText: "Tạo",
      cancelText: "Hủy",
      onOk: () => createSingleBookingMutation.mutate({ cancelRow: row }),
    });
  };

  const onClickAddRegister = () => {
    const row = ensureCancelRowSelected();
    if (!row) return;

    Modal.confirm({
      title: "Thêm lịch đăng ký",
      content: "Gọi API thêm lịch đăng ký cho dòng đang chọn?",
      okText: "Gọi",
      cancelText: "Hủy",
      onOk: () =>
        addRegisterMutation.mutate(buildRegisterPayloadFromSelected()),
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
          const info = cancelKolMap.get(pickKolId(r));
          const name = (info?.fullName || "").trim();
          const email = (info?.email || "").trim();
          const phone = (info?.phone || "").trim();
          const sub = email || phone;

          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name || ""}</div>
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
    [cancelKolMap, viewDetailMutation.isPending, viewingWorktimeId]
  );

  const isScheduleKeywordMax =
    (scheduleKeyword || "").length >= MAX_KEYWORD_LEN;
  const isCancelKeywordMax = (cancelKeyword || "").length >= MAX_KEYWORD_LEN;

  return (
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
                onClick={onClickCreateWork}
                disabled={isAnyActionLoading}
                loading={createSingleBookingMutation.isPending}
              >
                Thêm lịch làm việc
              </Button>

              <Button
                onClick={onClickAddRegister}
                disabled={isAnyActionLoading}
                loading={addRegisterMutation.isPending}
              >
                Thêm lịch đăng ký
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
                  onClick={() => {
                    timelineQuery.refetch();
                    timelineKolMapQuery.refetch?.();
                  }}
                  loading={
                    timelineQuery.isFetching || timelineKolMapQuery.isFetching
                  }
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
              loading={timelineQuery.isLoading || timelineKolMapQuery.isLoading}
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
                  onClick={() => {
                    cancelQuery.refetch();
                    cancelKolMapQuery.refetch?.();
                  }}
                  disabled={isAnyActionLoading}
                  loading={
                    cancelQuery.isFetching || cancelKolMapQuery.isFetching
                  }
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
              loading={cancelQuery.isLoading || cancelKolMapQuery.isLoading}
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
      </Space>
    </Card>
  );
}
