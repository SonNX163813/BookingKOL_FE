import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
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
  Typography,
} from "antd";
import {
  CalendarRange,
  Eye,
  RefreshCcw,
  RotateCcw,
  Search,
} from "lucide-react";
import { useGetMySingleBookingRequests } from "../../../hook/user/booking/useGetMySingleBookingRequests";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* ------------------- CONSTANTS ------------------- */

const BOOKING_STATUS_OPTIONS = [
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đang yêu cầu", value: "REQUESTED" },
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đang đàm phán", value: "NEGOTIATING" },
  { label: "Đã chấp nhận", value: "ACCEPTED" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã giao", value: "DELIVERED" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đang tranh chấp", value: "DISPUTED" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã ký hợp đồng", value: "CONTRACT_SIGNED" },
  { label: "Hết hạn", value: "EXPIRED" },
];

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
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
  EXPIRED: "volcano",
};

const PAYMENT_STATUS_OPTIONS = [
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Chờ thanh toán", value: "PENDING" },
  { label: "Đang xử lý", value: "PROCESSING" },
  { label: "Hoàn tất", value: "COMPLETED" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
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

/* ------------------- HELPERS ------------------- */

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") =>
  value ? (dayjs(value).isValid() ? dayjs(value).format(pattern) : "--") : "--";

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;
  if (!start && !end) return "--";

  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(end, "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatCurrency = (value) =>
  value
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value)
    : "--";

const deriveRowKey = (record) =>
  record?.id ??
  record?.code ??
  `booking-${Math.random().toString(36).slice(2, 10)}`;

const getPrimaryContract = (r) => r?.contracts?.find(Boolean) ?? null;
const getPrimaryPayment = (r) => getPrimaryContract(r)?.paymentDTO ?? null;

/* ------------------- COMPONENT ------------------- */

const MySingleBookingRequests = () => {
  const [form] = Form.useForm();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

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
  const totalElements =
    rawData?.totalElements ?? rawData?.total ?? dataSource?.length ?? 0;

  const handleFilter = (values) => {
    const { status, executionRange, createdRange } = values ?? {};
    setFilters({
      status,
      startAt: executionRange?.[0]?.toISOString(),
      endAt: executionRange?.[1]?.toISOString(),
      createdAtFrom: createdRange?.[0]?.startOf("day").format("YYYY-MM-DD"),
      createdAtTo: createdRange?.[1]?.endOf("day").format("YYYY-MM-DD"),
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPage(0);
  };

  const handleViewDetail = useCallback(
    (record) => {
      const requestId = record?.id;
      if (!requestId) {
        return;
      }

      navigate(`/don-booking-kol/${requestId}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      {
        title: "Mã đơn",
        key: "contractId",
        width: 260,
        render: (_, record) => {
          const contractId = record?.contracts?.[0]?.id;
          return contractId ?? "--";
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (v) => {
          const normalized = v?.toUpperCase();
          const label =
            BOOKING_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ??
            normalized;
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>{label}</Tag>
          );
        },
      },
      {
        title: "Thời gian thực hiện",
        key: "executionTime",
        width: 250,
        render: (_, r) => composeExecutionTime(r),
      },
      {
        title: "Địa điểm",
        dataIndex: "location",
        key: "location",
        width: 200,
        render: (v) => v || "--",
      },
      {
        title: "Thanh toán",
        key: "paymentStatus",
        width: 160,
        render: (_, r) => {
          const payment = getPrimaryPayment(r);
          const normalized = payment?.status?.toUpperCase();
          const label =
            PAYMENT_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ??
            normalized ??
            "--";
          return (
            <Tag color={PAYMENT_STATUS_COLOR[normalized] ?? "default"}>
              {label}
            </Tag>
          );
        },
      },
      {
        title: "Tổng tiền",
        key: "totalAmount",
        width: 150,
        render: (_, r) => {
          const payment = getPrimaryPayment(r);
          const amount =
            payment?.totalAmount ??
            payment?.paidAmount ??
            r?.totalAmount ??
            r?.budget ??
            null;
          return formatCurrency(amount);
        },
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => formatDateTime(v),
      },
      {
        title: "Ghi chú",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (v) => v?.trim() || "--",
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            // icon={<Eye size={16} />}
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
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="w-full max-w-[1560px] flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 border-2 border-gray-300 p-2 rounded-md mb-2">
          <CalendarRange className="text-gray-500" size={18} />
          <Text strong className="uppercase text-[15px]">
            Đơn booking của tôi
          </Text>
        </div>
        <p className="text-gray-600 text-sm">
          Theo dõi toàn bộ đơn booking KOL bạn đã tạo và trạng thái xử lý.
        </p>
      </div>

      <Card bordered={false} className="w-full max-w-[1500px] shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Form.Item label="Trạng thái booking" name="status">
            <Select
              placeholder="Chọn trạng thái"
              allowClear
              options={BOOKING_STATUS_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="Thời gian thực hiện" name="executionRange">
            <RangePicker
              showTime
              className="w-full"
              placeholder={["Bắt đầu", "Kết thúc"]}
            />
          </Form.Item>
          <Form.Item label="Ngày tạo" name="createdRange">
            <RangePicker
              className="w-full"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>
          <div className="flex justify-center ">
            <Space>
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
                onClick={() => refetchMyBookingRequests()}
                loading={isFetchingMyBookingRequests}
              >
                Làm mới
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card bordered={false} className="w-full max-w-[1500px] shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingMyBookingRequests}
          pagination={false}
          rowKey={deriveRowKey}
          scroll={{ x: "auto" }}
          locale={{ emptyText: "Không có dữ liệu" }}
        />

        <div className="flex justify-center mt-5">
          <Pagination
            current={page + 1}
            pageSize={size}
            total={totalElements}
            showSizeChanger
            pageSizeOptions={["10", "20", "50"]}
            onChange={(p, s) => {
              const sizeChanged = s !== size;
              setSize(s);
              setPage(sizeChanged ? 0 : p - 1);
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default MySingleBookingRequests;
