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

/* ===== Nhãn trạng thái booking request ===== */
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
  REFUNDED: "error",
};

/* ===== Worktime status (campaign-worktimes) ===== */
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

/* Lấy requestId dùng chung (SINGLE) */
const getRequestId = (record) =>
  record?.id ?? record?.requestId ?? record?.bookingRequestId ?? null;

/* Lấy workTimeId (CAMPAIGN worktimes) */
const getWorkTimeId = (record) =>
  record?.workTimeId ?? record?.id ?? record?.worktimeId ?? null;

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

const extractKolIdFromAuth = (auth) => {
  return (
    auth?.kolId ??
    auth?.user?.kolId ??
    auth?.user?.kolProfileId ??
    auth?.user?.kol_profile_id ??
    auth?.profile?.kolId ??
    auth?.profile?.kolProfileId ??
    auth?.userInfo?.kolId ??
    null
  );
};

// ✅ lấy kolId từ response getKolProfileByUserId()
const pickKolIdFromProfileResp = (resp) => {
  const raw = resp?.data ?? resp ?? {};
  return (
    raw?.kolId ??
    raw?.id ?? // nhiều BE dùng id = kolId/kolProfileId
    raw?.kolProfileId ??
    raw?.kolProfile?.id ??
    raw?.profile?.id ??
    null
  );
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

  const isCampaignTab = activeTab === "CAMPAIGN";

  // ✅ ưu tiên lấy kolId từ auth context
  const kolIdFromAuth = extractKolIdFromAuth(auth);

  // ✅ nếu không có kolId trong auth, thì lấy theo token giống “đơn lẻ”
  const {
    data: myKolProfileResp,
    isLoading: myKolProfileLoading,
    error: myKolProfileError,
  } = useQuery({
    queryKey: ["kol-my-profile", token],
    queryFn: () => getKolProfileByUserId(),
    enabled: !!token && !authLoading && isCampaignTab && !kolIdFromAuth,
    staleTime: 60_000,
    retry: (failureCount, err) => {
      const code = err?.response?.status || err?.status || 0;
      if (code === 401) return false;
      return failureCount < 2;
    },
  });

  const kolIdResolved =
    kolIdFromAuth || pickKolIdFromProfileResp(myKolProfileResp);

  const buildParams = useCallback(() => {
    // SINGLE: ưu tiên nhờ BE filter theo bookingType nếu có support
    if (!isCampaignTab) return { page, size, bookingType: "SINGLE" };
    // CAMPAIGN: tuỳ BE support page/size hay không, cứ truyền để an toàn
    return { page, size };
  }, [page, size, isCampaignTab]);

  const {
    data: resp,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: [
      "kol-my-booking-requests",
      token,
      activeTab,
      kolIdResolved,
      page,
      size,
    ],
    queryFn: () => {
      if (isCampaignTab) {
        return getKolCampaignWorktimes(kolIdResolved, {
          params: buildParams(),
        });
      }
      return getMySingleBookingRequests({ params: buildParams() });
    },
    keepPreviousData: true,
    staleTime: 30_000,
    enabled:
      !!token && !authLoading && (isCampaignTab ? !!kolIdResolved : true),
    retry: (failureCount, err) => {
      const code = err?.response?.status || err?.status || err?.appStatus || 0;
      if (code === 401) return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (token && !authLoading && (isCampaignTab ? !!kolIdResolved : true)) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, activeTab, kolIdResolved]);

  const raw = resp?.data ?? resp ?? {};
  const serverList = Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const hasServerPaging =
    Array.isArray(raw?.content) ||
    typeof raw?.totalElements === "number" ||
    typeof raw?.total === "number";

  const totalFromServer =
    (typeof raw?.totalElements === "number" && raw.totalElements) ||
    (typeof raw?.total === "number" && raw.total) ||
    0;

  // ✅ lọc theo tab + ẩn trạng thái không muốn hiển thị
  const filteredList = useMemo(() => {
    if (isCampaignTab) {
      return serverList
        .filter((r) => getBookingType(r) === "CAMPAIGN")
        .filter((r) => !["DRAFT", "EXPIRED"].includes(getStatus(r)));
    }
    return serverList
      .filter((r) => getBookingType(r) === "SINGLE")
      .filter((r) => !["DRAFT", "EXPIRED"].includes(getStatus(r)));
  }, [serverList, isCampaignTab]);

  // ✅ nếu BE không paging (trả array), paging client để Pagination chạy đúng
  const totalElements = hasServerPaging ? totalFromServer : filteredList.length;

  const dataSource = useMemo(() => {
    if (hasServerPaging) return filteredList;
    const start = page * size;
    return filteredList.slice(start, start + size);
  }, [filteredList, hasServerPaging, page, size]);

  const getDetailBasePath = (record) => {
    const type = getBookingType(record);
    if (type === "CAMPAIGN") return "/kol/booking/campaign-worktimes/detail";
    return "/kol/booking/single-requests/detail";
  };

  /* ===== Columns SINGLE ===== */
  const columnsSingle = useMemo(
    () => [
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

  /* ===== Columns CAMPAIGN (campaign-worktimes) ===== */
  const columnsCampaign = useMemo(
    () => [
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
        width: 260,
        render: (_, r) => (
          <div className="min-w-[220px]">
            <div className="font-semibold">
              {pickValue(r, ["campaignName"], "--")}
            </div>
            <div className="text-xs text-gray-500">
              {formatDateTime(r?.campaignStartDate, "DD/MM/YYYY")} →{" "}
              {formatDateTime(r?.campaignEndDate, "DD/MM/YYYY")}
            </div>
          </div>
        ),
      },
      {
        title: "Thời gian làm",
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
        title: "Trạng thái lịch",
        key: "worktimeStatus",
        width: 170,
        render: (_, r) => {
          const s = toUpper(r?.status);
          const meta = WORKTIME_STATUS_META[s];
          return (
            <Tag color={meta?.color ?? "default"}>
              {meta?.label ?? s ?? "--"}
            </Tag>
          );
        },
      },
      {
        title: "Trạng thái booking",
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
          const basePath = getDetailBasePath(record);

          return (
            <div className="w-full flex justify-center">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!workTimeId) return;
                  navigate(`${basePath}/${workTimeId}`, { state: { record } });
                }}
                className="!h-9 !px-3 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              >
                Xem chi tiết
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, page, size]
  );

  const columns = isCampaignTab ? columnsCampaign : columnsSingle;

  const tableBlock = (
    <>
      {/* ✅ cảnh báo chỉ hiện khi đã cố lấy kolId mà vẫn fail */}
      {!isLoading &&
        isCampaignTab &&
        !kolIdResolved &&
        !myKolProfileLoading && (
          <Alert
            type="warning"
            showIcon
            message="Không tìm thấy kolId"
            description="Tab Chiến dịch cần kolId để gọi API /campaign-worktimes/{kolId}. Không lấy được kolId từ auth context và cũng không lấy được từ API KOL profile."
            className="mb-3"
          />
        )}

      {myKolProfileError && isCampaignTab && (
        <Alert
          type="error"
          showIcon
          message="Lỗi lấy KOL profile"
          description={String(myKolProfileError?.message || "Unknown error")}
          className="mb-3"
        />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={String(error?.message || "Unknown error")}
          className="mb-3"
        />
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoading || (isCampaignTab && myKolProfileLoading)}
        pagination={false}
        rowKey={(r) => {
          if (isCampaignTab) {
            return (
              getWorkTimeId(r) ??
              r?.requestNumber ??
              `${r?.bookingRequestId}-${r?.startAt}-${r?.endAt}`
            );
          }
          return (
            getRequestId(r) ??
            r?.requestNumber ??
            r?.code ??
            r?.bookingCode ??
            `${r?.createdAt}-${r?.startAt}-${r?.endAt}`
          );
        }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Không có dữ liệu hợp lệ trên trang này." }}
        onRow={(record) => ({
          onClick: () => {
            const basePath = getDetailBasePath(record);
            if (isCampaignTab) {
              const workTimeId = getWorkTimeId(record);
              if (!workTimeId) return;
              navigate(`${basePath}/${workTimeId}`, { state: { record } });
              return;
            }
            const requestId = getRequestId(record);
            if (!requestId) return;
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
