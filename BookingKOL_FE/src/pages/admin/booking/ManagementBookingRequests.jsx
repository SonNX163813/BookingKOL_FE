import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
} from "antd";
import {
  CalendarRange,
  Eye,
  RefreshCcw,
  RotateCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllBookingRequests } from "../../../hook/admin/booking/useGetAllBookingRequests";
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_OPTIONS,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_OPTIONS,
  STATUS_TAG_COLOR,
} from "../../../constants/mySingleBookingStatuses";

const { RangePicker } = DatePicker;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) {
    return "--";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const composeExecutionTime = (record) => {
  const start =
    record?.startAt ?? record?.startTime ?? record?.executionStart ?? null;
  const end = record?.endAt ?? record?.endTime ?? record?.executionEnd ?? null;

  if (!start && !end) {
    return "--";
  }

  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);

  if (!start) {
    return endLabel;
  }
  if (!end) {
    return startLabel;
  }

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
    .map((value) =>
      value === undefined || value === null ? undefined : String(value)
    )
    .filter((value) => value);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const fallback = [
    record?.kolId,
    record?.brandId,
    record?.userId,
    record?.createdAt,
    record?.startAt,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value))
    .join("-");

  return fallback || `booking-${Math.random().toString(36).slice(2, 10)}`;
};

const deriveStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const pickValue = (record, keys, fallback = "--") => {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};

const getPrimaryContract = (record) => {
  if (!record?.contracts || !Array.isArray(record.contracts)) {
    return null;
  }
  return record.contracts.find(Boolean) ?? null;
};

const getPrimaryPayment = (record) => {
  const contract = getPrimaryContract(record);
  if (!contract?.paymentDTO) {
    return null;
  }
  return contract.paymentDTO;
};

const ManagementBookingRequests = () => {
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

  const {
    isLoadingBookingRequests,
    isFetchingBookingRequests,
    bookingRequestsResponse,
    refetchBookingRequests,
  } = useGetAllBookingRequests({
    page,
    size,
    ...filters,
  });

  const rawData = bookingRequestsResponse?.data;
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
      if (!record) return;

      const requestId = record?.id;

      if (requestId) {
        navigate(`/admin/management-booking-requests/${requestId}`);
      }
    },
    [navigate]
  );

  const handleFilter = (values) => {
    const { status, executionRange, createdRange, requestNumber } = values;
    const normalizedRequestNumber =
      typeof requestNumber === "string" ? requestNumber.trim() : requestNumber;
    setFilters({
      requestNumber:
        normalizedRequestNumber && normalizedRequestNumber.length > 0
          ? normalizedRequestNumber
          : undefined,
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

  const columns = useMemo(
    () => [
      // {
      //   title: "STT",
      //   key: "index",
      //   width: 80,
      //   render: (_, __, index) => (
      //     <span className="font-semibold">#{page * size + index + 1}</span>
      //   ),
      // },
      {
        title: "Mã hợp đồng",
        key: "code-hopdong",
        width: 180,
        render: (_, record) => {
          const contract = getPrimaryContract(record);
          return contract?.contractNumber ?? pickValue(record, ["contractNumber"]);
        },
      },
      {
        title: "Mã yêu cầu",
        key: "code-yc",
        width: 180,
        render: (_, record) => pickValue(record, ["requestNumber"]),
      },
      // {
      //   title: "Khach hang",
      //   key: "customer",
      //   width: 220,
      //   render: (_, record) =>
      //     pickValue(record, [
      //       "customerName",
      //       "brandName",
      //       "createdByName",
      //       "requesterName",
      //       "userName",
      //       "userEmail",
      //       "userId",
      //     ]),
      // },
      // {
      //   title: "KOL",
      //   key: "kol",
      //   width: 220,
      //   render: (_, record) =>
      //     pickValue(record, [
      //       "kolName",
      //       "kolFullName",
      //       "kolProfileName",
      //       "kolEmail",
      //       "kolId",
      //     ]),
      // },
      {
        title: "Trạng thái",
        key: "status",
        width: 150,
        dataIndex: "status",
        render: (status) => {
          const normalized = status?.toUpperCase();
          const displayLabel =
            BOOKING_STATUS_LABEL?.[normalized] ??
            BOOKING_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ??
            normalized ??
            "--";
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>
              {displayLabel}
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

          if (!normalized) {
            return "--";
          }
          const displayLabel =
            PAYMENT_STATUS_LABEL?.[normalized] ??
            PAYMENT_STATUS_OPTIONS.find((p) => p.value === normalized)?.label ??
            normalized;
          return (
            <Tag color={PAYMENT_STATUS_COLOR[normalized] ?? "default"}>
              {displayLabel}
            </Tag>
          );
        },
      },
      {
        title: "Thời gian thực hiện",
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

          const numericValue =
            typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
          return Number.isNaN(numericValue)
            ? "--"
            : formatCurrency(numericValue);
        },
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
    [handleViewDetail, page, size]
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
          <CalendarRange className="text-gray-500" size={20} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold uppercase">
            Quản lý booking lẻ
          </h1>
          <p className="text-[14px] text-gray-600">
            Tra cứu và lọc những yêu cầu booking KOL trong hệ thống.
          </p>
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
          <Form.Item label="Trạng thái" name="status">
            <Select
              allowClear
              placeholder="Chọn trạng thái booking"
              options={BOOKING_STATUS_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="Thời gian thực hiện" name="executionRange">
            <RangePicker
              className="w-full"
              format="YYYY-MM-DD"
              allowEmpty={[true, true]}
            />
          </Form.Item>

          <Form.Item label="Thời gian tạo" name="createdRange">
            <RangePicker
              className="w-full"
              format="YYYY-MM-DD"
              allowEmpty={[true, true]}
            />
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
                onClick={() => refetchBookingRequests()}
                loading={isFetchingBookingRequests}
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
          loading={isLoadingBookingRequests}
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

export default ManagementBookingRequests;
