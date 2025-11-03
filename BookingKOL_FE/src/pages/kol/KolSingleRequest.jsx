// src/pages/kol/KolSingleRequest.jsx
import { useCallback, useMemo, useState, useEffect } from "react";
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
import {
  CalendarRange,
  Eye,
  RefreshCcw,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMySingleBookingRequests } from "../../services/kol/KolAPI";

const { RangePicker } = DatePicker;

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
];

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
  PAID: "success",
};

/** ✅ Chỉ hiển thị các trạng thái này (lọc tại BE) */
const STATUS_QUERY = [
  "IN_PROGRESS",
  "REQUESTED",
  "COMPLETED",
  "PAID",
  "CANCELLED",
];

const normalize = (v) => (v == null ? "" : String(v).trim());
const toUpper = (v) => normalize(v).toUpperCase();
const getStatus = (r) =>
  toUpper(r?.status ?? r?.bookingStatus ?? r?.state ?? r?.requestStatus ?? "");

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
  const [form] = Form.useForm();
  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState({
    startAt: undefined,
    endAt: undefined,
  });

  /** Gửi page/size + status; chỉ thêm khoảng ngày khi đủ cả 2 */
  const buildParams = useCallback(() => {
    const { startAt, endAt } = filters || {};
    const params = { page, size, status: STATUS_QUERY }; // mảng
    if (startAt && endAt) {
      params.startAt = startAt;
      params.endAt = endAt;
    }
    return params;
  }, [page, size, filters]);

  const {
    data: resp,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["kol-my-single-requests", token, { page, size, ...filters }],
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

  const raw = resp?.data ?? resp ?? {};
  const serverList = Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const serverTotal =
    (typeof raw?.totalElements === "number" && raw.totalElements) ||
    (typeof raw?.total === "number" && raw.total) ||
    0;

  const dataSource = serverList;

  const totalElements = useMemo(() => {
    if (serverTotal > 0) return serverTotal;
    const currentCount = Array.isArray(serverList) ? serverList.length : 0;
    const loadedSoFar = page * size + currentCount;
    const maybeHasNext = currentCount === size;
    return loadedSoFar + (maybeHasNext ? 1 : 0);
  }, [serverTotal, serverList, page, size]);

  const handleExecutionChange = (range) => {
    const [start, end] = range || [];
    setFilters({
      startAt: start ? start.format("YYYY-MM-DD") : undefined,
      endAt: end ? end.format("YYYY-MM-DD") : undefined,
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({ startAt: undefined, endAt: undefined });
    setPage(0);
  };

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
        width: 180,
        render: (_, record) =>
          pickValue(record, ["requestNumber", "code", "bookingCode", "id"]),
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
        render: (record) => {
          const requestId =
            record?.id ?? record?.requestId ?? record?.bookingRequestId ?? null;
          const normalized = getStatus(record);
          const isInProgress = normalized === "IN_PROGRESS";
          return (
            <div className="w-full flex justify-center gap-3">
              <Button
                onClick={() =>
                  requestId &&
                  navigate(`/kol/booking/single-requests/detail/${requestId}`)
                }
                className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              >
                <Eye size={18} className="font-semibold" />
              </Button>
              {isInProgress && requestId && (
                <Button
                  className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
                  onClick={() =>
                    navigate(
                      `/kol/booking/single-requests/detail/${requestId}?metrics=1`
                    )
                  }
                >
                  <BarChart3 size={18} />
                </Button>
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
            Booking lẻ của tôi
          </h1>
          <p className="text-[14px] text-gray-600">
            Tra cứu &amp; lọc yêu cầu booking bạn nhận được.
          </p>
        </section>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Form form={form} layout="vertical">
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
                onClick={() => refetch()}
                loading={isFetching}
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
          loading={isLoading}
          pagination={false}
          rowKey={(r) =>
            r?.id ??
            r?.requestId ??
            r?.bookingRequestId ??
            r?.requestNumber ??
            r?.code ??
            r?.bookingCode ??
            `${r?.createdAt}-${r?.startAt}-${r?.endAt}`
          }
          scroll={{ x: "auto" }}
          locale={{
            emptyText:
              "Không có booking phù hợp trên trang này. Hãy đổi ngày hoặc chuyển trang.",
          }}
        />

        <div className="!my-4 py-5 flex justify-center">
          <Pagination
            align="center"
            current={page + 1}
            pageSize={size}
            pageSizeOptions={["5", "10", "20", "50", "100"]}
            onChange={(pageNumber, sizeNumber) => {
              setPage(pageNumber - 1);
              setSize(sizeNumber);
            }}
            total={totalElements}
            showSizeChanger
            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
          />
        </div>
      </Card>
    </div>
  );
}
