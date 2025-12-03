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
  Popconfirm,
  message,
} from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { get, post } from "../../../../config/axios-config";
import { API_PATHS } from "../../../../constants/apiPath"; // ✅ chỉnh path nếu khác

const { Title, Text } = Typography;

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

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
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

/** ✅ GET: danh sách yêu cầu huỷ */
async function adminGetAllCancelRequests({ signal } = {}) {
  const url =
    API_PATHS?.CANCEL_ADMIN?.getAll || "/v1/requests/admin/cancel/all";

  const res = await get({
    url,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}

/** ✅ GET: danh sách KOL (phân trang) */
async function adminGetKolsPage({ page = 0, size = 200, signal } = {}) {
  const base = API_PATHS?.MANAGEMENT_USER?.managementKOL || "/v1/admin/kol/all";
  const res = await get({
    url: `${base}?page=${page}&size=${size}`,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

/** ✅ build map tên KOL theo các kolId cần dùng (ẩn ID trên UI) */
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

/**
 * ✅ 2 API “Thêm lịch …” (bạn chỉnh lại đúng BE nếu khác)
 * - Thêm lịch làm việc: WORKTIME_ADMIN.create
 * - Thêm lịch đăng ký: SCHEDULER_ADMIN.adminSchedule (nếu BE bạn là POST)
 */
const API_ADD_WORKTIME =
  API_PATHS?.WORKTIME_ADMIN?.create ||
  "/v1/availabilities/admin/worktime/create";

const API_ADD_REGISTER_SCHEDULE =
  API_PATHS?.SCHEDULER_ADMIN?.adminSchedule ||
  "/v1/availabilities/admin/schedule";

async function adminAddWorktime(payload, { signal } = {}) {
  const res = await post({
    url: API_ADD_WORKTIME,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

async function adminAddRegisterSchedule(payload, { signal } = {}) {
  const res = await post({
    url: API_ADD_REGISTER_SCHEDULE,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

/** ✅ GET: xem chi tiết booking theo workTimeId */
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

export default function ManagementKolWorkSchedule() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewingWorktimeId, setViewingWorktimeId] = useState(null);

  const cancelQuery = useQuery({
    queryKey: ["admin-cancel-requests"],
    queryFn: ({ signal }) => adminGetAllCancelRequests({ signal }),
    staleTime: 15_000,
  });

  const cancelList = useMemo(
    () => normalizeList(cancelQuery.data),
    [cancelQuery.data]
  );

  const kolIdsInCancel = useMemo(() => {
    const s = new Set();
    for (const r of cancelList) if (r?.kolId) s.add(r.kolId);
    return Array.from(s);
  }, [cancelList]);

  const kolMapQuery = useQuery({
    queryKey: ["admin-kol-map-by-ids", kolIdsInCancel.join("|")],
    queryFn: ({ signal }) => buildKolMapByIds(kolIdsInCancel, { signal }),
    enabled: kolIdsInCancel.length > 0,
    staleTime: 60_000,
  });

  const kolMap = kolMapQuery.data || new Map();

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return cancelList;

    return cancelList.filter((r) => {
      const info = kolMap.get(r?.kolId);
      const haystack = [
        r?.id,
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
  }, [cancelList, keyword, kolMap]);

  const addWorktimeMutation = useMutation({
    mutationFn: (payload) => adminAddWorktime(payload),
    onSuccess: () => {
      message.success("Đã gọi API thêm lịch làm việc.");
      cancelQuery.refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const addRegisterMutation = useMutation({
    mutationFn: (payload) => adminAddRegisterSchedule(payload),
    onSuccess: () => {
      message.success("Đã gọi API thêm lịch đăng ký.");
      cancelQuery.refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const viewDetailMutation = useMutation({
    mutationFn: ({ workTimeId }) =>
      adminGetBookingDetailByWorkTimeId(workTimeId),
    onSuccess: (data) => {
      // ✅ cố gắng lấy bookingRequestId từ response
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
    addWorktimeMutation.isPending ||
    addRegisterMutation.isPending ||
    viewDetailMutation.isPending;

  const canAction = !!selectedRow?.id;

  const buildPayloadFromSelected = () => ({
    cancelRequestId: selectedRow?.id,
    kolId: selectedRow?.kolId,
    workTimeId: selectedRow?.workTimeId,
  });

  const columns = useMemo(
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
          const info = kolMap.get(r?.kolId);
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
          const loadingThisRow =
            viewDetailMutation.isPending &&
            viewingWorktimeId &&
            viewingWorktimeId === record?.workTimeId;

          return (
            <div className="w-full flex justify-center">
              <Button
                onClick={(e) => {
                  e.stopPropagation();

                  const workTimeId = record?.workTimeId;
                  if (!workTimeId) {
                    message.error("Không có workTimeId để xem chi tiết.");
                    return;
                  }

                  setViewingWorktimeId(workTimeId);
                  viewDetailMutation.mutate({ workTimeId });
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
    [kolMap, viewDetailMutation.isPending, viewingWorktimeId]
  );

  return (
    <Card style={{ borderRadius: 12 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Danh sách yêu cầu huỷ đơn
          </Title>
        </div>

        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Tìm theo tên KOL / mã yêu cầu / lý do / trạng thái..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 520, maxWidth: "100%" }}
              allowClear
            />
            <Button
              onClick={() => {
                cancelQuery.refetch();
                kolMapQuery.refetch?.();
              }}
              disabled={isAnyActionLoading}
              loading={cancelQuery.isFetching || kolMapQuery.isFetching}
            >
              Làm mới
            </Button>
          </Space>

          <Space wrap>
            <Popconfirm
              title="Gọi API thêm lịch làm việc cho dòng đang chọn?"
              okText="Gọi"
              cancelText="Hủy"
              onConfirm={() =>
                addWorktimeMutation.mutate(buildPayloadFromSelected())
              }
              disabled={!canAction || isAnyActionLoading}
            >
              <Button
                type="primary"
                disabled={!canAction || isAnyActionLoading}
                loading={addWorktimeMutation.isPending}
              >
                Thêm lịch làm việc
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Gọi API thêm lịch đăng ký cho dòng đang chọn?"
              okText="Gọi"
              cancelText="Hủy"
              onConfirm={() =>
                addRegisterMutation.mutate(buildPayloadFromSelected())
              }
              disabled={!canAction || isAnyActionLoading}
            >
              <Button
                disabled={!canAction || isAnyActionLoading}
                loading={addRegisterMutation.isPending}
              >
                Thêm lịch đăng ký
              </Button>
            </Popconfirm>
          </Space>
        </Space>

        <Table
          rowKey={(r) => r?.id}
          columns={columns}
          dataSource={rows}
          loading={cancelQuery.isLoading || kolMapQuery.isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => setSelectedRow(record),
          })}
          rowClassName={(record) =>
            record?.id && record.id === selectedRow?.id ? "bg-slate-50" : ""
          }
        />
      </Space>
    </Card>
  );
}
