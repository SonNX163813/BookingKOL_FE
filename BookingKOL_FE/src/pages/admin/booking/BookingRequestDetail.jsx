// src/pages/admin/booking/BookingRequestDetail.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
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
  Tooltip,
  Modal,
  Select,
  Popconfirm,
  message,
  Input, // ✅ add
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  Layers,
  UserCircle2,
  Eye,
  Check,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import ContractTermsDialog from "../../../components/home/booking/ContractTermsDialog";

import { get, patch, post } from "../../../config/axios-config";
import { API_PATHS } from "../../../constants/apiPath";

import { useGetBookingRequestDetail } from "../../../hook/admin/booking/useGetBookingRequestDetail";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../../constants/mySingleBookingStatuses";
import { useGetWorktimeLivestreamMetrics } from "../../../hook/admin/booking/useGetWorktimeLivestreamMetrics";

// ✅ update status booking request
import { adminUpdateSingleBookingRequestStatus } from "../../../services/admin/AdminUpdateSingleBookingRequestStatusAPI";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const MAX_REQUEST_CODE_LEN = 100; // ✅ NEW

/** ✅ 2 option fix cứng (bắt buộc chọn) */
const ADMIN_NOTE_OPTIONS = [
  { value: "Đơn hàng đã thay đổi KOL", label: "Đơn hàng đã thay đổi KOL" },
  { value: "Đơn hàng của bạn đã bị hủy", label: "Đơn hàng của bạn đã bị hủy" },
];

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "--";
  return value ? "Yes" : "No";
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") return "--";
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(numeric) + ` VND`
  );
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const formatArrayOrValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "--";
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
};

const normalizeFileType = (fileType) =>
  fileType && typeof fileType === "string" ? fileType.toUpperCase() : "";

const renderDateTimeCell = (value) => {
  if (!value) return "--";
  return (
    <div className="min-w-[170px] whitespace-nowrap text-[14px] font-medium leading-6">
      {formatDateTime(value, "DD/MM/YYYY HH:mm")}
    </div>
  );
};

/** Cắt chuỗi + tooltip */
const renderEllipsisText = (text, maxLength = 42) => {
  const raw = text ?? "";
  const str = String(raw);
  if (!str) return "--";
  if (str.length <= maxLength) return str;

  const short = `${str.slice(0, maxLength)}...`;
  return (
    <Tooltip title={str}>
      <span>{short}</span>
    </Tooltip>
  );
};

const renderFilePreviewCell = ({ fileType, fileUrl, fileName }) => {
  if (!fileUrl) return "--";
  const normalizedType = normalizeFileType(fileType);
  const displayText = fileName || fileUrl;

  if (normalizedType === "IMAGE") {
    return (
      <Image
        src={fileUrl}
        alt={fileName ?? "image-preview"}
        width={96}
        height={96}
        style={{ objectFit: "cover", borderRadius: 8 }}
        preview={{ mask: "Xem ảnh" }}
      />
    );
  }

  if (normalizedType === "VIDEO") {
    return (
      <Tooltip title={fileUrl}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-500"
        >
          Xem video
        </a>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={fileUrl}>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-500"
      >
        {renderEllipsisText(displayText, 48)}
      </a>
    </Tooltip>
  );
};

const renderImageField = (fileUrl, label) => {
  if (!fileUrl) return "--";
  return (
    <Space direction="vertical" size={8}>
      <Image
        src={fileUrl}
        alt={label ?? "image-preview"}
        width={140}
        height={140}
        style={{ objectFit: "cover", borderRadius: 12 }}
        preview={{ mask: "Xem ảnh" }}
      />
    </Space>
  );
};

const LIVESTREAM_METRIC_LABELS = [
  { key: "revenue", label: "Tổng doanh thu" },
  { key: "gpm", label: "GPM" },
  { key: "avgOrderValue", label: "Giá trị TB mỗi đơn" },
  { key: "totalOrders", label: "Tổng đơn hàng" },
  { key: "buyers", label: "Số người mua" },
  { key: "productsSold", label: "Các mặt hàng được bán" },
  { key: "totalViews", label: "Tổng lượt xem" },
  { key: "liveViewsOver1min", label: "Lượt xem live > 1 phút" },
  { key: "viewsUnder1min", label: "Lượt xem < 1 phút" },
  { key: "pcu", label: "PCU (đồng xem cao nhất)" },
  { key: "avgViewDuration", label: "Thời gian xem TB (giây)" },
  { key: "commentsIn1min", label: "BL trong 1 phút" },
  { key: "totalComments", label: "Tổng bình luận" },
  { key: "productClickRate", label: "Tỷ lệ click SP" },
  { key: "orderConversionRate", label: "Tỷ lệ chuyển đổi đơn" },
];

const formatLivestreamMetricValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "--";
  if (key === "revenue" || key === "avgOrderValue")
    return formatCurrency(value);
  return value;
};

const getFileNameFromUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  } catch (e) {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
};

const extractContractFileUrl = (terms) => {
  if (!terms) return "";
  const raw = typeof terms === "string" ? terms : String(terms);
  const match = raw.match(/https?:\/\/\S+/i);
  return match ? match[0] : raw;
};

const hasAnyLivestreamMetricValue = (metrics) => {
  if (!metrics || typeof metrics !== "object") return false;
  return LIVESTREAM_METRIC_LABELS.some(({ key }) => {
    const v = metrics?.[key];
    return !(v === null || v === undefined || v === "");
  });
};

const hasMeaningfulValue = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.filter(Boolean).length > 0;
  return true;
};

/** ✅ Cancel status -> VI + màu */
const CANCEL_STATUS_META = {
  PENDING: { label: "Chờ duyệt", color: "gold" },
  APPROVED: { label: "Đã duyệt", color: "green" },
  REJECT: { label: "Từ chối", color: "red" },
  REJECTED: { label: "Từ chối", color: "red" },
};

/** ✅ Helper: lấy message BE dễ đọc */
function extractErrorMessage(err) {
  const raw =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;
  if (!raw) return "Có lỗi xảy ra.";
  return Array.isArray(raw) ? raw.join(" | ") : String(raw);
}

/** ✅ GET /v1/requests/cancel/detail/{workTimeId}
 *  - không có yêu cầu hủy -> return null (để ẩn UI, không toast)
 */
async function fetchCancelDetailByWorkTimeId(workTimeId, { signal } = {}) {
  if (!workTimeId) return null;

  try {
    const res = await get({
      url: `/v1/requests/cancel/detail/${encodeURIComponent(workTimeId)}`,
      config: signal ? { signal } : undefined,
      skipToast: true,
    });

    return res?.data?.data ?? res?.data ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const rawMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message;

    const msg = Array.isArray(rawMessage)
      ? rawMessage.join(" | ")
      : String(rawMessage || "");

    const isNoCancel =
      status === 404 ||
      (status === 400 &&
        /không\s*tìm\s*thấy\s+yêu\s*cầu\s+hủy|không\s*tìm\s*thấy\s+yêu\s*cầu\s*hủy\s*ca/i.test(
          msg.toLowerCase()
        ));

    if (isNoCancel) return null;
    throw err;
  }
}

/** ✅ POST /v1/requests/admin/approve/{requestId}?adminNote=...
 *  requestId = cancelRequest.id (id trong cancel detail)
 */
async function adminApproveCancelRequest(
  { requestId, adminNote },
  { signal } = {}
) {
  if (!requestId) throw new Error("requestId is required");

  const note = String(adminNote || "").trim();
  const base = `/v1/requests/admin/approve/${encodeURIComponent(requestId)}`;
  const url = `${base}?adminNote=${encodeURIComponent(note)}`;

  const res = await post({
    url,
    data: null,
    config: signal ? { signal, silent: true } : { silent: true },
    skipToast: true,
  });

  return res?.data ?? null;
}

/** ✅ GET /v1/availabilities/time-line/kol/all?page=&size=&startDate=&endDate=
 *  => query RỘNG (vì BE filter kiểu "slot nằm trọn trong range") rồi FE filter cover
 */
async function fetchKolTimelineAll(
  { page = 0, size = 300, startDate, endDate },
  { signal } = {}
) {
  const base =
    API_PATHS?.SCHEDULER_ADMIN?.kolTimelineAll ||
    "/v1/availabilities/time-line/kol/all";

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("startDate", String(startDate));
  params.set("endDate", String(endDate));

  const url = `${base}?${params.toString()}`;

  const res = await get({
    url,
    config: signal ? { signal, silent: true } : { silent: true },
    skipToast: true,
  });

  const payload = res?.data ?? null;
  const data = payload?.data ?? payload ?? null;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/** ✅ FE filter: slot phải BAO TRÙM ca của đơn */
function filterAvailabilityCoverWorktime(list, workStartISO, workEndISO) {
  const wStart = dayjs(workStartISO).valueOf();
  const wEnd = dayjs(workEndISO).valueOf();

  return (list || []).filter((a) => {
    const st = String(a?.status || "").toUpperCase();
    if (st !== "AVAILABLE") return false;

    const aStart = dayjs(a?.startAt).valueOf();
    const aEnd = dayjs(a?.endAt).valueOf();
    if (!Number.isFinite(aStart) || !Number.isFinite(aEnd)) return false;

    return aStart <= wStart && aEnd >= wEnd;
  });
}

/** ✅ PATCH /v1/admin/booking/single-requests/change-kol
 *  Query: bookingRequestId, kolId, kolAvailabilityId
 */
async function adminChangeKolSingleRequest(
  { bookingRequestId, kolId, kolAvailabilityId },
  { signal } = {}
) {
  if (!bookingRequestId) throw new Error("bookingRequestId is required");
  if (!kolId) throw new Error("kolId is required");
  if (!kolAvailabilityId) throw new Error("kolAvailabilityId is required");

  const base =
    API_PATHS?.BOOKING_REQUEST?.changeKol ||
    "/v1/admin/booking/single-requests/change-kol";

  const url =
    `${base}` +
    `?bookingRequestId=${encodeURIComponent(bookingRequestId)}` +
    `&kolId=${encodeURIComponent(kolId)}` +
    `&kolAvailabilityId=${encodeURIComponent(kolAvailabilityId)}`;

  const res = await patch({
    url,
    data: null,
    config: signal ? { signal, silent: true } : { silent: true },
    skipToast: true,
  });

  return res?.data ?? null;
}

const BookingRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // ✅ NEW: input mã yêu cầu (max 100 + thông báo dưới input)
  const [requestCodeInput, setRequestCodeInput] = useState("");
  const isRequestCodeMax =
    (requestCodeInput || "").length >= MAX_REQUEST_CODE_LEN;

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [selectedCancelWorktimeId, setSelectedCancelWorktimeId] =
    useState(null);

  // ✅ dropdown note (bắt buộc)
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [noteError, setNoteError] = useState(false);

  // ✅ đổi KOL theo availabilityId
  const [openChangeKolModal, setOpenChangeKolModal] = useState(false);
  const [kolOptions, setKolOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const {
    isLoadingBookingRequestDetail,
    isFetchingBookingRequestDetail,
    bookingRequestDetailResponse,
    errorBookingRequestDetail,
    refetchBookingRequestDetail,
  } = useGetBookingRequestDetail(requestId);

  const detail = bookingRequestDetailResponse?.data ?? null;
  const responseTimestamp = bookingRequestDetailResponse?.timestamp ?? null;

  const worktimeIds = useMemo(() => {
    return Array.isArray(detail?.kolWorkTimes)
      ? detail.kolWorkTimes
          .map((worktime) => worktime?.id)
          .filter((id) => id !== null && id !== undefined)
      : [];
  }, [detail?.kolWorkTimes]);

  const {
    worktimeLivestreamMetricsMap,
    worktimeLivestreamMetricQueries,
    resolvedWorktimeIds,
  } = useGetWorktimeLivestreamMetrics(worktimeIds, {
    enabled: worktimeIds.length > 0,
    retry: false,
  });

  const worktimeMetricsQueryMap = useMemo(() => {
    const queryMap = new Map();
    resolvedWorktimeIds.forEach((id, index) => {
      queryMap.set(id, worktimeLivestreamMetricQueries[index]);
    });
    return queryMap;
  }, [resolvedWorktimeIds, worktimeLivestreamMetricQueries]);

  /** ✅ Cancel detail queries */
  const cancelDetailQueries = useQueries({
    queries: worktimeIds.map((id) => ({
      queryKey: ["admin-cancel-detail-by-worktime", id],
      queryFn: ({ signal }) => fetchCancelDetailByWorkTimeId(id, { signal }),
      enabled: !!id && worktimeIds.length > 0,
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const cancelEntries = useMemo(() => {
    return worktimeIds
      .map((id, idx) => {
        const q = cancelDetailQueries?.[idx];
        return {
          worktimeId: id,
          cancel: q?.data ?? null,
          isLoading: q?.isLoading || q?.isFetching,
          refetch: q?.refetch,
        };
      })
      .filter((x) => !!x.cancel);
  }, [worktimeIds, cancelDetailQueries]);

  const isCheckingCancel = useMemo(() => {
    return (
      cancelDetailQueries?.some((q) => q?.isLoading || q?.isFetching) ?? false
    );
  }, [cancelDetailQueries]);

  const hasCancelRequest = cancelEntries.length > 0;

  const isNoteValid = useMemo(() => {
    const v = String(adminNoteDraft || "").trim();
    return ADMIN_NOTE_OPTIONS.some((x) => x.value === v);
  }, [adminNoteDraft]);

  /** chọn cancel đầu tiên để hiển thị trong modal */
  useEffect(() => {
    if (!hasCancelRequest) return;
    if (!selectedCancelWorktimeId) {
      setSelectedCancelWorktimeId(cancelEntries[0].worktimeId);

      const note = cancelEntries[0]?.cancel?.adminNote ?? "";
      const ok = ADMIN_NOTE_OPTIONS.some((x) => x.value === note);
      setAdminNoteDraft(ok ? note : "");
    }
  }, [hasCancelRequest, cancelEntries, selectedCancelWorktimeId]);

  const selectedCancelEntry = useMemo(() => {
    if (!selectedCancelWorktimeId) return null;
    return (
      cancelEntries.find((x) => x.worktimeId === selectedCancelWorktimeId) ||
      null
    );
  }, [cancelEntries, selectedCancelWorktimeId]);

  const selectedWorktime = useMemo(() => {
    const wtId = selectedCancelEntry?.worktimeId;
    if (!wtId) return null;
    return detail?.kolWorkTimes?.find((w) => w?.id === wtId) || null;
  }, [detail?.kolWorkTimes, selectedCancelEntry?.worktimeId]);

  /** ✅ NEW: nếu cancel đã APPROVED thì disable/ẩn thao tác */
  const selectedCancelStatus = useMemo(
    () => normalizeStatus(selectedCancelEntry?.cancel?.status),
    [selectedCancelEntry?.cancel?.status]
  );
  const isCancelApproved = selectedCancelStatus === "APPROVED";
  const handleCloseContractDialog = () => {
    setOpenContractDialog(false);
    setSelectedContract(null);
  };

  /** ✅ Load danh sách availability phù hợp khi mở modal đổi KOL */
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!openChangeKolModal) return;
      if (isCancelApproved) return; // ✅ đã duyệt thì khỏi load

      try {
        setLoadingKols(true);

        const wt = selectedWorktime;
        if (!wt?.startAt || !wt?.endAt) {
          setKolOptions([]);
          return;
        }

        // ✅ query RỘNG để chắc chắn slot dài (15-17) vẫn ra khi ca (15-16)
        const startDate = dayjs(wt.startAt).subtract(12, "hour").toISOString();
        const endDate = dayjs(wt.endAt).add(12, "hour").toISOString();

        const raw = await fetchKolTimelineAll(
          { page: 0, size: 300, startDate, endDate },
          {}
        );

        // ✅ filter cover đúng ca
        let candidates = filterAvailabilityCoverWorktime(
          raw,
          wt.startAt,
          wt.endAt
        );

        // ✅ (tuỳ chọn) loại KOL hiện tại
        const currentKolId = detail?.kol?.id;
        if (currentKolId) {
          candidates = candidates.filter((a) => a?.kolId !== currentKolId);
        }

        const options = candidates.map((a) => ({
          value: a.id, // ✅ kolAvailabilityId
          label: `${a.kolName || a.kolId || "KOL"} • ${dayjs(a.startAt).format(
            "HH:mm"
          )}-${dayjs(a.endAt).format("HH:mm")}`,
          kolId: a.kolId,
          startAt: a.startAt,
          endAt: a.endAt,
        }));

        if (!alive) return;
        setKolOptions(options);
      } catch (e) {
        if (!alive) return;
        message.error(`Không thể tải lịch KOL: ${extractErrorMessage(e)}`);
        setKolOptions([]);
      } finally {
        if (alive) setLoadingKols(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [
    openChangeKolModal,
    selectedWorktime?.startAt,
    selectedWorktime?.endAt,
    detail?.kol?.id,
    isCancelApproved,
  ]);

  const normalizedStatus = normalizeStatus(detail?.status);
  const statusLabel =
    BOOKING_STATUS_LABEL[normalizedStatus] ?? normalizedStatus ?? "--";

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "STT",
        key: "stt",
        width: 70,
        align: "center",
        render: (_v, _r, index) => index + 1,
      },
      {
        title: "Tên tệp",
        key: "fileName",
        render: (_v, record) => {
          const name = record?.file?.fileName ?? record?.fileName;
          const url = record?.file?.fileUrl ?? record?.fileUrl;
          const fallback = url ? getFileNameFromUrl(url) : "";
          return renderEllipsisText(name || fallback || "--", 50);
        },
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_v, record) =>
          renderFilePreviewCell({
            fileType: record?.file?.fileType ?? record?.fileType,
            fileUrl: record?.file?.fileUrl ?? record?.fileUrl,
            fileName: record?.file?.fileName ?? record?.fileName,
          }),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        width: 120,
        render: (_v, record) =>
          record?.file?.fileType ?? record?.fileType ?? "--",
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => formatDateTime(v),
      },
    ],
    []
  );

  const openCancelPopup = useCallback(() => {
    if (!hasCancelRequest) return;
    setOpenCancelModal(true);
    setNoteError(false);
    setSelectedAvailabilityId(null); // reset selection đổi KOL

    const first =
      selectedCancelEntry?.cancel || cancelEntries?.[0]?.cancel || null;

    const note = first?.adminNote ?? "";
    const ok = ADMIN_NOTE_OPTIONS.some((x) => x.value === note);
    setAdminNoteDraft(ok ? note : "");
  }, [hasCancelRequest, selectedCancelEntry?.cancel, cancelEntries]);

  /** ✅ Approve cancel -> notify + update booking status CANCELLED */
  const handleApproveCancel = useCallback(async () => {
    const entry = selectedCancelEntry;
    if (!entry?.cancel) return;

    if (normalizeStatus(entry?.cancel?.status) === "APPROVED") {
      message.info("Yêu cầu đã được duyệt trước đó.");
      return;
    }

    if (!isNoteValid) {
      setNoteError(true);
      message.warning("Vui lòng chọn ghi chú (bắt buộc).");
      return;
    }

    setActionLoading(true);
    try {
      // 1) notify KOL (approve + note)
      await adminApproveCancelRequest({
        requestId: entry.cancel.id,
        adminNote: adminNoteDraft,
      });

      // 2) update booking status => CANCELLED
      await adminUpdateSingleBookingRequestStatus({
        bookingRequestId: detail?.id ?? requestId,
        status: "CANCELLED",
      });

      message.success(
        "Đã chấp nhận yêu cầu hủy và cập nhật trạng thái đơn hàng."
      );

      await Promise.allSettled([
        refetchBookingRequestDetail?.(),
        entry?.refetch?.(),
      ]);
      setOpenCancelModal(false);
    } catch (e) {
      message.error(`Không thể chấp nhận huỷ: ${extractErrorMessage(e)}`);
    } finally {
      setActionLoading(false);
    }
  }, [
    selectedCancelEntry,
    isNoteValid,
    adminNoteDraft,
    detail?.id,
    requestId,
    refetchBookingRequestDetail,
  ]);

  const handleOpenChangeKol = useCallback(() => {
    if (isCancelApproved) {
      message.info("Yêu cầu đã duyệt, không thể đổi KOL.");
      return;
    }
    if (!isNoteValid) {
      setNoteError(true);
      message.warning("Vui lòng chọn ghi chú (bắt buộc) trước khi đổi KOL.");
      return;
    }
    setSelectedAvailabilityId(null);
    setOpenChangeKolModal(true);
  }, [isNoteValid, isCancelApproved]);

  /** ✅ Submit đổi KOL: notify (approve + note) + PATCH change-kol */
  const handleSubmitChangeKol = useCallback(async () => {
    const entry = selectedCancelEntry;
    if (!entry?.cancel) return;

    if (normalizeStatus(entry?.cancel?.status) === "APPROVED") {
      message.info("Yêu cầu đã duyệt, không thể đổi KOL.");
      return;
    }

    if (!isNoteValid) {
      setNoteError(true);
      message.warning("Vui lòng chọn ghi chú (bắt buộc).");
      return;
    }

    if (!selectedAvailabilityId) {
      message.warning("Vui lòng chọn KOL có lịch phù hợp.");
      return;
    }

    const picked = kolOptions.find((o) => o.value === selectedAvailabilityId);
    if (!picked?.kolId) {
      message.error("Không xác định được kolId từ availability đã chọn.");
      return;
    }

    setActionLoading(true);
    try {
      // 1) notify KOL (approve + note)
      await adminApproveCancelRequest({
        requestId: entry.cancel.id,
        adminNote: adminNoteDraft,
      });

      // 2) đổi KOL theo API mới
      await adminChangeKolSingleRequest({
        bookingRequestId: detail?.id ?? requestId,
        kolId: picked.kolId,
        kolAvailabilityId: selectedAvailabilityId,
      });

      message.success("Đã đổi KOL cho đơn hàng.");

      await Promise.allSettled([
        refetchBookingRequestDetail?.(),
        entry?.refetch?.(),
      ]);
      setOpenChangeKolModal(false);
      setOpenCancelModal(false);
    } catch (e) {
      message.error(`Không thể đổi KOL: ${extractErrorMessage(e)}`);
    } finally {
      setActionLoading(false);
    }
  }, [
    selectedCancelEntry,
    isNoteValid,
    adminNoteDraft,
    selectedAvailabilityId,
    kolOptions,
    detail?.id,
    requestId,
    refetchBookingRequestDetail,
  ]);

  // ✅ NEW: nếu có >= 2 ca thì ẩn ca có status CANCELLED (chỉ áp dụng ở phần livestream)
  const worktimesForMetrics = useMemo(() => {
    const list = Array.isArray(detail?.kolWorkTimes) ? detail.kolWorkTimes : [];
    if (list.length <= 1) return list;
    return list.filter((wt) => normalizeStatus(wt?.status) !== "CANCELLED");
  }, [detail?.kolWorkTimes]);

  // ✅ NEW: build card list metrics; nếu ca không có data => return null; nếu tất cả null => hide cả block metrics
  const livestreamWorktimeCards = useMemo(() => {
    const list = worktimesForMetrics || [];
    if (!Array.isArray(list) || list.length === 0) return [];

    return list
      .map((worktime, index) => {
        const worktimeId = worktime?.id;
        if (!worktimeId) return null;

        const metrics = worktimeLivestreamMetricsMap.get(worktimeId) ?? null;
        const queryState = worktimeMetricsQueryMap.get(worktimeId) ?? null;

        const isMetricsLoading =
          queryState?.isPending ||
          queryState?.isFetching ||
          queryState?.isLoading;

        if (isMetricsLoading) {
          return (
            <Card
              key={worktimeId}
              className="mb-4 last:mb-0"
              type="inner"
              title={`Ca làm việc ${index + 1}`}
            >
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          );
        }

        const metricsError = queryState?.error;

        if (metricsError) {
          const rawMessage = metricsError?.response?.data?.message;
          const statusCode = metricsError?.response?.status;

          const messageText = Array.isArray(rawMessage)
            ? rawMessage.filter(Boolean).join(" | ")
            : rawMessage ?? metricsError?.message ?? "";

          const isNoMetricsError =
            !!metricsError &&
            statusCode === 400 &&
            /không tìm thấy\s+livestream\s+metric/i.test(String(messageText));

          if (isNoMetricsError) return null;

          return (
            <Card
              key={worktimeId}
              className="mb-4 last:mb-0"
              type="inner"
              title={`Ca làm việc ${index + 1}`}
            >
              <Alert
                type="error"
                showIcon
                message="Không thể tải thống kê livestream."
                description={messageText ? String(messageText) : undefined}
              />
            </Card>
          );
        }

        if (!metrics || !hasAnyLivestreamMetricValue(metrics)) return null;

        return (
          <Card
            key={worktimeId}
            className="mb-4 last:mb-0"
            type="inner"
            title={`Ca làm việc ${index + 1}`}
          >
            <Divider />
            <Title level={5} className="!mb-2">
              Thống kê chi tiết
            </Title>

            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 200 }}
            >
              {LIVESTREAM_METRIC_LABELS.map(({ key, label }) => (
                <Descriptions.Item key={key} label={label}>
                  {formatLivestreamMetricValue(key, metrics?.[key])}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        );
      })
      .filter(Boolean);
  }, [
    worktimesForMetrics,
    worktimeLivestreamMetricsMap,
    worktimeMetricsQueryMap,
    screens.lg,
    screens.md,
  ]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/admin/management-booking-requests")}
          >
            Quay lại danh sách
          </Button>

          <Button
            icon={<CalendarRange size={16} />}
            onClick={() => refetchBookingRequestDetail()}
            loading={isFetchingBookingRequestDetail}
          >
            Làm mới
          </Button>

          {hasCancelRequest && (
            <Button
              icon={<Eye size={16} />}
              onClick={openCancelPopup}
              className="!bg-amber-600 !text-white !border-none hover:!bg-amber-700"
              loading={isCheckingCancel}
            >
              Xem yêu cầu hủy đơn hàng
            </Button>
          )}
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-1">
            Chi tiết yêu cầu đặt chỗ
          </Title>
          <Text type="secondary">
            Mã yêu cầu:{" "}
            <Text strong>
              {detail?.requestNumber ?? detail?.id ?? requestId ?? "--"}
            </Text>
          </Text>

          {/* ✅ NEW: Input nhập mã yêu cầu (max 100) + thông báo dưới input khi max */}
          <div
            style={{
              marginTop: 8,
              width: 360,
              maxWidth: "100%",
              marginLeft: "auto",
            }}
          >
            {isRequestCodeMax ? (
              <Text
                type="danger"
                style={{ display: "block", marginTop: 4, fontSize: 12 }}
              >
                Đã đạt tối đa {MAX_REQUEST_CODE_LEN} ký tự.
              </Text>
            ) : null}
          </div>
        </div>
      </div>

      {errorBookingRequestDetail ? (
        <Card>
          <Alert
            type="error"
            message="Không thể tải chi tiết yêu cầu đặt chỗ."
            description={String(errorBookingRequestDetail?.message ?? "")}
            showIcon
          />
        </Card>
      ) : (
        <Skeleton
          loading={isLoadingBookingRequestDetail}
          active
          paragraph={{ rows: 6 }}
        >
          {/* --- Thông tin yêu cầu đặt chỗ --- */}
          <Card className="shadow-sm" bordered={false}>
            <Space size="middle" wrap className="justify-between w-full">
              <Space size="middle" wrap>
                <Tag color={STATUS_TAG_COLOR[normalizedStatus] ?? "default"}>
                  {statusLabel}
                </Tag>
              </Space>
              <Space size="small" direction="vertical" className="text-right">
                {responseTimestamp && (
                  <Text type="secondary">
                    Thời gian phản hồi: {formatDateTime(responseTimestamp)}
                  </Text>
                )}
              </Space>
            </Space>

            <Divider />

            <Descriptions
              bordered
              size="middle"
              title={
                <Space>
                  <UserCircle2 size={18} />
                  <span>Thông tin Booking</span>
                </Space>
              }
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Mã yêu cầu">
                {detail?.requestNumber ?? detail?.id ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusLabel}
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

              {hasMeaningfulValue(detail?.updatedAt) && (
                <Descriptions.Item label="Cập nhật lúc">
                  {formatDateTime(detail?.updatedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* --- Thông tin người yêu cầu --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <UserCircle2 size={18} />
                <span>Thông tin người yêu cầu</span>
              </Space>
            }
          >
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.user?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Text copyable>{detail?.user?.email ?? "--"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {detail?.user?.phone ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {detail?.user?.gender === "Male"
                  ? "Nam"
                  : detail?.user?.gender === "Female"
                  ? "Nữ"
                  : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {detail?.user?.address ?? "--"}
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
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.kol?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tên hiển thị">
                {detail?.kol?.displayName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh đại diện" span={screens.lg ? 3 : 1}>
                {renderImageField(
                  detail?.kol?.avatarUrl,
                  detail?.kol?.displayName ?? detail?.kol?.fullName
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {formatDateTime(detail?.kol?.dob, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Tiểu sử" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.bio ?? "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.experience ?? "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thành phố">
                {detail?.kol?.city ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá đặt tối thiểu">
                {formatCurrency(detail?.kol?.minBookingPrice)}
              </Descriptions.Item>
              <Descriptions.Item label="Khả dụng">
                {formatBoolean(detail?.kol?.isAvailable)}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá">
                {detail?.kol?.overallRating ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng phản hồi">
                {detail?.kol?.feedbackCount ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Hợp đồng & Thanh toán --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Hợp đồng & Thanh toán</span>
              </Space>
            }
          >
            {detail?.contracts && detail.contracts.length > 0 ? (
              detail.contracts.map((contract) => {
                const paymentStatus = normalizeStatus(
                  contract?.paymentDTO?.status
                );
                const contractFileUrl = extractContractFileUrl(contract?.terms);
                const contractFileName = contractFileUrl
                  ? getFileNameFromUrl(contractFileUrl)
                  : "";

                const failureReason = contract?.paymentDTO?.failureReason;
                const transactionIds = contract?.paymentDTO?.transactionIds;
                const refundIds = contract?.paymentDTO?.refundIds;

                return (
                  <Card
                    key={
                      contract?.contractNumber ?? contract?.id ?? Math.random()
                    }
                    className="mb-4 last:mb-0"
                    type="inner"
                    title={`Hợp đồng ${
                      contract?.contractNumber ?? contract?.id ?? ""
                    }`}
                  >
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item
                        label="File hợp đồng"
                        span={screens.lg ? 3 : 1}
                      >
                        {contractFileUrl ? (
                          <Space direction="vertical" size={6}>
                            <Button
                              icon={<Eye size={14} />}
                              size="small"
                              onClick={() => {
                                setSelectedContract({
                                  ...contract,
                                  termLinks: contractFileUrl
                                    ? [contractFileUrl]
                                    : [],
                                });
                                setOpenContractDialog(true);
                              }}
                            >
                              Xem Hợp đồng
                            </Button>
                            {/* <a
                              href={contractFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={contractFileName || true}
                              className="text-blue-600 hover:text-blue-500"
                            >
                              {contractFileName || contractFileUrl}
                            </a> */}
                          </Space>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(contract?.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(contract?.updatedAt)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Title level={5} className="!mb-2 flex items-center gap-2">
                      <Layers size={16} /> Thanh toán
                    </Title>

                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item label="Trạng thái">
                        {paymentStatus ? (
                          <Tag
                            color={
                              PAYMENT_STATUS_COLOR[paymentStatus] ?? "default"
                            }
                          >
                            {PAYMENT_STATUS_LABEL[paymentStatus] ??
                              paymentStatus}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tổng tiền">
                        {formatCurrency(contract?.paymentDTO?.totalAmount)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">
                        {formatCurrency(contract?.paymentDTO?.paidAmount)}
                      </Descriptions.Item>

                      {hasMeaningfulValue(failureReason) && (
                        <Descriptions.Item
                          label="Lý do thất bại"
                          span={screens.lg ? 3 : 1}
                        >
                          {String(failureReason)}
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(contract?.paymentDTO?.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(contract?.paymentDTO?.updatedAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Hết hạn lúc">
                        {formatDateTime(contract?.paymentDTO?.expiresAt)}
                      </Descriptions.Item>

                      {hasMeaningfulValue(transactionIds) && (
                        <Descriptions.Item
                          label="Mã giao dịch"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(transactionIds)}
                          </Text>
                        </Descriptions.Item>
                      )}

                      {hasMeaningfulValue(refundIds) && (
                        <Descriptions.Item
                          label="Mã hoàn tiền"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(refundIds)}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                );
              })
            ) : (
              <Empty description="Không có hợp đồng" />
            )}
          </Card>

          {/* --- Livestream Metrics --- */}
          {livestreamWorktimeCards.length > 0 ? (
            <Card
              className="shadow-sm"
              bordered={false}
              title={
                <Space>
                  <Layers size={18} />
                  <span>Thống kê Livestream</span>
                </Space>
              }
            >
              {livestreamWorktimeCards}
            </Card>
          ) : null}

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
            {detail?.attachedFiles && detail.attachedFiles.length > 0 ? (
              <Table
                columns={attachedFileColumns}
                dataSource={detail.attachedFiles}
                rowKey={(record, idx) => record?.id ?? `file-${idx}`}
                pagination={false}
                scroll={{ x: 720 }}
              />
            ) : (
              <Empty description="Không có tệp đính kèm" />
            )}
          </Card>
        </Skeleton>
      )}

      <ContractTermsDialog
        open={openContractDialog}
        contract={selectedContract}
        onClose={handleCloseContractDialog}
        acknowledgementRequired={false}
        formatCurrency={formatCurrency}
      />

      {/* ✅ Modal xem yêu cầu hủy */}
      <Modal
        open={openCancelModal}
        onCancel={() => setOpenCancelModal(false)}
        title="Yêu cầu hủy đơn hàng"
        footer={null}
        width={900}
        destroyOnClose
      >
        {!selectedCancelEntry?.cancel ? (
          <Empty description="Không có dữ liệu yêu cầu hủy" />
        ) : (
          <>
            {cancelEntries.length > 1 && (
              <div className="mb-3">
                <Text strong>Chọn yêu cầu:</Text>
                <Select
                  className="w-full mt-2"
                  value={selectedCancelWorktimeId}
                  onChange={(v) => {
                    setSelectedCancelWorktimeId(v);
                    setSelectedAvailabilityId(null);
                    setNoteError(false);

                    const found = cancelEntries.find((x) => x.worktimeId === v);
                    const note = found?.cancel?.adminNote ?? "";
                    const ok = ADMIN_NOTE_OPTIONS.some((x) => x.value === note);
                    setAdminNoteDraft(ok ? note : "");
                  }}
                  options={cancelEntries.map((x, idx) => ({
                    value: x.worktimeId,
                    label: `Yêu cầu #${idx + 1} - ${
                      x?.cancel?.kolFullName || "KOL"
                    }`,
                  }))}
                />
              </div>
            )}

            <Card
              bordered={false}
              className="shadow-sm"
              title={
                <Space>
                  {selectedCancelEntry?.cancel?.kolAvatar ? (
                    <Image
                      src={selectedCancelEntry.cancel.kolAvatar}
                      width={40}
                      height={40}
                      style={{ borderRadius: 999, objectFit: "cover" }}
                      preview={false}
                    />
                  ) : null}
                  <div className="flex flex-col">
                    <Text strong>
                      {selectedCancelEntry?.cancel?.kolFullName || "KOL"}
                    </Text>
                    {(() => {
                      const st = normalizeStatus(
                        selectedCancelEntry?.cancel?.status
                      );
                      const meta = CANCEL_STATUS_META[st] || {
                        label: st ?? "--",
                        color: "default",
                      };
                      return (
                        <Tag color={meta.color} style={{ marginRight: 0 }}>
                          {meta.label}
                        </Tag>
                      );
                    })()}
                  </div>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    icon={<RefreshCcw size={16} />}
                    onClick={() => selectedCancelEntry?.refetch?.()}
                    loading={selectedCancelEntry?.isLoading}
                  >
                    Làm mới
                  </Button>
                </Space>
              }
            >
              <Descriptions
                bordered
                size="middle"
                column={screens.lg ? 3 : screens.md ? 2 : 1}
                labelStyle={{ width: 180 }}
              >
                <Descriptions.Item
                  label="Lý do"
                  span={screens.lg ? 3 : screens.md ? 2 : 1}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {selectedCancelEntry?.cancel?.reason || "--"}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Tạo lúc">
                  {renderDateTimeCell(selectedCancelEntry?.cancel?.createdAt)}
                </Descriptions.Item>

                {hasMeaningfulValue(
                  selectedCancelEntry?.cancel?.approvedAt
                ) && (
                  <Descriptions.Item label="Duyệt lúc">
                    {renderDateTimeCell(
                      selectedCancelEntry?.cancel?.approvedAt
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {hasMeaningfulValue(selectedCancelEntry?.cancel?.adminNote) && (
                <div className="mt-3">
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    labelStyle={{ width: 180 }}
                  >
                    <Descriptions.Item label="Ghi chú admin">
                      <div className="whitespace-pre-wrap break-words">
                        {String(selectedCancelEntry?.cancel?.adminNote)}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}

              {!isCancelApproved && (
                <>
                  <Divider />

                  <div>
                    <Text strong>
                      Ghi chú admin <Text type="danger">*</Text>
                    </Text>
                    <Select
                      className="w-full mt-2"
                      value={adminNoteDraft || undefined}
                      onChange={(v) => {
                        setAdminNoteDraft(v);
                        setNoteError(false);
                      }}
                      placeholder="Chọn ghi chú (bắt buộc)"
                      options={ADMIN_NOTE_OPTIONS}
                      status={noteError ? "error" : undefined}
                    />
                    {noteError && (
                      <div className="mt-1">
                        <Text type="danger">
                          Vui lòng chọn ghi chú trước khi thực hiện thao tác.
                        </Text>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Divider />

              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => setOpenCancelModal(false)}>Đóng</Button>

                {!isCancelApproved && (
                  <>
                    <Button
                      icon={<Users size={16} />}
                      className="!bg-amber-600 !text-white !border-none hover:!bg-amber-700"
                      onClick={handleOpenChangeKol}
                      disabled={actionLoading}
                    >
                      Đổi KOL cho đơn hàng
                    </Button>

                    <Popconfirm
                      title="Bạn chắc chắn muốn chấp nhận hủy đơn hàng?"
                      okText="Đồng ý"
                      cancelText="Hủy"
                      onConfirm={handleApproveCancel}
                      okButtonProps={{
                        loading: actionLoading,
                        disabled: !isNoteValid,
                      }}
                    >
                      <Button
                        icon={<Check size={16} />}
                        danger
                        type="primary"
                        loading={actionLoading}
                        disabled={!isNoteValid}
                        onClick={() => {
                          if (!isNoteValid) setNoteError(true);
                        }}
                      >
                        Chấp nhận hủy đơn hàng
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </div>
            </Card>
          </>
        )}
      </Modal>

      {/* ✅ Modal đổi KOL */}
      <Modal
        open={openChangeKolModal}
        onCancel={() => setOpenChangeKolModal(false)}
        title="Đổi KOL cho đơn hàng"
        okText="Xác nhận đổi KOL"
        cancelText="Hủy"
        onOk={handleSubmitChangeKol}
        okButtonProps={{
          loading: actionLoading,
          disabled: !selectedAvailabilityId || !isNoteValid,
        }}
        destroyOnClose
      >
        {selectedWorktime?.startAt && selectedWorktime?.endAt && (
          <div className="mb-3 text-sm">
            <Text type="secondary">
              Ca cần thay thế:{" "}
              <b>
                {dayjs(selectedWorktime.startAt).format("HH:mm")} -{" "}
                {dayjs(selectedWorktime.endAt).format("HH:mm")} (
                {dayjs(selectedWorktime.startAt).format("DD/MM/YYYY")})
              </b>
            </Text>
          </div>
        )}

        <Select
          showSearch
          loading={loadingKols}
          placeholder="Chọn KOL có lịch phù hợp"
          className="w-full"
          value={selectedAvailabilityId}
          onChange={setSelectedAvailabilityId}
          optionFilterProp="label"
          options={kolOptions}
          notFoundContent={
            loadingKols ? "Đang tải..." : "Không có KOL nào phù hợp với ca này"
          }
          filterOption={(input, option) =>
            String(option?.label || "")
              .toLowerCase()
              .includes(String(input).toLowerCase())
          }
        />
      </Modal>
    </div>
  );
};

export default BookingRequestDetail;
