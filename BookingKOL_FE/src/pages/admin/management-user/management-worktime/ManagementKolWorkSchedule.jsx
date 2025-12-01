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

// ✅ chỉnh đúng axios-config của bạn
import { get, post } from "../../../../config/axios-config";

const { Title, Text } = Typography;

const STATUS_COLOR = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  CANCELED: "default",
};

const safeText = (v) =>
  v === null || v === undefined || v === "" ? "--" : String(v);

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

/** ✅ GET: danh sách hủy đơn */
async function adminGetAllCancelRequests({ signal } = {}) {
  const res = await get({
    url: "/api/v1/requests/admin/cancel/all",
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

/**
 * ✅ TODO: THAY 2 API NÀY THEO BACKEND CỦA BẠN
 * Ví dụ:
 * - POST /api/v1/admin/kols/work-schedule/create
 * - POST /api/v1/admin/kols/register-schedule/create
 */
const API_CREATE_WORK_SCHEDULE = "/api/v1/ADMIN_REPLACE/work-schedule/create";
const API_CREATE_REGISTER_SCHEDULE =
  "/api/v1/ADMIN_REPLACE/register-schedule/create";

/** gọi API tạo lịch làm việc */
async function adminCreateWorkSchedule(payload, { signal } = {}) {
  const res = await post({
    url: API_CREATE_WORK_SCHEDULE,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

/** gọi API tạo lịch đăng ký */
async function adminCreateRegisterSchedule(payload, { signal } = {}) {
  const res = await post({
    url: API_CREATE_REGISTER_SCHEDULE,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

function extractErrMsg(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Có lỗi xảy ra"
  );
}

export default function ManagementKolWorkSchedule() {
  const [keyword, setKeyword] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // antd cần keys
  const [selectedRow, setSelectedRow] = useState(null); // lưu record đang chọn

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-cancel-requests"],
    queryFn: ({ signal }) => adminGetAllCancelRequests({ signal }),
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const list = normalizeList(data);
    const kw = keyword.trim().toLowerCase();
    if (!kw) return list;

    return list.filter((r) => {
      const haystack = [
        r?.id,
        r?.kolId,
        r?.workTimeId,
        r?.reason,
        r?.status,
        r?.adminNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [data, keyword]);

  const createWorkScheduleMutation = useMutation({
    mutationFn: (payload) => adminCreateWorkSchedule(payload),
    onSuccess: () => {
      message.success("Đã tạo lịch làm việc.");
      refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const createRegisterScheduleMutation = useMutation({
    mutationFn: (payload) => adminCreateRegisterSchedule(payload),
    onSuccess: () => {
      message.success("Đã tạo lịch đăng ký.");
      refetch();
    },
    onError: (err) => message.error(extractErrMsg(err)),
  });

  const isAnyActionLoading =
    createWorkScheduleMutation.isPending ||
    createRegisterScheduleMutation.isPending;

  const canAction = !!selectedRow?.id;

  const buildPayloadFromSelected = () => {
    // ✅ payload chung (bạn có thể đổi theo BE cần gì)
    return {
      cancelRequestId: selectedRow?.id,
      kolId: selectedRow?.kolId,
      workTimeId: selectedRow?.workTimeId,
    };
  };

  const columns = useMemo(
    () => [
      {
        title: "STT",
        key: "__idx",
        width: 70,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "KOL ID",
        dataIndex: "kolId",
        key: "kolId",
        width: 260,
        render: (v) => safeText(v),
      },
      {
        title: "WorkTime ID",
        dataIndex: "workTimeId",
        key: "workTimeId",
        width: 260,
        render: (v) => safeText(v),
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
        width: 140,
        render: (v) => (
          <Tag color={STATUS_COLOR[v] || "default"} style={{ marginRight: 0 }}>
            {safeText(v)}
          </Tag>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      },
      {
        title: "Ngày duyệt",
        dataIndex: "approvedAt",
        key: "approvedAt",
        width: 180,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      },
      {
        title: "Ghi chú admin",
        dataIndex: "adminNote",
        key: "adminNote",
        render: (v) => <Text ellipsis={{ tooltip: v }}>{safeText(v)}</Text>,
      },
    ],
    []
  );

  const rowSelection = {
    type: "radio",
    selectedRowKeys,
    onChange: (keys, selectedRows) => {
      setSelectedRowKeys(keys);
      setSelectedRow(selectedRows?.[0] ?? null);
    },
  };

  return (
    <Card style={{ borderRadius: 12 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Danh sách yêu cầu huỷ đơn
          </Title>
          <Text type="secondary">API: /api/v1/requests/admin/cancel/all</Text>
        </div>

        {/* ✅ TOOLBAR TRÊN CÙNG */}
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Tìm theo id / kolId / workTimeId / reason / status..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 520, maxWidth: "100%" }}
              allowClear
            />

            <Button onClick={() => refetch()} disabled={isAnyActionLoading}>
              Làm mới
            </Button>
          </Space>

          <Space wrap>
            <Popconfirm
              title="Tạo lịch làm việc từ yêu cầu huỷ đơn đang chọn?"
              okText="Tạo"
              cancelText="Hủy"
              onConfirm={() =>
                createWorkScheduleMutation.mutate(buildPayloadFromSelected())
              }
              disabled={!canAction || isAnyActionLoading}
            >
              <Button
                type="primary"
                disabled={!canAction || isAnyActionLoading}
                loading={createWorkScheduleMutation.isPending}
              >
                Thêm lịch làm việc
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Tạo lịch đăng ký từ yêu cầu huỷ đơn đang chọn?"
              okText="Tạo"
              cancelText="Hủy"
              onConfirm={() =>
                createRegisterScheduleMutation.mutate(
                  buildPayloadFromSelected()
                )
              }
              disabled={!canAction || isAnyActionLoading}
            >
              <Button
                disabled={!canAction || isAnyActionLoading}
                loading={createRegisterScheduleMutation.isPending}
              >
                Thêm lịch đăng ký
              </Button>
            </Popconfirm>
          </Space>
        </Space>

        <Table
          rowKey={(r) => r?.id}
          rowSelection={rowSelection}
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedRowKeys([record?.id]);
              setSelectedRow(record);
            },
          })}
        />
      </Space>
    </Card>
  );
}
