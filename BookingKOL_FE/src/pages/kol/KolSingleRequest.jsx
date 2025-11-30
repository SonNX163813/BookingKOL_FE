// src/pages/kol/KolSingleRequest.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  Button,
  Card,
  Pagination,
  Table,
  Tag,
  Popconfirm,
  message,
} from "antd";
import {
  CalendarRange,
  RefreshCcw,
  BarChart3,
  FileText,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMySingleBookingRequests } from "../../services/kol/KolAPI";

/* ===== Việt hoá dayjs ===== */
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
});

/* ===== Nhãn trạng thái ===== */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];
const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
  PAID: "success",
  REFUNDED: "purple",
};

/* ===== Booking Type ===== */
const BOOKING_TYPE_LABEL = {
  SINGLE: "Book theo giờ",
  CAMPAIGN: "Book theo chiến dịch",
};
const BOOKING_TYPE_COLOR = {
  SINGLE: "geekblue",
  CAMPAIGN: "purple",
};

const normalize = (v) => (v == null ? "" : String(v).trim());
const toUpper = (v) => normalize(v).toUpperCase();
const getStatus = (r) =>
  toUpper(r?.status ?? r?.bookingStatus ?? r?.state ?? r?.requestStatus ?? "");

const getBookingType = (r) =>
  toUpper(
    r?.bookingType ??
      r?.type ??
      r?.requestType ??
      r?.bookingRequestType ??
      r?.booking_request_type ??
      ""
  );

/* Lấy requestId dùng chung */
const getRequestId = (record) =>
  record?.id ?? record?.requestId ?? record?.bookingRequestId ?? null;

/* Helpers */
const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const composeExecutionTime = (rec) => {
  const start = rec?.startAt ?? rec?.startTime ?? rec?.executionStart ?? null;
  const end = rec?.endAt ?? rec?.endTime ?? rec?.executionEnd ?? null;
  if (!start && !end) return "--";
  const s = formatDateTime(start);
  const e = formatDateTime(end);
  if (!start) return e;
  if (!end) return s;

  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} -> ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${s} -> ${e}`;
};

const pickValue = (record, keys, fallback = "--") => {
  for (const k of keys) {
    const v = record?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

export default function KolSingleRequest() {
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  // ❗ Không gửi status: BE không hỗ trợ nhiều status → sẽ rỗng
  const buildParams = useCallback(() => ({ page, size }), [page, size]);

  const {
    data: resp,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["kol-my-single-requests", token, { page, size }],
    queryFn: () => getMySingleBookingRequests({ params: buildParams() }),
    keepPreviousData: true,
    staleTime: 30_000,
    enabled: !!token && !authLoading,
    retry: (failureCount, err) => {
      const code = err?.response?.status || err?.status || err?.appStatus || 0;
      if (code === 401) return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (token && !authLoading) refetch();
  }, [token, authLoading, refetch]);

  // Chuẩn hoá data
  const raw = resp?.data ?? resp ?? {};
  const serverList = Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  const totalElements =
    (typeof raw?.totalElements === "number" && raw.totalElements) ||
    (typeof raw?.total === "number" && raw.total) ||
    0;

  // Ẩn DRAFT/EXPIRED/CANCELLED/REFUNDED ở UI
  const dataSource = useMemo(
    () =>
      serverList.filter(
        (r) =>
          !["DRAFT", "EXPIRED", "CANCELLED", "REFUNDED"].includes(getStatus(r))
      ),
    [serverList]
  );

  // ✅ nhỏ hơn + sát nhau hơn
  const BTN_BASE =
    "!h-8 !px-3 !text-sm !font-semibold !shadow-sm !rounded-full !w-[160px] flex items-center justify-center gap-2";

  const columns = useMemo(
    () => [
      {
        title: "STT",
        key: "stt",
        width: "6%",
        render: (_, __, index) => (
          <div className="font-bold">#{page * size + index + 1}</div>
        ),
      },
      {
        title: "Mã yêu cầu",
        key: "requestNumber",
        width: 170,
        render: (_, record) =>
          pickValue(record, ["requestNumber", "code", "bookingCode", "id"]),
      },
      {
        title: "Loại booking",
        key: "bookingType",
        width: 190,
        render: (_, record) => {
          const type = getBookingType(record);
          const label = BOOKING_TYPE_LABEL[type] ?? (type || "--");
          return (
            <Tag color={BOOKING_TYPE_COLOR[type] ?? "default"}>{label}</Tag>
          );
        },
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 160,
        render: (_, record) => {
          const normalized = getStatus(record);
          const meta =
            BOOKING_STATUS_OPTIONS.find((s) => s.value === normalized) || null;
          const label = meta?.label || normalized || "--";
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>{label}</Tag>
          );
        },
      },
      {
        title: "Thực hiện",
        key: "time",
        width: 260,
        render: (_, record) => composeExecutionTime(record),
      },
      {
        title: "Ngày tạo",
        key: "createdAt",
        dataIndex: "createdAt",
        width: 200,
        render: (createdAt) => formatDateTime(createdAt),
      },
      {
        title: "Thao tác",
        key: "action",
        align: "center",
        width: 220,
        render: (_, record) => {
          const requestId = getRequestId(record);
          const status = getStatus(record);
          const isInProgress = status === "IN_PROGRESS";

          // ✅ theo yêu cầu: chỉ hiện nút hủy khi PAID
          const canCancel = status === "PAID";

          const goDetail = () => {
            if (!requestId) return;
            navigate(`/kol/booking/single-requests/detail/${requestId}`);
          };

          const goCancel = () => {
            if (!requestId) return;
            navigate(
              `/kol/booking/single-requests/detail/${requestId}?cancel=1`
            );
          };

          return (
            <div className="w-full flex flex-col items-center gap-1">
              <Button
                type="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  goDetail();
                }}
                className={`${BTN_BASE} !border-none !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700`}
              >
                <FileText size={16} />
                Xem chi tiết
              </Button>

              {isInProgress && requestId && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/kol/booking/single-requests/detail/${requestId}?metrics=1`
                    );
                  }}
                  className={`${BTN_BASE} !border-none !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-700 hover:!to-teal-700`}
                >
                  <BarChart3 size={16} />
                  Metrics
                </Button>
              )}

              {canCancel && requestId && (
                <Popconfirm
                  title="Bạn chắc chắn muốn hủy đơn booking này?"
                  okText="Hủy đơn"
                  cancelText="Không"
                  onConfirm={(e) => {
                    e?.stopPropagation?.();
                    message.success("Mở màn hình hủy đơn...");
                    goCancel();
                  }}
                  onCancel={(e) => e?.stopPropagation?.()}
                >
                  <Button
                    danger
                    onClick={(e) => e.stopPropagation()}
                    className={`${BTN_BASE} !bg-white hover:!bg-red-50 !border !border-red-300 hover:!border-red-500 !text-red-600 hover:!text-red-700`}
                  >
                    <XCircle size={16} />
                    Hủy đơn booking
                  </Button>
                </Popconfirm>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, page, size]
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      <div className="flex gap-2 items-center">
        <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
          <CalendarRange className="text-gray-500" size={20} />
        </div>

        <section>
          <h1 className="text-[18px] font-bold uppercase">
            Tất cả yêu cầu Booking
          </h1>
          <p className="text-[14px] text-gray-600">
            Danh sách yêu cầu booking.
          </p>
        </section>

        <div className="ml-auto">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <Card bordered={false} className="flex-1 shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          pagination={false}
          rowKey={(r) =>
            getRequestId(r) ??
            r?.requestNumber ??
            r?.code ??
            r?.bookingCode ??
            `${r?.createdAt}-${r?.startAt}-${r?.endAt}`
          }
          scroll={{ x: "auto" }}
          locale={{ emptyText: "Không có booking hợp lệ trên trang này." }}
          onRow={(record) => ({
            onClick: () => {
              const requestId = getRequestId(record);
              if (requestId) {
                navigate(`/kol/booking/single-requests/detail/${requestId}`);
              }
            },
            style: { cursor: "pointer" },
          })}
        />

        <div className="!my-4 py-5">
          <Pagination
            align="center"
            current={page + 1}
            pageSize={size}
            pageSizeOptions={["10", "20", "50", "100"]}
            onChange={(pageNumber, sizeNumber) => {
              setPage(pageNumber - 1);
              setSize(sizeNumber);
            }}
            total={totalElements}
            showSizeChanger
          />
        </div>
      </Card>
    </div>
  );
}
