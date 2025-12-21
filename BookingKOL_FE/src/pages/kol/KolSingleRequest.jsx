// src/pages/kol/KolSingleRequest.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import { Button, Card, Pagination, Table, Tag, Tabs, Alert } from "antd";
import { CalendarRange, RefreshCcw, Zap, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getMySingleBookingRequests,
  getKolProfileByUserId,
} from "../../services/kol/KolAPI";
import { getKolCampaignWorktimes } from "../../services/kol/KolCampaignWorktimeAPI";

/* ===== Việt hoá dayjs ===== */
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
});

/* ===== Nhãn trạng thái (bookingStatus) ===== */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đang chờ thực hiện", value: "PAID" },
  { label: "Đang chờ thực hiện", value: "ACCEPTED" },
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
  REFUNDED: "error",
  ACCEPTED: "processing",
};

/* ===== Worktime status (status trong campaign-worktimes) ===== */
const WORKTIME_STATUS_META = {
  PENDING: { label: "Chờ xác nhận", color: "gold" },
  APPROVED: { label: "Đã xác nhận", color: "processing" },
  REJECTED: { label: "Từ chối", color: "error" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
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

/* SINGLE request id */
const getRequestId = (record) =>
  record?.id ?? record?.requestId ?? record?.bookingRequestId ?? null;

/* CAMPAIGN workTimeId */
const getWorkTimeId = (record) =>
  record?.workTimeId ?? record?.id ?? record?.worktimeId ?? null;

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

  // ✅ GIỐNG KolProfile.jsx: userId nằm ở auth.user.id
  const userId = auth?.user?.id || null;

  // ✅ 2 tab: SINGLE / CAMPAIGN
  const [activeTab, setActiveTab] = useState("SINGLE");

  // ✅ pagination riêng cho từng tab
  const [paging, setPaging] = useState({
    SINGLE: { page: 0, size: 20 },
    CAMPAIGN: { page: 0, size: 20 },
  });

  const page = paging?.[activeTab]?.page ?? 0;
  const size = paging?.[activeTab]?.size ?? 20;

  const buildParams = useCallback(() => ({ page, size }), [page, size]);

  // ✅ Lấy KOL profile theo userId (CHỈ khi tab CAMPAIGN)
  const {
    data: kolProfile,
    isLoading: kolProfileLoading,
    error: kolProfileError,
    refetch: refetchKolProfile,
  } = useQuery({
    queryKey: ["kol-profile-by-userId-for-campaign", token, userId],
    queryFn: () => getKolProfileByUserId(userId),
    enabled: !!token && !authLoading && activeTab === "CAMPAIGN" && !!userId,
    staleTime: 60_000,
  });

  // ✅ kolId chính là kolProfile.id (KolProfile.jsx cũng hiển thị ID: kol.id)
  const kolId = kolProfile?.id ?? null;

  // ===== SINGLE LIST (BE tự theo token) =====
  const {
    data: singleResp,
    isLoading: singleLoading,
    isFetching: singleFetching,
    error: singleError,
    refetch: refetchSingle,
  } = useQuery({
    queryKey: ["kol-my-single-requests", token, page, size],
    queryFn: () => getMySingleBookingRequests({ params: buildParams() }),
    keepPreviousData: true,
    staleTime: 30_000,
    enabled: !!token && !authLoading && activeTab === "SINGLE",
    retry: (failureCount, err) => {
      const code = err?.response?.status || err?.status || err?.appStatus || 0;
      if (code === 401) return false;
      return failureCount < 2;
    },
  });

  // ===== CAMPAIGN LIST (bắt buộc kolId) =====
  const {
    data: campaignResp,
    isLoading: campaignLoading,
    isFetching: campaignFetching,
    error: campaignError,
    refetch: refetchCampaign,
  } = useQuery({
    queryKey: ["kol-campaign-worktimes", token, kolId, page, size],
    queryFn: () => getKolCampaignWorktimes({ kolId, params: buildParams() }),
    keepPreviousData: true,
    staleTime: 30_000,
    enabled: !!token && !authLoading && activeTab === "CAMPAIGN" && !!kolId,
    retry: (failureCount, err) => {
      const code = err?.response?.status || err?.status || err?.appStatus || 0;
      if (code === 401) return false;
      return failureCount < 2;
    },
  });

  // ===== bind theo tab =====
  const resp = activeTab === "SINGLE" ? singleResp : campaignResp;
  const isLoading =
    activeTab === "SINGLE"
      ? singleLoading
      : campaignLoading || kolProfileLoading;

  const isFetching = activeTab === "SINGLE" ? singleFetching : campaignFetching;

  const error =
    activeTab === "SINGLE" ? singleError : campaignError || kolProfileError;

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

  // ✅ SINGLE: ẩn DRAFT/EXPIRED (giữ như bạn đang làm)
  const dataSource = useMemo(() => {
    if (activeTab === "CAMPAIGN") return serverList;
    return serverList
      .filter((r) => getBookingType(r) === "SINGLE")
      .filter((r) => !["DRAFT", "EXPIRED"].includes(getStatus(r)));
  }, [serverList, activeTab]);

  const totalElements = totalElementsFromServer;

  const columns = useMemo(() => {
    if (activeTab === "CAMPAIGN") {
      return [
        {
          title: "STT",
          key: "stt",
          width: 80,
          render: (_, __, index) => (
            <div className="font-bold">#{page * size + index + 1}</div>
          ),
        },
        {
          title: "Mã yêu cầu",
          key: "requestNumber",
          width: 160,
          render: (_, r) => pickValue(r, ["requestNumber", "bookingNumber"]),
        },
        {
          title: "Chiến dịch",
          key: "campaign",
          width: 280,
          render: (_, r) => (
            <div className="min-w-[220px]">
              <div className="font-semibold">
                {pickValue(r, ["campaignName"], "--")}
              </div>
            </div>
          ),
        },
        {
          title: "Thời gian thực hiện",
          key: "worktime",
          width: 260,
          render: (_, r) => composeExecutionTime(r),
        },
        {
          title: "Ghi chú",
          key: "note",
          width: 220,
          render: (_, r) => pickValue(r, ["note"], "--"),
        },

        {
          title: "Trạng thái đơn đặt",
          key: "bookingStatus",
          width: 180,
          render: (_, r) => {
            const s = toUpper(r?.bookingStatus);
            const meta =
              BOOKING_STATUS_OPTIONS.find((x) => x.value === s) || null;
            const label = meta?.label ?? s ?? "--";
            return <Tag color={STATUS_TAG_COLOR[s] ?? "default"}>{label}</Tag>;
          },
        },
        {
          title: "Ngày tạo",
          key: "bookingCreatedAt",
          width: 200,
          render: (_, r) => formatDateTime(r?.bookingCreatedAt),
        },
        {
          title: "Thao tác",
          key: "action",
          align: "center",
          width: 200,
          render: (_, record) => {
            const workTimeId = getWorkTimeId(record);
            return (
              <div className="w-full flex justify-center">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!workTimeId) return;
                    navigate(
                      `/kol/booking/campaign-worktimes/detail/${workTimeId}`,
                      {
                        state: { record },
                      }
                    );
                  }}
                  className="!h-9 !px-3 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
                >
                  Xem chi tiết
                </Button>
              </div>
            );
          },
        },
      ];
    }

    // ===== SINGLE =====
    return [
      {
        title: "STT",
        key: "stt",
        width: 80,
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
        title: "Thao tác",
        key: "action",
        align: "center",
        width: 220,
        render: (_, record) => {
          const requestId = getRequestId(record);
          return (
            <div className="w-full flex justify-center">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requestId) return;
                  navigate(`/kol/booking/single-requests/detail/${requestId}`);
                }}
                className="!h-9 !px-3 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              >
                Xem chi tiết
              </Button>
            </div>
          );
        },
      },
    ];
  }, [activeTab, navigate, page, size]);

  const onRefresh = () => {
    if (activeTab === "SINGLE") return refetchSingle();
    // CAMPAIGN: nếu chưa có kolProfile thì gọi lấy profile trước
    if (!userId) return refetchKolProfile();
    if (!kolId) return refetchKolProfile();
    return refetchCampaign();
  };

  const tableBlock = (
    <>
      {activeTab === "CAMPAIGN" && !userId && (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Không tìm thấy userId trong auth context"
          description="Bạn đang login nhưng AuthContext chưa có auth.user.id. Hãy kiểm tra useAuth() trả về user chưa."
        />
      )}

      {activeTab === "CAMPAIGN" && userId && !kolId && (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Chưa lấy được kolId"
          description="Đang gọi getKolProfileByUserId(userId) để lấy kolProfile.id làm kolId."
        />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          className="mb-3"
          message="Lỗi tải dữ liệu"
          description={String(error?.message || "Unknown error")}
        />
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        pagination={false}
        rowKey={(r) =>
          (activeTab === "CAMPAIGN" ? getWorkTimeId(r) : getRequestId(r)) ??
          r?.requestNumber ??
          r?.code ??
          `${r?.createdAt}-${r?.startAt}-${r?.endAt}`
        }
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Không có dữ liệu trên trang này." }}
        onRow={(record) => ({
          onClick: () => {
            if (activeTab === "SINGLE") {
              const requestId = getRequestId(record);
              if (!requestId) return;
              navigate(`/kol/booking/single-requests/detail/${requestId}`);
            } else {
              const workTimeId = getWorkTimeId(record);
              if (!workTimeId) return;
              navigate(`/kol/booking/campaign-worktimes/detail/${workTimeId}`, {
                state: { record },
              });
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
            setPaging((prev) => ({
              ...prev,
              [activeTab]: { page: pageNumber - 1, size: sizeNumber },
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
            onClick={onRefresh}
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
