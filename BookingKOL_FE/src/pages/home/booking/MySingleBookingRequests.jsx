import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { CalendarRange, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { useGetMySingleBookingRequests } from "../../../hook/user/booking/useGetMySingleBookingRequests";

const { RangePicker } = DatePicker;

const BOOKING_STATUS_OPTIONS = [
  { label: "Cho xu ly", value: "PENDING" },
  { label: "Dang dam phan", value: "NEGOTIATING" },
  { label: "Da chap nhan", value: "ACCEPTED" },
  { label: "Da xac nhan", value: "CONFIRMED" },
  { label: "Dang thuc hien", value: "IN_PROGRESS" },
  { label: "Da giao", value: "DELIVERED" },
  { label: "Hoan thanh", value: "COMPLETED" },
  { label: "Dang tranh chap", value: "DISPUTED" },
  { label: "Da tu choi", value: "REJECTED" },
  { label: "Da huy", value: "CANCELLED" },
  { label: "Da ky hop dong", value: "CONTRACT_SIGNED" },
  { label: "Ban nhap", value: "DRAFT" },
  { label: "Dang yeu cau", value: "REQUESTED" },
  { label: "Het han", value: "EXPIRED" },
];

const STATUS_TAG_COLOR = {
  PENDING: "processing",
  NEGOTIATING: "cyan",
  ACCEPTED: "success",
  CONFIRMED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  REJECTED: "error",
  CANCELLED: "warning",
  CONTRACT_SIGNED: "purple",
  DRAFT: "default",
  REQUESTED: "processing",
  EXPIRED: "volcano",
};

const PAYMENT_STATUS_OPTIONS = [
  { label: "Da thanh toan", value: "PAID" },
  { label: "Cho thanh toan", value: "PENDING" },
  { label: "Dang xu ly", value: "PROCESSING" },
  { label: "Hoan tat", value: "COMPLETED" },
  { label: "That bai", value: "FAILED" },
  { label: "Het han", value: "EXPIRED" },
  { label: "Da huy", value: "CANCELLED" },
  { label: "Da hoan tien", value: "REFUNDED" },
];

const PAYMENT_STATUS_COLOR = {
  PAID: "success",
  PENDING: "processing",
  PROCESSING: "processing",
  COMPLETED: "success",
  FAILED: "error",
  EXPIRED: "volcano",
  CANCELLED: "warning",
  REFUNDED: "purple",
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) {
    return "--";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime ?? null;
  const end = record?.endAt ?? record?.endTime ?? null;

  if (!start && !end) {
    return "--";
  }

  const startLabel = start ? formatDateTime(start) : null;
  const endLabel = end ? formatDateTime(end) : null;

  if (startLabel && endLabel) {
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
  }

  return startLabel ?? endLabel ?? "--";
};

const getPrimaryContract = (record) => {
  if (!record?.contracts || !Array.isArray(record.contracts)) {
    return null;
  }

  return record.contracts.find(Boolean) ?? null;
};

const getPrimaryPayment = (record) => {
  const contract = getPrimaryContract(record);
  return contract?.paymentDTO ?? null;
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (Number.isNaN(numeric)) {
    return "--";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const deriveRowKey = (record) => {
  if (!record || typeof record !== "object") {
    return `booking-${Math.random().toString(36).slice(2, 10)}`;
  }

  const candidates = [
    record.id,
    record.bookingRequestId,
    record.requestId,
    record.code,
  ]
    .map((value) =>
      value === undefined || value === null ? undefined : String(value)
    )
    .filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const fallback = [
    record.userId,
    record.kolId,
    record.createdAt,
    record.startAt,
    record.endAt,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value))
    .join("-");

  return fallback || `booking-${Math.random().toString(36).slice(2, 10)}`;
};

const MySingleBookingRequests = () => {
  const [form] = Form.useForm();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({
    status: undefined,
    startAt: undefined,
    endAt: undefined,
    createdAtFrom: undefined,
    createdAtTo: undefined,
  });

  const {
    isLoadingMyBookingRequests,
    isFetchingMyBookingRequests,
    myBookingRequestsResponse,
    refetchMyBookingRequests,
  } = useGetMySingleBookingRequests({
    page,
    size,
    ...filters,
  });

  const rawData = myBookingRequestsResponse?.data;
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

  const handleFilter = (values) => {
    const { status, executionRange, createdRange } = values ?? {};

    const [executionStart, executionEnd] = Array.isArray(executionRange)
      ? executionRange
      : [];
    const [createdStart, createdEnd] = Array.isArray(createdRange)
      ? createdRange
      : [];

    setFilters({
      status: status ?? undefined,
      startAt: executionStart ? executionStart.toISOString() : undefined,
      endAt: executionEnd ? executionEnd.toISOString() : undefined,
      createdAtFrom: createdStart
        ? createdStart.startOf("day").format("YYYY-MM-DD")
        : undefined,
      createdAtTo: createdEnd
        ? createdEnd.endOf("day").format("YYYY-MM-DD")
        : undefined,
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      status: undefined,
      startAt: undefined,
      endAt: undefined,
      createdAtFrom: undefined,
      createdAtTo: undefined,
    });
    setPage(0);
  };

  const columns = useMemo(
    () => [
      {
        title: "Ma don",
        dataIndex: "id",
        key: "id",
        width: 230,
        ellipsis: true,
        render: (value) => value ?? "--",
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (status) => {
          const normalized = status?.toUpperCase();
          const displayLabel =
            BOOKING_STATUS_OPTIONS.find((item) => item.value === normalized)
              ?.label ?? normalized ?? "--";
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>
              {displayLabel}
            </Tag>
          );
        },
      },
      {
        title: "Loai booking",
        dataIndex: "bookingType",
        key: "bookingType",
        width: 140,
        render: (type) => type ?? "--",
      },
      {
        title: "Thoi gian thuc hien",
        key: "executionTime",
        width: 260,
        render: (_, record) => composeExecutionTime(record),
      },
      {
        title: "Dia diem",
        dataIndex: "location",
        key: "location",
        width: 200,
        ellipsis: true,
        render: (value) => value || "--",
      },
      {
        title: "Trang thai thanh toan",
        key: "paymentStatus",
        width: 190,
        render: (_, record) => {
          const payment = getPrimaryPayment(record);
          const normalized = payment?.status
            ? String(payment.status).toUpperCase()
            : null;

          if (!normalized) {
            return "--";
          }

          const displayLabel =
            PAYMENT_STATUS_OPTIONS.find((item) => item.value === normalized)
              ?.label ?? normalized;

          return (
            <Tag color={PAYMENT_STATUS_COLOR[normalized] ?? "default"}>
              {displayLabel}
            </Tag>
          );
        },
      },
      {
        title: "Tong tien",
        key: "totalAmount",
        width: 160,
        render: (_, record) => {
          const payment = getPrimaryPayment(record);
          const amount =
            payment?.totalAmount ??
            payment?.paidAmount ??
            record?.totalAmount ??
            record?.budget ??
            null;

          return formatCurrency(amount);
        },
      },
      {
        title: "Ngay tao",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 200,
        render: (createdAt) => formatDateTime(createdAt),
      },
      {
        title: "Ghi chu",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (value) => (value && value.trim()) || "--",
      },
    ],
    []
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
          <CalendarRange className="text-gray-500" size={20} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold uppercase">
            Don booking cua toi
          </h1>
          <p className="text-[14px] text-gray-600">
            Theo doi tat ca don booking KOL ma ban da tao va trang thai xu ly.
          </p>
        </div>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Form.Item label="Trang thai booking" name="status">
            <Select
              allowClear
              placeholder="Chon trang thai"
              options={BOOKING_STATUS_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="Thoi gian thuc hien" name="executionRange">
            <RangePicker
              className="w-full"
              showTime
              allowEmpty={[true, true]}
              placeholder={["Bat dau", "Ket thuc"]}
            />
          </Form.Item>
          <Form.Item label="Thoi gian tao" name="createdRange">
            <RangePicker
              className="w-full"
              format="YYYY-MM-DD"
              allowEmpty={[true, true]}
              placeholder={["Tu ngay", "Den ngay"]}
            />
          </Form.Item>
          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end sm:justify-end">
            <Space size="middle" wrap>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Search size={16} />}
              >
                Tim kiem
              </Button>
              <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
                Dat lai
              </Button>
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={() => refetchMyBookingRequests()}
                loading={isFetchingMyBookingRequests}
              >
                Lam moi
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card bordered={false} className="flex-1 shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingMyBookingRequests}
          pagination={false}
          rowKey={deriveRowKey}
          scroll={{ x: 1080 }}
          locale={{
            emptyText: "Khong co du lieu",
          }}
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={page + 1}
            pageSize={size}
            total={totalElements}
            pageSizeOptions={["10", "20", "50"]}
            showSizeChanger
            onChange={(nextPage, nextSize) => {
              const isSizeChanged = nextSize !== size;
              setSize(nextSize);
              setPage(isSizeChanged ? 0 : nextPage - 1);
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default MySingleBookingRequests;
