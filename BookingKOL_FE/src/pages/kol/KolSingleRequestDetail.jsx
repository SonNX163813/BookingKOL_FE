// src/pages/kol/KolSingleRequestDetail.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
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
  Divider,
  Empty,
  Grid,
  Image,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Modal,
  Input,
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  UserCircle2,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getKolMySingleRequestDetail } from "../../services/kol/KolAPI";
import { createKolLivestreamMetric } from "../../services/kol/LiveMetricAPI";
import { getKolLivestreamMetrics } from "../../services/kol/LiveMetricQueryAPI";
import LivestreamMetricModal from "../../components/kol/kol-metric/LivestreamMetricModal";
import { createKolCancelBookingRequest } from "../../services/kol/KolCancelBookingRequestAPI";
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const { Title, Text, Link } = Typography;
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

/* ===== Booking status ===== */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đang chờ thực hiện", value: "PAID" },
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
const BOOKING_STATUS_MAP = BOOKING_STATUS_OPTIONS.reduce(
  (a, s) => ((a[s.value] = s.label), a),
  {}
);

/* ===== CANCEL STATUS META ===== */
const CANCEL_STATUS_META = {
  PENDING: { label: "Chờ duyệt", color: "gold" },
  APPROVED: { label: "Đã duyệt", color: "green" },
  REJECT: { label: "Từ chối", color: "red" },
  REJECTED: { label: "Từ chối", color: "red" },
};

const formatDateTime = (v, p = "DD/MM/YYYY HH:mm") =>
  v ? dayjs(v).format(p) : "--";
const normalizeStatus = (s) =>
  s && typeof s === "string" ? s.toUpperCase() : s;
const getBookingTypeLabel = (t) =>
  (t ?? "").toString().toUpperCase() === "SINGLE" ? "Book theo giờ" : t ?? "--";

/* Preview file cell */
const renderFilePreviewCell = ({ fileType, fileUrl, fileName }) => {
  if (!fileUrl) return "--";
  const t = (fileType || "").toString().toUpperCase();
  if (t === "IMAGE")
    return (
      <Image
        src={fileUrl}
        alt={fileName ?? "image"}
        width={96}
        height={96}
        style={{ objectFit: "cover", borderRadius: 8 }}
        preview={{ mask: "Xem ảnh" }}
      />
    );
  if (t === "VIDEO")
    return (
      <Link href={fileUrl} target="_blank" rel="noreferrer">
        Xem video
      </Link>
    );
  return (
    <Link href={fileUrl} target="_blank" rel="noreferrer">
      {fileName ?? fileUrl}
    </Link>
  );
};

const renderImageField = (url, label) =>
  !url ? (
    "--"
  ) : (
    <Space direction="vertical" size={8}>
      <Image
        src={url}
        alt={label ?? "image"}
        width={140}
        height={140}
        style={{ objectFit: "cover", borderRadius: 12 }}
        preview={{ mask: "Xem ảnh" }}
      />
    </Space>
  );

/** Helper: lấy worktimes từ nhiều key */
function extractWorktimes(detail) {
  if (!detail) return [];
  const candidates = [detail.kolWorkTimes, detail.workTimes, detail.worktimes];
  for (const c of candidates) if (Array.isArray(c) && c.length) return c;
  return [];
}

/* Format hiển thị metrics */
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

/* ===== Helpers error ===== */
const getHttpStatus = (e) =>
  e?.appStatus || e?.response?.status || e?.status || 0;
const isBadRequest = (e) => getHttpStatus(e) === 400;

const pickErrorMessage = (e) =>
  e?.response?.data?.message || e?.data?.message || e?.message || "";
const isAlreadyRequestedMsg = (txt) => /đã gửi yêu cầu hủy/i.test(txt || "");

/**
 * ✅ GET /v1/requests/cancel/detail/{workTimeId}
 * FIX: Cho phép 404 + 5xx -> không reject -> không bắn toast từ interceptor.
 *      Với 404/5xx coi như "không có cancel detail" => return null.
 */
async function getKolCancelRequestDetail(workTimeId, { signal } = {}) {
  if (!workTimeId) throw new Error("workTimeId is required");

  const builder =
    CLIENT_API_PATHS?.BOOKING?.kolCancelRequestDetail ??
    ((id) => `/v1/requests/cancel/detail/${encodeURIComponent(id)}`);

  const url = typeof builder === "function" ? builder(workTimeId) : builder;

  const res = await get({
    url,
    config: {
      ...(signal ? { signal } : {}),
      validateStatus: (status) =>
        (status >= 200 && status < 300) ||
        status === 404 ||
        (status >= 500 && status < 600),
    },
  });

  if (res?.status === 404) return null;
  if (res?.status >= 500 && res?.status < 600) return null;
  return res?.data ?? null;
}

export default function KolSingleRequestDetail() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  const {
    data: detail,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["kol-single-request-detail", token, requestId],
    queryFn: () => getKolMySingleRequestDetail(requestId),
    enabled: !!requestId && !!token && !authLoading,
    retry: (count, err) => {
      const code = getHttpStatus(err);
      if (code === 404) return false;
      return count < 2;
    },
  });

  const normalizedStatus = normalizeStatus(detail?.status);

  // ✅ chỉ PAID mới được hiện button yêu cầu hủy
  const canRequestCancel = normalizedStatus === "PAID";
  const canInputMetrics = normalizedStatus === "IN_PROGRESS";
  const requestNo = detail?.requestNumber ?? detail?.id ?? requestId ?? "--";

  // kolId lấy từ detail (không hiển thị)
  const kolId = detail?.kol?.id ?? "";

  const worktimes = extractWorktimes(detail);

  // ✅ nếu có >= 2 worktime => ẩn nút yêu cầu hủy
  const hasMultipleWorktimes = (worktimes?.length ?? 0) >= 2;

  const endedWorktime = worktimes.find(
    (w) =>
      normalizeStatus(w?.status) === "IN_PROGRESS" &&
      !!w?.endAt &&
      dayjs().isAfter(dayjs(w.endAt))
  );

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [selectedWorktimeId, setSelectedWorktimeId] = useState("");

  useEffect(() => {
    if (!worktimes?.length) return;
    setSelectedWorktimeId((prev) => {
      if (prev) return prev;
      if (endedWorktime?.id) return endedWorktime.id;
      return worktimes[0]?.id ?? "";
    });
  }, [worktimes, endedWorktime?.id]);

  useEffect(() => {
    if (searchParams.get("metrics") === "1" && canInputMetrics)
      setMetricsOpen(true);
  }, [searchParams, canInputMetrics]);

  /* GET metrics theo worktimeId */
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

  /* GET cancel detail theo workTimeId */
  const {
    data: cancelDetail,
    isLoading: isCancelDetailLoading,
    isFetching: isCancelDetailFetching,
    refetch: refetchCancelDetail,
  } = useQuery({
    queryKey: ["kol-cancel-detail", token, selectedWorktimeId],
    queryFn: () => getKolCancelRequestDetail(selectedWorktimeId),
    enabled: !!token && !!selectedWorktimeId,
    retry: false,
  });

  // ✅ Chỉ hiện card khi thật sự có data (ẩn hoàn toàn khi 404/500/null)
  const showCancelCard = !!cancelDetail;

  /* POST metrics */
  const { mutateAsync: submitMetricsAsync, isLoading: isSubmitting } =
    useMutation({
      mutationFn: async ({ worktimeId, dto }) =>
        createKolLivestreamMetric(worktimeId, dto),
    });

  const handleOpenMetrics = () => {
    if (!canInputMetrics) {
      message.error(
        "Chỉ có thể nhập số liệu khi yêu cầu đang 'Đang thực hiện'."
      );
      return;
    }
    setMetricsOpen(true);
  };

  const handleSubmitMetrics = async (wid, dto) => {
    await submitMetricsAsync({ worktimeId: wid, dto });
    message.success("Đã lưu số liệu livestream.");
    setMetricsOpen(false);
    setSelectedWorktimeId(wid);
    refetch();
    refetchMetrics();
    refetchCancelDetail();
  };

  /* Back button */
  const derivedListPath = useMemo(() => {
    const m = location.pathname.match(/^(.*)\/detail\/[^/]+$/);
    return m?.[1] || "/kol/booking/single-requests";
  }, [location.pathname]);

  const goBackList = () => {
    const backTo = location.state?.backTo;
    if (backTo) {
      navigate(backTo, { replace: true });
      return;
    }
    if (window.history.length > 1) navigate(-1);
    else navigate(derivedListPath, { replace: true });
  };

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "Tên tệp",
        key: "fileName",
        render: (_, r) => r?.file?.fileName ?? "--",
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_, r) =>
          renderFilePreviewCell({
            fileType: r?.file?.fileType,
            fileUrl: r?.file?.fileUrl,
            fileName: r?.file?.fileName,
          }),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Tạo lúc",
        key: "createdAt",
        render: (_, r) => formatDateTime(r?.file?.createdAt),
      },
    ],
    []
  );

  const selectedWorktime = useMemo(
    () => worktimes.find((w) => w?.id === selectedWorktimeId),
    [worktimes, selectedWorktimeId]
  );

  /* =================== CANCEL REQUEST UI/LOGIC =================== */
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { mutateAsync: cancelRequestAsync, isLoading: isCancelling } =
    useMutation({
      mutationFn: async ({ kolId, workTimeId, reason }) =>
        createKolCancelBookingRequest({ kolId, workTimeId, reason }),
    });

  const openCancelModal = () => {
    if (!canRequestCancel) return; // ✅ chỉ PAID mới cho mở
    if ((worktimes?.length ?? 0) >= 2) return; // ✅ có 2 id thì không cho mở

    if (!kolId) return message.error("Không tìm thấy thông tin KOL (kolId).");
    if (!worktimes?.length)
      return message.error("Không tìm thấy ca livestream (workTimeId).");
    setCancelOpen(true);
  };

  const submitCancelRequest = async () => {
    if (isCancelling) return; // ✅ chặn double-click

    try {
      if (!kolId) return message.error("Thiếu kolId.");
      if (!worktimes?.length) return message.error("Thiếu workTimeId.");

      const workTimeId =
        selectedWorktimeId || endedWorktime?.id || worktimes?.[0]?.id || "";

      if (!workTimeId) return message.error("Không xác định được workTimeId.");

      await cancelRequestAsync({
        kolId,
        workTimeId,
        reason: cancelReason,
      });

      message.destroy();
      message.success("Gửi yêu cầu hủy lịch đặt chỗ thành công");

      setCancelOpen(false);
      setCancelReason("");
      setSelectedWorktimeId(workTimeId);

      refetch();
      refetchCancelDetail();
    } catch (e) {
      const backendMsg = pickErrorMessage(e);

      if (isAlreadyRequestedMsg(backendMsg)) {
        message.destroy();
        message.success("Gửi yêu cầu hủy lịch đặt chỗ thành công");
        setCancelOpen(false);
        setCancelReason("");
        refetch();
        refetchCancelDetail();
        return;
      }

      message.error(backendMsg || "Gửi yêu cầu hủy thất bại.");
    }
  };
  /* =================== END CANCEL =================== */

  // ✅ chỉ PAID + chưa có cancelDetail + không có >=2 worktimes
  const canShowCancelButton =
    canRequestCancel && !cancelDetail && !hasMultipleWorktimes;

  // ✅ chống cắt chữ
  const descContentStyle = useMemo(
    () => ({
      whiteSpace: "normal",
      wordBreak: "keep-all",
      overflowWrap: "break-word",
    }),
    []
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button icon={<ArrowLeft size={16} />} onClick={goBackList}>
            Quay lại danh sách
          </Button>

          <Button
            icon={<CalendarRange size={16} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Làm mới
          </Button>

          {canShowCancelButton && (
            <Button danger onClick={openCancelModal} loading={isCancelling}>
              Yêu cầu hủy đơn đặt chỗ
            </Button>
          )}

          {canInputMetrics && (
            <Button
              type="primary"
              icon={<BarChart3 size={16} />}
              onClick={handleOpenMetrics}
            >
              Nhập số liệu livestream
            </Button>
          )}
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-1">
            Chi tiết yêu cầu đặt chỗ
          </Title>
          <Text type="secondary">
            Mã yêu cầu: <Text strong>{requestNo}</Text>
          </Text>
        </div>
      </div>

      {/* ===== Modal yêu cầu hủy đặt chỗ ===== */}
      <Modal
        open={cancelOpen}
        title="Yêu cầu hủy đơn đặt chỗ"
        okText="Gửi yêu cầu"
        cancelText="Đóng"
        onOk={submitCancelRequest}
        onCancel={() => {
          if (isCancelling) return;
          setCancelOpen(false);
        }}
        confirmLoading={isCancelling}
        okButtonProps={{
          danger: true,
          loading: isCancelling,
          disabled: isCancelling,
        }}
        cancelButtonProps={{ disabled: isCancelling }}
        closable={!isCancelling}
        maskClosable={!isCancelling}
        keyboard={!isCancelling}
        destroyOnClose
      >
        <Space direction="vertical" size={10} className="w-full">
          <Text type="secondary">
            Bạn có thể nhập lý do (tuỳ chọn) để Admin xử lý nhanh hơn.
          </Text>

          <Input.TextArea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ví dụ: trùng lịch / có việc đột xuất..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={500}
            showCount
            disabled={isCancelling}
          />
        </Space>
      </Modal>

      {error ? (
        <Card>
          <Alert
            type={error?.appStatus === 404 ? "warning" : "error"}
            message={
              error?.appStatus === 404
                ? "Không tìm thấy yêu cầu đặt lịch"
                : "Không thể tải chi tiết yêu cầu đặt chỗ."
            }
            description={String(error?.message ?? "")}
            showIcon
            action={
              <Button onClick={goBackList} type="primary">
                Về danh sách
              </Button>
            }
          />
        </Card>
      ) : (
        <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
          {canInputMetrics && endedWorktime && !metrics && (
            <Alert
              type="error"
              showIcon
              className="mb-3"
              message={
                <Text type="danger">
                  Ca livestream đã kết thúc lúc{" "}
                  <Text strong>{formatDateTime(endedWorktime.endAt)}</Text>. Vui
                  lòng nhập số liệu livestream để hoàn tất.
                </Text>
              }
            />
          )}

          {!worktimes.length && (
            <Alert
              type="warning"
              showIcon
              className="mb-3"
              message="Không tìm thấy ca livestream trong chi tiết yêu cầu."
            />
          )}

          {/* ✅ Card chi tiết yêu cầu hủy (chỉ hiện khi có data) */}
          {showCancelCard && (
            <Card
              className="shadow-sm"
              bordered={false}
              title={<span>Chi tiết yêu cầu hủy</span>}
              extra={
                <Button
                  onClick={() => refetchCancelDetail()}
                  loading={isCancelDetailFetching}
                  disabled={!selectedWorktimeId}
                >
                  Làm mới
                </Button>
              }
            >
              <Skeleton
                loading={isCancelDetailLoading}
                active
                paragraph={{ rows: 3 }}
              >
                {(() => {
                  const cancelKey = normalizeStatus(cancelDetail?.status);
                  const meta = cancelKey ? CANCEL_STATUS_META[cancelKey] : null;

                  return (
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 220 }}
                      contentStyle={descContentStyle}
                    >
                      <Descriptions.Item label="Trạng thái">
                        {cancelDetail?.status ? (
                          <Tag color={meta?.color ?? "default"}>
                            {meta?.label ?? cancelKey}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Lý do">
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {cancelDetail?.reason ?? "--"}
                        </Text>
                      </Descriptions.Item>

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(cancelDetail?.createdAt)}
                      </Descriptions.Item>

                      {cancelDetail?.approvedAt ? (
                        <Descriptions.Item label="Duyệt lúc">
                          {formatDateTime(cancelDetail.approvedAt)}
                        </Descriptions.Item>
                      ) : null}
                    </Descriptions>
                  );
                })()}
              </Skeleton>
            </Card>
          )}

          {/* --- Thông tin yêu cầu --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <ClipboardList size={18} />
                <span>Thông tin đơn Booking</span>
              </Space>
            }
          >
            <Space size="middle" wrap className="justify-between w-full">
              <Space size="middle" wrap>
                <Tag color={STATUS_TAG_COLOR[normalizedStatus] ?? "default"}>
                  {BOOKING_STATUS_MAP[normalizedStatus] ??
                    normalizedStatus ??
                    "--"}
                </Tag>
                {detail?.bookingType && (
                  <Tag color="blue">
                    {getBookingTypeLabel(detail.bookingType)}
                  </Tag>
                )}
              </Space>
            </Space>
            <Divider />
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
              contentStyle={descContentStyle}
            >
              <Descriptions.Item label="Mã yêu cầu">
                {requestNo}
              </Descriptions.Item>
              <Descriptions.Item label="Loại đặt chỗ">
                {getBookingTypeLabel(detail?.bookingType)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {BOOKING_STATUS_MAP[normalizedStatus] ??
                  normalizedStatus ??
                  "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.description || "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm" span={screens.lg ? 3 : 1}>
                {detail?.location || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Bắt đầu lúc">
                {formatDateTime(detail?.startAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc lúc">
                {formatDateTime(detail?.endAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Thông tin KOL --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <UserCircle2 size={18} />
                <span>Thông tin KOL</span>
              </Space>
            }
          >
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 2 : 1}
              labelStyle={{ width: 150 }}
              contentStyle={descContentStyle}
            >
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.kol?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tên hiển thị">
                {detail?.kol?.displayName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {formatDateTime(detail?.kol?.dob, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Quốc gia">
                {detail?.kol?.country ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Thành phố">
                {detail?.kol?.city ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Tiểu sử" span={screens.lg ? 2 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.bio ?? "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Kinh nghiệm" span={screens.lg ? 2 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.experience ?? "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Ảnh đại diện" span={screens.lg ? 2 : 1}>
                {renderImageField(
                  detail?.kol?.avatarUrl,
                  detail?.kol?.displayName ?? detail?.kol?.fullName
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Tệp đính kèm --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Tệp đính kèm</span>
              </Space>
            }
          >
            {detail?.attachedFiles?.length ? (
              <Table
                columns={attachedFileColumns}
                dataSource={detail.attachedFiles}
                rowKey={(r) => r?.file?.id ?? r?.id ?? Math.random()}
                pagination={false}
                scroll={{ x: 720 }}
              />
            ) : (
              <Empty description="Không có tệp đính kèm" />
            )}
          </Card>

          {/* ========= Card hiển thị Livestream Metrics ========= */}
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
                            {dayjs(selectedWorktime.startAt).format("HH:mm")}–
                            {dayjs(selectedWorktime.endAt).format("HH:mm")} •{" "}
                            {dayjs(selectedWorktime.startAt).format(
                              "DD/MM/YYYY"
                            )}
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
                          {fmt(metrics[key])}
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
        </Skeleton>
      )}
    </div>
  );
}
