// src/pages/admin/booking/AdminKolBookingById.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import {
  CalendarRange,
  Eye,
  RefreshCcw,
  RotateCcw,
  Search,
  ArrowLeft,
} from "lucide-react";
import { adminGetBookingRequestsByKol } from "../../../../services/admin/AdminBookingAPI";
import { getKolProfileById } from "../../../../services/kol/KolAPI";

const { RangePicker } = DatePicker;

/* ===== Việt hoá dayjs NGAY TRONG FILE NÀY (không sửa day.js) ===== */
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  monthsShort: [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ],
});

/* ------------------------- BOOKING STATUS (rút gọn) ------------------------- */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã thanh toán", value: "PAID" }, // ✅ thêm PAID
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

/* ------------------------- PAYMENT STATUS ------------------------- */
const PAYMENT_STATUS_OPTIONS = [
  { label: "Đợi thanh toán", value: "PENDING" },
  { label: "Thanh toán chưa đủ", value: "UNDERPAID" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Thanh toán thừa", value: "OVERPAID" },
  { label: "Đã hết hạn thanh toán", value: "EXPIRED" },
  { label: "Đã hủy thanh toán", value: "CANCELLED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

const PAYMENT_STATUS_COLOR = {
  PENDING: "processing",
  UNDERPAID: "warning",
  PAID: "success",
  OVERPAID: "purple",
  EXPIRED: "volcano",
  CANCELLED: "error",
  REFUNDED: "purple",
};

/* ------------------------- TAG COLORS ------------------------- */
const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
  PAID: "success", // ✅ màu cho PAID
  REFUNDED: "purple",
};

/* ------------------------- HELPERS ------------------------- */
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const composeExecutionTime = (record) => {
  const start =
    record?.startAt ?? record?.startTime ?? record?.executionStart ?? null;
  const end = record?.endAt ?? record?.endTime ?? record?.executionEnd ?? null;

  if (!start && !end) return "--";

  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);

  if (!start) return endLabel;
  if (!end) return startLabel;

  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  if (sameDay) {
    return `${dayjs(start).format("DD/MM/YYYY HH:mm")} -> ${dayjs(end).format(
      "HH:mm"
    )}`;
  }
  return `${startLabel} -> ${endLabel}`;
};

const composeRowKey = (record) => {
  const candidates = [
    record?.requestNumber,
    record?.id,
    record?.bookingRequestId,
    record?.requestId,
    record?.code,
    record?.bookingCode,
    record?.contractId,
    record?.contractCode,
  ]
    .map((v) => (v === undefined || v === null ? undefined : String(v)))
    .filter(Boolean);
  if (candidates.length) return candidates[0];

  const fallback = [
    record?.kolId,
    record?.brandId,
    record?.userId,
    record?.createdAt,
    record?.startAt,
  ]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v))
    .join("-");
  return fallback || `booking-${Math.random().toString(36).slice(2, 10)}`;
};

const pickValue = (record, keys, fallback = "--") => {
  if (!record) return fallback;
  for (const k of keys) {
    const v = record[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

const getPrimaryContract = (record) => {
  if (!record?.contracts || !Array.isArray(record.contracts)) return null;
  return record.contracts.find(Boolean) ?? null;
};

const getPrimaryPayment = (record) => {
  const contract = getPrimaryContract(record);
  return contract?.paymentDTO ?? null;
};

/* ------------------------- PAGE ------------------------- */
export default function AdminKolBookingById() {
  const { kolId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({
    requestNumber: undefined,
    status: undefined,
    startAt: undefined,
    endAt: undefined,
    createdAtFrom: undefined,
    createdAtTo: undefined,
  });

  // Booking list theo KOL
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: [
      "admin",
      "booking-requests",
      "by-kol",
      kolId,
      page,
      size,
      filters.requestNumber ?? null,
      filters.status ?? null,
      filters.startAt ?? null,
      filters.endAt ?? null,
      filters.createdAtFrom ?? null,
      filters.createdAtTo ?? null,
    ],
    queryFn: () =>
      adminGetBookingRequestsByKol(kolId, {
        page,
        size,
        ...filters,
      }),
    enabled: !!kolId,
    keepPreviousData: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Lấy tên KOL đúng API KolAPI (/v1/kol-profiles/kol-id/{kolId})
  const { data: kolDetail } = useQuery({
    queryKey: ["kol-detail", kolId],
    queryFn: () => getKolProfileById(kolId),
    enabled: !!kolId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const kolName =
    pickValue(kolDetail, ["displayName", "fullName", "name"]) || `#${kolId}`;

  const rawData = data;
  const dataSource = Array.isArray(rawData)
    ? rawData
    : rawData?.content ?? rawData?.items ?? [];

  const explicitTotal =
    typeof rawData?.totalElements === "number"
      ? rawData.totalElements
      : typeof rawData?.total === "number"
      ? rawData.total
      : undefined;

  const inferredTotal =
    page * size +
    dataSource.length +
    (explicitTotal === undefined && dataSource.length === size ? 1 : 0);

  const totalElements =
    explicitTotal ??
    Math.max(
      Array.isArray(rawData) ? rawData.length : dataSource.length,
      inferredTotal
    );

  useEffect(() => {
    if (page > 0 && dataSource.length === 0) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [dataSource.length, page]);

  const handleViewDetail = useCallback(
    (record) => {
      const requestId =
        record?.id || record?.bookingRequestId || record?.requestId;
      if (requestId) {
        navigate(`/admin/management-booking-requests/${requestId}`);
      }
    },
    [navigate]
  );

  const handleFilter = (values) => {
    const { status, executionRange, createdRange, requestNumber } = values;
    const normalizedRN =
      typeof requestNumber === "string" ? requestNumber.trim() : requestNumber;

    setFilters({
      requestNumber:
        normalizedRN && normalizedRN.length > 0 ? normalizedRN : undefined,
      status: status ?? undefined,
      startAt: executionRange?.[0]
        ? executionRange[0].format("YYYY-MM-DD")
        : undefined,
      endAt: executionRange?.[1]
        ? executionRange[1].format("YYYY-MM-DD")
        : undefined,
      createdAtFrom: createdRange?.[0]
        ? createdRange[0].format("YYYY-MM-DD")
        : undefined,
      createdAtTo: createdRange?.[1]
        ? createdRange[1].format("YYYY-MM-DD")
        : undefined,
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      requestNumber: undefined,
      status: undefined,
      startAt: undefined,
      endAt: undefined,
      createdAtFrom: undefined,
      createdAtTo: undefined,
    });
    setPage(0);
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/admin/management-kol");
  };

  const columns = useMemo(
    () => [
      {
        title: "Mã hợp đồng",
        key: "contractNumber",
        width: 180,
        render: (_, record) => {
          const c = getPrimaryContract(record);
          return c?.contractNumber ?? pickValue(record, ["contractNumber"]);
        },
      },
      {
        title: "Mã yêu cầu",
        key: "requestNumber",
        width: 180,
        render: (_, record) => pickValue(record, ["requestNumber"]),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 150,
        dataIndex: "status",
        render: (status) => {
          const normalized = status?.toUpperCase();
          const display =
            BOOKING_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ||
            normalized ||
            "--";
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>
              {display}
            </Tag>
          );
        },
      },
      {
        title: "Thanh toán",
        key: "paymentStatus",
        width: 160,
        render: (_, record) => {
          const payment = getPrimaryPayment(record);
          const normalized = payment?.status
            ? String(payment.status).toUpperCase()
            : null;
          if (!normalized) return "--";
          const display =
            PAYMENT_STATUS_OPTIONS.find((p) => p.value === normalized)?.label ||
            normalized;
          return (
            <Tag color={PAYMENT_STATUS_COLOR[normalized] ?? "default"}>
              {display}
            </Tag>
          );
        },
      },
      {
        title: "Thời gian thực hiện",
        key: "execution",
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
        title: "Tổng chi phí",
        key: "budget",
        width: 180,
        render: (_, record) => {
          const inlineAmount = pickValue(
            record,
            ["totalAmount", "budget", "price", "expectedBudget", "amount"],
            null
          );
          const payment = getPrimaryPayment(record);
          const rawAmount =
            inlineAmount ??
            payment?.totalAmount ??
            payment?.paidAmount ??
            payment?.amount ??
            null;

          if (rawAmount == null || rawAmount === "") return "--";

          const numeric =
            typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
          return Number.isNaN(numeric) ? "--" : formatCurrency(numeric);
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <Button
            onClick={() => handleViewDetail(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
        ),
      },
    ],
    [handleViewDetail]
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      {/* Header + Back */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleBack}
            className="!h-10 !px-3 !bg-blue-600 !text-white hover:!bg-blue-700 !border-none"
          >
            <ArrowLeft size={18} className="mr-1" />
            Quay lại
          </Button>

          <div className="flex items-center gap-2">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold">
                Lịch sử booking của <span className="uppercase">{kolName}</span>
              </h1>
              <p className="text-[12px] text-gray-500">KOL ID: {kolId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <Card bordered={false} className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Form.Item label="Mã yêu cầu" name="requestNumber">
            <Input allowClear placeholder="Nhập mã yêu cầu" maxLength={64} />
          </Form.Item>

          <Form.Item label="Trạng thái booking" name="status">
            <Select
              allowClear
              placeholder="Chọn trạng thái"
              options={BOOKING_STATUS_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="Thời gian thực hiện" name="executionRange">
            <ConfigProvider locale={viVN}>
              <RangePicker
                className="w-full"
                format="DD MMM YYYY" // Hiển thị tháng Tn (VD: T11)
                allowEmpty={[true, true]}
              />
            </ConfigProvider>
          </Form.Item>

          <Form.Item label="Thời gian tạo" name="createdRange">
            <ConfigProvider locale={viVN}>
              <RangePicker
                className="w-full"
                format="DD MMM YYYY"
                allowEmpty={[true, true]}
              />
            </ConfigProvider>
          </Form.Item>

          <div>
            <Space size="middle" wrap>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Search size={16} />}
              >
                Tìm kiếm
              </Button>
              <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={() => refetch()}
                loading={isFetching}
              >
                Làm mới
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card bordered={false} className="flex-1 shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isPending}
          pagination={false}
          rowKey={composeRowKey}
          scroll={{ x: "auto" }}
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={page + 1}
            pageSize={size}
            total={totalElements}
            pageSizeOptions={["10", "20", "50", "100"]}
            showSizeChanger
            onChange={(nextPage, nextSize) => {
              const sizeChanged = nextSize !== size;
              setSize(nextSize);
              setPage(sizeChanged ? 0 : nextPage - 1);
            }}
          />
        </div>
      </Card>
    </div>
  );
}
