// src/pages/kol/KolCampaignWorktimeDetail.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Grid,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeft, CalendarRange, FileText, BarChart3 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getKolProfileByUserId } from "../../services/kol/KolAPI";
import { getKolCampaignWorktimes } from "../../services/kol/KolCampaignWorktimeAPI";

// ✅ Metrics giống KolSingleRequestDetail
import { createKolLivestreamMetric } from "../../services/kol/LiveMetricAPI";
import { getKolLivestreamMetrics } from "../../services/kol/LiveMetricQueryAPI";
import LivestreamMetricModal from "../../components/kol/kol-metric/LivestreamMetricModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ===== dayjs (vi) ===== */
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale("vi");
dayjs.updateLocale("vi", {
  weekStart: 1,
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
});

const normalize = (v) => (v == null ? "" : String(v).trim());
const toUpper = (v) => normalize(v).toUpperCase();

const formatDateTime = (v, p = "DD/MM/YYYY HH:mm") =>
  v ? dayjs(v).format(p) : "--";

/* ===== Worktime status ===== */
const WORKTIME_STATUS_META = {
  PENDING: { label: "Chờ xác nhận", color: "gold" },
  APPROVED: { label: "Đã xác nhận", color: "processing" },
  ACCEPTED: { label: "Đã xác nhận", color: "processing" },
  REJECTED: { label: "Từ chối", color: "error" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

/* ===== Booking status ===== */
const BOOKING_STATUS_META = {
  DRAFT: { label: "Chờ thanh toán", color: "default" },
  REQUESTED: { label: "Đã yêu cầu", color: "processing" },
  PAID: { label: "Đang chờ thực hiện", color: "success" },
  ACCEPTED: { label: "Đã xác nhận", color: "processing" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
  EXPIRED: { label: "Đã hết hạn", color: "volcano" },
  CANCELLED: { label: "Đã hủy", color: "error" },
  REFUNDED: { label: "Đã hoàn tiền", color: "error" },
};

/* ===== Helpers error ===== */
const getHttpStatus = (e) =>
  e?.appStatus || e?.response?.status || e?.status || 0;
const isBadRequest = (e) => getHttpStatus(e) === 400;

/* ===== Metrics formatting (y hệt KolSingleRequestDetail) ===== */
const fmtInt = (v) =>
  Number.isFinite(+v) ? Math.trunc(+v).toLocaleString("vi-VN") : "--";
const fmtVnd = (v) =>
  Number.isFinite(+v)
    ? (+v).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "--";
const fmtPct = (v) =>
  Number.isFinite(+v) ? `${(+v).toFixed(2).replace(/\.00$/, "")}%` : "--";

const METRIC_FIELDS = [
  { key: "revenue", label: "Tổng doanh thu", fmt: fmtVnd },
  { key: "gpm", label: "GPM", fmt: fmtVnd },
  { key: "avgOrderValue", label: "Giá trị TB mỗi đơn", fmt: fmtVnd },
  { key: "totalOrders", label: "Tổng đơn hàng", fmt: fmtInt },
  { key: "buyers", label: "Số người mua", fmt: fmtInt },
  { key: "productsSold", label: "Các mặt hàng được bán", fmt: fmtInt },
  { key: "totalViews", label: "Tổng lượt xem", fmt: fmtInt },
  { key: "liveViewsOver1min", label: "Lượt xem live > 1 phút", fmt: fmtInt },
  { key: "viewsUnder1min", label: "Lượt xem < 1 phút", fmt: fmtInt },
  { key: "pcu", label: "PCU (đồng xem cao nhất)", fmt: fmtInt },
  { key: "avgViewDuration", label: "Thời gian xem TB (giây)", fmt: fmtInt },
  { key: "commentsIn1min", label: "BL trong 1 phút", fmt: fmtInt },
  { key: "totalComments", label: "Tổng bình luận", fmt: fmtInt },
  { key: "productClickRate", label: "Tỷ lệ click SP", fmt: fmtPct },
  { key: "orderConversionRate", label: "Tỷ lệ chuyển đổi đơn", fmt: fmtPct },
];

export default function KolCampaignWorktimeDetail() {
  const { workTimeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  // ✅ giống KolProfile.jsx: lấy userId từ auth.user.id
  const userId = auth?.user?.id || null;

  // record có sẵn khi navigate từ list: navigate(..., { state: { record, backTo } })
  const stateRecord = location?.state?.record ?? null;

  const derivedListPath = useMemo(() => {
    const backTo = location.state?.backTo;
    if (backTo) return backTo;
    return "/kol/single-requests/all";
  }, [location.state]);

  const goBackList = () => {
    const backTo = location.state?.backTo;
    if (backTo) {
      navigate(backTo, { replace: true });
      return;
    }
    if (window.history.length > 1) navigate(-1);
    else navigate(derivedListPath, { replace: true });
  };

  // ✅ Lấy kolId qua profile theo userId (y hệt KolProfile.jsx)
  const {
    data: kolProfile,
    isLoading: isKolLoading,
    isFetching: isKolFetching,
    error: kolError,
    refetch: refetchKolProfile,
  } = useQuery({
    queryKey: ["kol-profile-by-userId", token, userId],
    queryFn: () => getKolProfileByUserId(userId),
    enabled: !!token && !authLoading && !!userId,
    staleTime: 60_000,
    retry: 1,
  });

  const kolId = kolProfile?.id ?? null;

  const stateWorkId = stateRecord?.workTimeId ?? stateRecord?.id ?? null;
  const stateMatched =
    !!stateRecord && String(stateWorkId ?? "") === String(workTimeId ?? "");

  const shouldFetchList =
    !!token && !authLoading && !!workTimeId && !!kolId && !stateMatched;

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["kol-campaign-worktimes", token, kolId],
    queryFn: () =>
      getKolCampaignWorktimes({
        kolId,
        params: { page: 0, size: 1000 },
      }),
    enabled: shouldFetchList,
    staleTime: 30_000,
    retry: (count, err) => {
      const code = getHttpStatus(err);
      if (code === 404) return false;
      return count < 2;
    },
  });

  const raw = listData?.data ?? listData ?? {};
  const list = Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const record = useMemo(() => {
    if (stateMatched) return stateRecord;
    if (!workTimeId) return null;
    return (
      list.find(
        (x) => String(x?.workTimeId ?? x?.id ?? "") === String(workTimeId)
      ) || null
    );
  }, [stateMatched, stateRecord, list, workTimeId]);

  const workStatus = toUpper(record?.status);
  const workMeta = WORKTIME_STATUS_META[workStatus];

  const bookingStatus = toUpper(record?.bookingStatus);
  const bookingMeta = BOOKING_STATUS_META[bookingStatus];

  const requestNo =
    record?.requestNumber ??
    record?.bookingNumber ??
    record?.bookingRequestId ??
    "--";

  const isLoading = isKolLoading || (shouldFetchList && isListLoading);
  const isFetching = isKolFetching || isListFetching;

  const error = listError || kolError;

  const descContentStyle = useMemo(
    () => ({
      whiteSpace: "normal",
      wordBreak: "keep-all",
      overflowWrap: "break-word",
    }),
    []
  );

  const labelStyle = useMemo(
    () => ({
      width: screens.lg ? 190 : 150,
      fontWeight: 400,
      color: "#111827",
      background: "#fafafa",
    }),
    [screens.lg]
  );

  const contentStyle = useMemo(
    () => ({
      ...descContentStyle,
      background: "#fff",
    }),
    [descContentStyle]
  );

  const handleRefresh = () => {
    if (!token || authLoading) return;
    if (!kolId) {
      refetchKolProfile();
      return;
    }
    refetchList();
    // metrics refresh nếu đã có id
    if (selectedWorktimeId) refetchMetrics();
  };

  /* =========================
   * ✅ METRICS LOGIC (giống Single)
   * ========================= */
  const worktimeIdResolved =
    record?.workTimeId ?? record?.id ?? workTimeId ?? "";

  // Với campaign detail, coi như có 1 worktime duy nhất
  const worktimes = useMemo(() => {
    if (!worktimeIdResolved) return [];
    return [
      {
        id: String(worktimeIdResolved),
        startAt: record?.startAt ?? null,
        endAt: record?.endAt ?? null,
        status: record?.status ?? null,
      },
    ];
  }, [worktimeIdResolved, record?.startAt, record?.endAt, record?.status]);

  // giống Single: chỉ cho nhập khi đang IN_PROGRESS
  // (Campaign có thể set ở bookingStatus hoặc status => OR để chắc chắn)
  const canInputMetrics =
    bookingStatus === "IN_PROGRESS" || workStatus === "IN_PROGRESS";

  const endedWorktime = useMemo(() => {
    if (!worktimeIdResolved) return null;
    if (!record?.endAt) return null;
    // Single check: status IN_PROGRESS + endAt đã qua
    const inProgress =
      toUpper(record?.status) === "IN_PROGRESS" ||
      toUpper(record?.bookingStatus) === "IN_PROGRESS";
    if (!inProgress) return null;

    const end = dayjs(record.endAt);
    if (!end.isValid()) return null;
    if (!dayjs().isAfter(end)) return null;

    return {
      id: String(worktimeIdResolved),
      startAt: record?.startAt,
      endAt: record?.endAt,
    };
  }, [
    worktimeIdResolved,
    record?.startAt,
    record?.endAt,
    record?.status,
    record?.bookingStatus,
  ]);

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [selectedWorktimeId, setSelectedWorktimeId] = useState("");

  // set default worktimeId
  useEffect(() => {
    if (!worktimeIdResolved) return;
    setSelectedWorktimeId((prev) => prev || String(worktimeIdResolved));
  }, [worktimeIdResolved]);

  // mở modal bằng query ?metrics=1 (giống Single)
  useEffect(() => {
    if (searchParams.get("metrics") === "1" && canInputMetrics) {
      setMetricsOpen(true);
    }
  }, [searchParams, canInputMetrics]);

  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isFetching: isMetricsFetching,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["kol-livestream-metrics", token, selectedWorktimeId],
    queryFn: () => getKolLivestreamMetrics(selectedWorktimeId),
    enabled: !!token && !!selectedWorktimeId,
    retry: (count, err) => (isBadRequest(err) ? false : count < 1),
  });

  const { mutateAsync: submitMetricsAsync, isLoading: isSubmitting } =
    useMutation({
      mutationFn: async ({ worktimeId, dto }) =>
        createKolLivestreamMetric(worktimeId, dto),
    });

  const selectedWorktime = useMemo(
    () => worktimes.find((w) => String(w?.id) === String(selectedWorktimeId)),
    [worktimes, selectedWorktimeId]
  );

  const handleOpenMetrics = () => {
    if (!canInputMetrics) {
      message.error("Chỉ có thể nhập số liệu khi đơn đang 'Đang thực hiện'.");
      return;
    }
    if (!selectedWorktimeId) {
      message.error("Không xác định được ca livestream để nhập số liệu.");
      return;
    }
    setMetricsOpen(true);
  };

  const handleSubmitMetrics = async (wid, dto) => {
    await submitMetricsAsync({ worktimeId: wid, dto });
    message.success("Đã lưu số liệu livestream.");
    setMetricsOpen(false);
    setSelectedWorktimeId(wid);

    // cập nhật lại list để sync status + cập nhật metrics
    refetchList();
    refetchMetrics();
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* ===== Top bar ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button icon={<ArrowLeft size={16} />} onClick={goBackList}>
            Quay lại danh sách
          </Button>

          <Button
            icon={<CalendarRange size={16} />}
            onClick={handleRefresh}
            loading={isFetching}
            disabled={!token || authLoading}
          >
            Làm mới
          </Button>

          {canInputMetrics && (
            <Button
              type="primary"
              icon={<BarChart3 size={16} />}
              onClick={handleOpenMetrics}
              disabled={!record}
            >
              Nhập số liệu livestream
            </Button>
          )}
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-0">
            Chi tiết đơn chiến dịch
          </Title>
        </div>
      </div>

      {(!workTimeId || !token) && (
        <Card>
          <Alert
            type="warning"
            showIcon
            message="Thiếu thông tin để hiển thị"
            description="Không có workTimeId hoặc bạn chưa đăng nhập."
            action={
              <Button onClick={goBackList} type="primary">
                Về danh sách
              </Button>
            }
          />
        </Card>
      )}

      {error ? (
        <Card>
          <Alert
            type={getHttpStatus(error) === 404 ? "warning" : "error"}
            showIcon
            message={
              getHttpStatus(error) === 404
                ? "Không tìm thấy đơn chiến dịch"
                : "Không thể tải chi tiết đơn chiến dịch."
            }
            description={String(error?.message ?? "")}
            action={
              <Button onClick={goBackList} type="primary">
                Về danh sách
              </Button>
            }
          />
        </Card>
      ) : (
        <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
          {!record ? (
            <Card className="shadow-sm" bordered={false}>
              <Empty description="Không tìm thấy dữ liệu đơn chiến dịch." />
            </Card>
          ) : (
            <>
              {/* ===== Header ===== */}
              <Card className="shadow-sm" bordered={false}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <Space align="start" size={12}>
                    <div className="border-2 border-gray-200 p-2 rounded-md w-fit">
                      <FileText className="text-gray-500" size={18} />
                    </div>
                    <div>
                      <div className="text-[18px] font-bold leading-tight">
                        {record?.campaignName || "Chiến dịch"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Mã yêu cầu:{" "}
                        <span className="font-semibold">{requestNo}</span>
                      </div>
                    </div>
                  </Space>

                  {/* <div className="flex gap-2 flex-wrap md:justify-end">
                    <Tag color={workMeta?.color ?? "default"}>
                      {workMeta?.label ?? workStatus ?? "--"}
                    </Tag>
                    <Tag color={bookingMeta?.color ?? "default"}>
                      {bookingMeta?.label ?? bookingStatus ?? "--"}
                    </Tag>
                    <Tag color="purple">Book theo chiến dịch</Tag>
                  </div> */}
                </div>
              </Card>

              {/* ✅ cảnh báo giống Single: ca kết thúc nhưng chưa có metrics */}
              {canInputMetrics && endedWorktime && !metrics && (
                <Alert
                  type="error"
                  showIcon
                  className="mb-0"
                  message={
                    <Text type="danger">
                      Ca livestream đã kết thúc lúc{" "}
                      <Text strong>{formatDateTime(endedWorktime.endAt)}</Text>.
                      Vui lòng nhập số liệu livestream để hoàn tất.
                    </Text>
                  }
                />
              )}

              {/* ===== Worktime info ===== */}
              <Card
                className="shadow-sm"
                bordered={false}
                title={<span>Thông tin lịch làm việc</span>}
              >
                <Descriptions
                  bordered
                  size="middle"
                  column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  labelStyle={labelStyle}
                  contentStyle={contentStyle}
                >
                  <Descriptions.Item label="Bắt đầu lúc">
                    {formatDateTime(record?.startAt)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Kết thúc lúc">
                    {formatDateTime(record?.endAt)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Trạng thái booking">
                    <Tag color={bookingMeta?.color ?? "default"}>
                      {bookingMeta?.label ?? bookingStatus ?? "--"}
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label="Ghi chú"
                    span={screens.lg ? 3 : screens.md ? 2 : 1}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {record?.note ?? "--"}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* ===== Campaign info ===== */}
              <Card
                className="shadow-sm"
                bordered={false}
                title={<span>Thông tin chiến dịch</span>}
              >
                <Descriptions
                  bordered
                  size="middle"
                  column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  labelStyle={labelStyle}
                  contentStyle={contentStyle}
                >
                  <Descriptions.Item label="Mã yêu cầu">
                    {record?.requestNumber ?? "--"}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label="Tên chiến dịch"
                    span={screens.lg ? 2 : 1}
                  >
                    <Text strong>{record?.campaignName ?? "--"}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Ngày bắt đầu">
                    {formatDateTime(record?.campaignStartDate, "DD/MM/YYYY")}
                  </Descriptions.Item>

                  <Descriptions.Item label="Ngày kết thúc">
                    {formatDateTime(record?.campaignEndDate, "DD/MM/YYYY")}
                  </Descriptions.Item>

                  <Descriptions.Item label="Tạo lúc">
                    {formatDateTime(record?.bookingCreatedAt)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Cập nhật lúc">
                    {formatDateTime(record?.bookingUpdatedAt)}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label="Mục tiêu"
                    span={screens.lg ? 3 : screens.md ? 2 : 1}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {record?.campaignObjective ?? "--"}
                    </Text>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label="Mô tả"
                    span={screens.lg ? 3 : screens.md ? 2 : 1}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {record?.description ?? "--"}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* ========= Card hiển thị Livestream Metrics (giống Single) ========= */}
              <Card
                className="shadow-sm"
                bordered={false}
                title={
                  <Space>
                    <BarChart3 size={18} />
                    <span>Chỉ số Livestream</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      onClick={() => refetchMetrics()}
                      loading={isMetricsFetching}
                      disabled={!selectedWorktimeId}
                    >
                      Làm mới số liệu
                    </Button>

                    {canInputMetrics && (
                      <Button type="primary" onClick={handleOpenMetrics}>
                        Nhập số liệu
                      </Button>
                    )}
                  </Space>
                }
              >
                {!selectedWorktimeId ? (
                  <Alert
                    type="info"
                    showIcon
                    message="Chưa có ca livestream được chọn."
                  />
                ) : isBadRequest(metricsError) ? (
                  <Empty description="Chưa có số liệu. Hãy nhấn 'Nhập số liệu' để lưu trước." />
                ) : metricsError ? (
                  <Alert
                    type="error"
                    showIcon
                    message="Không tải được số liệu livestream."
                    description={String(metricsError?.message || "")}
                  />
                ) : (
                  <Skeleton
                    loading={isMetricsLoading}
                    active
                    paragraph={{ rows: 6 }}
                  >
                    {metrics ? (
                      <>
                        {selectedWorktime && (
                          <div className="mb-3">
                            <Text type="secondary">
                              Ca:&nbsp;
                              <Text strong>
                                {selectedWorktime?.startAt
                                  ? dayjs(selectedWorktime.startAt).format(
                                      "HH:mm"
                                    )
                                  : "--"}
                                –
                                {selectedWorktime?.endAt
                                  ? dayjs(selectedWorktime.endAt).format(
                                      "HH:mm"
                                    )
                                  : "--"}
                                {" • "}
                                {selectedWorktime?.startAt
                                  ? dayjs(selectedWorktime.startAt).format(
                                      "DD/MM/YYYY"
                                    )
                                  : "--"}
                              </Text>
                            </Text>
                          </div>
                        )}

                        <Descriptions
                          bordered
                          size="middle"
                          column={screens.lg ? 3 : screens.md ? 2 : 1}
                          labelStyle={{ width: 220 }}
                          contentStyle={descContentStyle}
                        >
                          {METRIC_FIELDS.map(({ key, label, fmt }) => (
                            <Descriptions.Item key={key} label={label}>
                              {fmt(metrics?.[key])}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </>
                    ) : (
                      <Empty description="Chưa có số liệu báo cáo cho phiên livestream." />
                    )}
                  </Skeleton>
                )}
              </Card>

              <LivestreamMetricModal
                open={metricsOpen}
                onClose={() => setMetricsOpen(false)}
                worktimes={worktimes}
                defaultWorktimeId={selectedWorktimeId}
                submitting={isSubmitting}
                onSubmit={handleSubmitMetrics}
              />
            </>
          )}
        </Skeleton>
      )}
    </div>
  );
}
