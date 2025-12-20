// src/pages/kol/KolSingleRequest.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import { Button, Card, Pagination, Table, Tag, Tabs } from "antd";
import { CalendarRange, RefreshCcw, Zap, Layers } from "lucide-react";
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
  { label: "Đang chờ thực hiện", value: "PAID" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "default",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
  PAID: "processing",
  REFUNDED: "purple",
};

/* ===== Booking Type ===== */
const BOOKING_TYPE_LABEL = {
  SINGLE: "Book theo giờ",
  CAMPAIGN: "Book theo chiến dịch",
};

const BOOKING_TYPE_COLOR = {
  SINGLE: "orange",
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

  // ✅ 2 tab: SINGLE / CAMPAIGN
  const [activeTab, setActiveTab] = useState("SINGLE");

  // ✅ Lưu pagination riêng cho từng tab
  const [paging, setPaging] = useState({
    SINGLE: { page: 0, size: 20 },
    CAMPAIGN: { page: 0, size: 20 },
  });

  const page = paging?.[activeTab]?.page ?? 0;
  const size = paging?.[activeTab]?.size ?? 20;

  const buildParams = useCallback(() => {
    // ✅ ưu tiên nhờ BE filter theo bookingType nếu có support
    return { page, size, bookingType: activeTab };
  }, [page, size, activeTab]);

  const {
    data: resp,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["kol-my-booking-requests", token, activeTab, page, size],
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

  const totalElementsFromServer =
    (typeof raw?.totalElements === "number" && raw.totalElements) ||
    (typeof raw?.total === "number" && raw.total) ||
    0;

  // ✅ lọc theo tab + ẩn trạng thái không muốn hiển thị
  const dataSource = useMemo(() => {
    return serverList
      .filter((r) => getBookingType(r) === activeTab)
      .filter(
        (r) =>
          !["DRAFT", "EXPIRED", "CANCELLED", "REFUNDED"].includes(getStatus(r))
      );
  }, [serverList, activeTab]);

  const totalElements = totalElementsFromServer;

  const getDetailBasePath = (record) => {
    const type = getBookingType(record);
    // ✅ chỉnh route CAMPAIGN theo project nếu khác
    if (type === "CAMPAIGN") return "/kol/booking/campaign-requests/detail";
    return "/kol/booking/single-requests/detail";
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
          const basePath = getDetailBasePath(record);

          const goDetail = () => {
            if (!requestId) return;
            navigate(`${basePath}/${requestId}`);
          };

          return (
            <div className="w-full flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    goDetail();
                  }}
                  className="!h-9 !px-3 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
                >
                  Xem chi tiết
                </Button>

                {isInProgress && requestId && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${basePath}/${requestId}?metrics=1`);
                    }}
                    className="!h-9 !px-3 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
                  >
                    Báo Cáo Livestream
                  </Button>
                )}
              </div>
            </div>
          );
        },
      },
    ],
    [navigate, page, size]
  );

  const tableBlock = (
    <>
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
            if (!requestId) return;
            const basePath = getDetailBasePath(record);
            navigate(`${basePath}/${requestId}`);
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
            setPaging((prev) => ({
              ...prev,
              [activeTab]: {
                page: pageNumber - 1,
                size: sizeNumber,
              },
            }));
          }}
          total={totalElements}
          showSizeChanger
        />
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      <div className="flex gap-2 items-center">
        <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
          <CalendarRange className="text-gray-500" size={20} />
        </div>

        <section>
          <h1 className="text-[18px] font-bold uppercase">
            Yêu cầu Booking của tôi
          </h1>
          <p className="text-[14px] text-gray-600">
            Danh sách yêu cầu booking theo từng loại.
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
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarGutter={12}
          tabBarStyle={{
            marginBottom: 16,
            padding: 8,
            borderRadius: 14,
            background: "rgba(0,0,0,0.02)",
          }}
          items={[
            {
              key: "SINGLE",
              label: (
                <div
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    "text-[14px] font-semibold select-none",
                    activeTab === "SINGLE"
                      ? "bg-orange-500 border-orange-500 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  <Zap size={16} />
                  <span>Đơn lẻ</span>
                  <span
                    className={[
                      "ml-1 text-[11px] px-2 py-[2px] rounded-full font-bold tracking-wide",
                      activeTab === "SINGLE"
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-700",
                    ].join(" ")}
                  ></span>
                </div>
              ),
              children: tableBlock,
            },
            {
              key: "CAMPAIGN",
              label: (
                <div
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    "text-[14px] font-semibold select-none",
                    activeTab === "CAMPAIGN"
                      ? "bg-purple-600 border-purple-600 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  <Layers size={16} />
                  <span>Chiến dịch</span>
                  <span
                    className={[
                      "ml-1 text-[11px] px-2 py-[2px] rounded-full font-bold tracking-wide",
                      activeTab === "CAMPAIGN"
                        ? "bg-white/20 text-white"
                        : "bg-purple-100 text-purple-700",
                    ].join(" ")}
                  ></span>
                </div>
              ),
              children: tableBlock,
            },
          ]}
        />
      </Card>
    </div>
  );
}
