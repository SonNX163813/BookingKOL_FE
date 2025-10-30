import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Pagination,
  Table,
  Tag,
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { CalendarRange, Eye, RefreshCcw, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMySingleBookingRequests } from "../../services/kol/KolAPI";

const { RangePicker } = DatePicker;

/* ===== Việt hoá dayjs: T2..T7, CN và tuần bắt đầu từ Thứ Hai ===== */
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
});

/* ------------------------- TRẠNG THÁI BOOKING (rút gọn) ------------------------- */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh TOán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
};

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

const pickValue = (record, keys, fallback = "--") => {
  if (!record) return fallback;
  for (const key of keys) {
    const v = record[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

const composeRowKey = (record) => {
  const candidates = [
    record?.id,
    record?.requestId,
    record?.bookingRequestId,
    record?.requestNumber,
    record?.code,
    record?.bookingCode,
  ]
    .map((v) => (v == null ? undefined : String(v)))
    .filter(Boolean);
  if (candidates.length) return candidates[0];

  const fallback = [
    record?.kolId,
    record?.createdAt,
    record?.startAt,
    record?.endAt,
  ]
    .filter((v) => v != null)
    .map(String)
    .join("-");
  return fallback || `req-${Math.random().toString(36).slice(2, 9)}`;
};

export default function KolSingleRequest() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  // Mặc định hiển thị IN_PROGRESS theo yêu cầu mới
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({
    status: "IN_PROGRESS",
    startAt: undefined,
    endAt: undefined,
  });

  const {
    data: mySingleRequestsResponse,
    isLoading: isLoadingMySingleRequests,
    isFetching: isFetchingMySingleRequests,
    refetch: refetchMySingleRequests,
    error,
  } = useQuery({
    queryKey: ["kol-my-single-requests", token, { page, size, ...filters }],
    queryFn: () =>
      getMySingleBookingRequests({
        params: { page, size, ...filters },
      }),
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
    if (token && !authLoading) {
      refetchMySingleRequests();
    }
  }, [token, authLoading, refetchMySingleRequests]);

  const rawData = mySingleRequestsResponse;
  const dataSource = Array.isArray(rawData?.content)
    ? rawData.content
    : Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.items)
    ? rawData.items
    : [];

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
    explicitTotal ?? Math.max(dataSource.length, inferredTotal);

  useEffect(() => {
    if (page > 0 && dataSource.length === 0) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [dataSource.length, page]);

  const handleViewDetail = useCallback(
    (record) => {
      const requestId =
        record?.id ?? record?.requestId ?? record?.bookingRequestId ?? null;
      if (!requestId) {
        console.warn("Không tìm thấy ID hợp lệ trong record:", record);
        return;
      }
      navigate(`/kol/booking/single-requests/detail/${requestId}`);
    },
    [navigate]
  );

  const handleExecutionChange = (range) => {
    const [start, end] = range || [];
    setFilters((prev) => ({
      ...prev,
      status: "IN_PROGRESS",
      startAt: start ? start.format("YYYY-MM-DD") : undefined,
      endAt: end ? end.format("YYYY-MM-DD") : undefined,
    }));
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      status: "IN_PROGRESS",
      startAt: undefined,
      endAt: undefined,
    });
    setPage(0);
  };

  const columns = useMemo(
    () => [
      {
        title: "STT",
        key: "index",
        width: 80,
        render: (_, __, index) => (
          <span className="font-semibold">#{page * size + index + 1}</span>
        ),
      },
      {
        title: "Mã yêu cầu",
        key: "requestNumber",
        width: 180,
        render: (_, record) =>
          pickValue(record, ["requestNumber", "code", "bookingCode", "id"]),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 160,
        dataIndex: "status",
        render: (status) => {
          const normalized = status?.toString()?.toUpperCase?.();
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
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
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
            Booking lẻ của tôi
          </h1>
          <p className="text-[14px] text-gray-600">
            Tra cứu &amp; lọc yêu cầu booking bạn nhận được.
          </p>
        </div>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Form form={form} layout="vertical" className="grid gap-4">
          <Form.Item label="Khoảng thực hiện" name="executionRange">
            <div className="flex flex-wrap items-center gap-2">
              <ConfigProvider locale={viVN}>
                <RangePicker
                  format="YYYY-MM-DD"
                  allowEmpty={[true, true]}
                  onChange={handleExecutionChange}
                />
              </ConfigProvider>

              <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={() => refetchMySingleRequests()}
                loading={isFetchingMySingleRequests}
              >
                Làm mới
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} className="flex-1 shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoadingMySingleRequests}
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
