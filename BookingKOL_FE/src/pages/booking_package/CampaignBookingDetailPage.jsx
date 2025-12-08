import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
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
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import ContractTermsDialog from "../../components/home/booking/ContractTermsDialog";
import { useGetCampaignBookingDetail } from "../../hook/booking_package/useGetCampaignBookingDetail";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../constants/mySingleBookingStatuses";
import {
  completeUserWorkTime,
  getUserBookingStatus,
  initiateCampaignPayment,
} from "../../services/booking/BookingServices";
import { useGetWorktimeLivestreamMetrics } from "../../hook/user/booking/useGetWorktimeLivestreamMetrics";
import { useConfirmMyWorktimeLivestreamMetrics } from "../../hook/user/booking/useConfirmMyWorktimeLivestreamMetrics";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined) return "--";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const composeCampaignDuration = (start, end) => {
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start, "DD/MM/YYYY");
  const endLabel = formatDateTime(end, "DD/MM/YYYY");
  if (startLabel === "--") return endLabel;
  if (endLabel === "--") return startLabel;
  if (dayjs(start).isValid() && dayjs(start).isSame(end, "day")) {
    return startLabel;
  }
  return `${startLabel} → ${endLabel}`;
};

const resolveStatusMeta = (status) => {
  const normalized = status?.toUpperCase();
  return {
    label: BOOKING_STATUS_LABEL[normalized] ?? normalized ?? "--",
    color: STATUS_TAG_COLOR[normalized] ?? "default",
  };
};

const extractNames = (items) =>
  Array.isArray(items)
    ? items
        .map((entry) => entry?.displayName)
        .filter((name) => typeof name === "string" && name.trim().length > 0)
    : [];

const extractUrlsFromText = (text) => {
  if (typeof text !== "string" || !text.length) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  const normalized = matches.map((url) => url.replace(/[),.]+$/, ""));
  return Array.from(new Set(normalized));
};

const resolveBookingRequestId = (request) => {
  if (!request) return null;
  const candidates = [
    request?.bookingRequestId,
    request?.id,
    request?.bookingRequest?.id,
    request?.bookingNumber,
    request?.bookingId,
  ];
  const firstValue = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  return firstValue ?? null;
};

const resolveWorkTimeId = (workTime) =>
  workTime?.id ??
  workTime?.workTimeId ??
  workTime?.work_time_id ??
  workTime?.availabilityId ??
  null;

const composeWorktimeDuration = (workTime) => {
  const start = workTime?.startAt ?? workTime?.startTime;
  const end = workTime?.endAt ?? workTime?.endTime;
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  if (startLabel === "--") return endLabel;
  if (endLabel === "--") return startLabel;
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

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "--";
  return value ? "Yes" : "No";
};

const formatLivestreamMetricValue = (key, value) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (key === "revenue" || key === "avgOrderValue") {
    return formatCurrency(value);
  }

  if (key === "isConfirmed") {
    return formatBoolean(value);
  }

  if (key === "createdAt" || key === "confirmedAt") {
    return formatDateTime(value);
  }

  return value;
};

const isMissingLivestreamMetricError = (error) => {
  const response = error?.response;
  if (!response) {
    return false;
  }

  const { status, data } = response;
  if (![400, 404].includes(status)) {
    return false;
  }

  const rawMessage = data?.message;
  const messages = Array.isArray(rawMessage)
    ? rawMessage
    : typeof rawMessage === "string"
    ? [rawMessage]
    : [];

  const normalizedMessages = messages
    .filter((message) => typeof message === "string")
    .map((message) => message.toLowerCase());

  const keywords = ["livestream metric", "không tìm thấy", "not found"];
  const hasMissingMetricMessage = normalizedMessages.some((message) =>
    keywords.some((keyword) => message.includes(keyword))
  );

  const hasDataProperty = Object.prototype.hasOwnProperty.call(
    data ?? {},
    "data"
  );
  const isEmptyPayload = hasDataProperty && data?.data === null;

  if (hasMissingMetricMessage) {
    return true;
  }

  if (isEmptyPayload && normalizedMessages.length === 0) {
    return true;
  }

  return false;
};

const CampaignBookingDetailPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const screens = useBreakpoint();
  const [contractPreview, setContractPreview] = useState(null);
  const [initiatingScheduleId, setInitiatingScheduleId] = useState(null);
  const [completingWorkTimeId, setCompletingWorkTimeId] = useState(null);
  const [confirmingWorktimeId, setConfirmingWorktimeId] = useState(null);
  const initiatePaymentMutation = useMutation({
    mutationFn: ({ paymentScheduleId }) =>
      initiateCampaignPayment(paymentScheduleId),
  });
  const completeWorkTimeMutation = useMutation({
    mutationFn: ({ workTimeId }) => completeUserWorkTime(workTimeId),
  });

  const {
    isGettingCampaignDetail,
    isFetchingCampaignDetail,
    campaignDetailError,
    campaignDetailResponse,
    refetchCampaignDetail,
  } = useGetCampaignBookingDetail(campaignId);

  const detail = campaignDetailResponse?.data;

  const statusMeta = useMemo(
    () => resolveStatusMeta(detail?.status),
    [detail?.status]
  );

  const initialKolNames = useMemo(
    () => extractNames(detail?.campaignKols),
    [detail?.campaignKols]
  );
  const initialLiveNames = useMemo(
    () => extractNames(detail?.campaignLives),
    [detail?.campaignLives]
  );

  const bookingRequests = useMemo(
    () =>
      Array.isArray(detail?.bookingRequests) ? detail.bookingRequests : [],
    [detail?.bookingRequests]
  );

  const bookingStatusQueries = useQueries({
    queries: bookingRequests.map((request) => {
      const requestId = resolveBookingRequestId(request);
      return {
        queryKey: ["booking-request-status", requestId],
        queryFn: () => getUserBookingStatus(requestId),
        enabled: Boolean(requestId),
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      };
    }),
  });

  const bookingStatusMap = useMemo(() => {
    const map = new Map();
    bookingRequests.forEach((request, index) => {
      const requestId = resolveBookingRequestId(request);
      if (!requestId) return;
      const query = bookingStatusQueries[index];
      if (!query) return;
      map.set(requestId, {
        ...query,
        statusData: query?.data?.data ?? query?.data ?? null,
      });
    });
    return map;
  }, [bookingRequests, bookingStatusQueries]);

  const worktimeIds = useMemo(() => {
    const ids = [];
    const seen = new Set();

    bookingStatusQueries.forEach((query) => {
      const workTimes = Array.isArray(query?.data?.data?.workTimes)
        ? query.data.data.workTimes
        : Array.isArray(query?.data?.workTimes)
        ? query.data.workTimes
        : [];

      workTimes.forEach((workTime) => {
        const id = resolveWorkTimeId(workTime);

        if (id !== null && id !== undefined) {
          const normalized = String(id).trim();

          if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            ids.push(id);
          }
        }
      });
    });

    return ids;
  }, [bookingStatusQueries]);

  const {
    worktimeLivestreamMetricsMap,
    worktimeLivestreamMetricQueries,
    resolvedWorktimeIds,
    isLoadingWorktimeLivestreamMetrics,
    isFetchingWorktimeLivestreamMetrics,
  } = useGetWorktimeLivestreamMetrics(worktimeIds, {
    enabled: worktimeIds.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const findMetricQueryByWorktimeId = useCallback(
    (worktimeId) => {
      if (worktimeId === null || worktimeId === undefined) {
        return null;
      }
      const normalized = String(worktimeId);
      const index = resolvedWorktimeIds.findIndex(
        (id) => String(id) === normalized
      );
      return index >= 0 ? worktimeLivestreamMetricQueries[index] : null;
    },
    [resolvedWorktimeIds, worktimeLivestreamMetricQueries]
  );

  const {
    isConfirmingWorktimeLivestreamMetrics,
    handleConfirmWorktimeLivestreamMetrics,
  } = useConfirmMyWorktimeLivestreamMetrics();

  const isInitialLoading = isGettingCampaignDetail && !detail;

  const handleBack = useCallback(() => {
    navigate("/don-booking-chien-dich");
  }, [navigate]);

  const handleRefreshAll = useCallback(() => {
    refetchCampaignDetail();
    bookingStatusQueries.forEach((query) => {
      if (typeof query?.refetch === "function") {
        query.refetch();
      }
    });
  }, [bookingStatusQueries, refetchCampaignDetail]);

  const handleOpenContractPreview = useCallback((request) => {
    if (!request) return;
    const normalizedStatus =
      typeof request?.contractStatus === "string"
        ? request.contractStatus.toUpperCase()
        : request?.contractStatus;

    const collectedLinks = [];
    if (Array.isArray(request?.termLinks)) {
      collectedLinks.push(
        ...request.termLinks.filter(
          (url) => typeof url === "string" && url.trim().length > 0
        )
      );
    }
    const contractFileUrls = extractUrlsFromText(
      request?.contractFileUrl ?? ""
    );
    if (contractFileUrls.length) {
      collectedLinks.push(...contractFileUrls);
    }
    const descriptionUrls = extractUrlsFromText(request?.description ?? "");
    const uniqueLinks =
      collectedLinks.length > 0
        ? Array.from(new Set(collectedLinks))
        : descriptionUrls;

    if (!uniqueLinks || uniqueLinks.length === 0) {
      return;
    }

    const normalizedContract = {
      id: request?.contractId ?? request?.id ?? request?.bookingNumber,
      contractNumber: request?.contractNumber,
      requestNumber: request?.bookingNumber,
      status: normalizedStatus,
      amount:
        typeof request?.contractAmount === "number"
          ? request.contractAmount
          : undefined,
      termLinks: uniqueLinks,
      terms: request?.description ?? "",
    };

    setContractPreview(normalizedContract);
  }, []);

  const handleCloseContractPreview = useCallback(() => {
    setContractPreview(null);
  }, []);

  const handleInitiatePayment = useCallback(
    async (schedule, request) => {
      if (!schedule?.id) {
        toast.error("Không tìm thấy đợt thanh toán hợp lệ.");
        return;
      }

      try {
        setInitiatingScheduleId(schedule.id);
        const response = await initiatePaymentMutation.mutateAsync({
          paymentScheduleId: schedule.id,
        });

        const paymentData = response?.data ?? response ?? null;
        if (!paymentData) {
          throw new Error("Không nhận được thông tin thanh toán.");
        }

        const normalizedPayment = {
          ...paymentData,
          contractPaymentScheduleId:
            paymentData.contractPaymentScheduleId ??
            paymentData.contractPaymentScheduleID ??
            schedule.id,
          installmentNumber:
            paymentData.installmentNumber ?? schedule?.installmentNumber,
          amount: paymentData.amount ?? schedule?.amount,
          campaignId: detail?.id ?? paymentData?.campaignId,
          campaignName: detail?.name ?? paymentData?.campaignName,
        };

        navigate("/don-booking-chien-dich/thanh-toan", {
          state: {
            payment: normalizedPayment,
            campaign: detail,
            bookingRequest: request,
            paymentSchedule: schedule,
          },
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ??
          error?.message ??
          "Không thể khởi tạo thanh toán cho đợt này.";
        toast.error(message);
      } finally {
        setInitiatingScheduleId(null);
      }
    },
    [detail, initiatePaymentMutation, navigate]
  );

  const handleCompleteWorkTime = useCallback(
    async ({ workTimeId, bookingRequestId }) => {
      if (!workTimeId) {
        toast.error("Không tìm thấy ca công việc hợp lệ.");
        return;
      }

      try {
        setCompletingWorkTimeId(workTimeId);
        await completeWorkTimeMutation.mutateAsync({ workTimeId });
        if (bookingRequestId) {
          queryClient.invalidateQueries({
            queryKey: ["booking-request-status", bookingRequestId],
          });
        }
        refetchCampaignDetail();
      } catch (error) {
        //
      } finally {
        setCompletingWorkTimeId(null);
      }
    },
    [completeWorkTimeMutation, queryClient, refetchCampaignDetail]
  );

  const handleConfirmMetrics = useCallback(
    async (worktimeId, query) => {
      if (worktimeId === null || worktimeId === undefined) return;
      setConfirmingWorktimeId(worktimeId);
      try {
        await handleConfirmWorktimeLivestreamMetrics(worktimeId);
        if (query?.refetch) {
          await query.refetch();
        }
        await refetchCampaignDetail();
      } catch (error) {
        //
      } finally {
        setConfirmingWorktimeId(null);
      }
    },
    [handleConfirmWorktimeLivestreamMetrics, refetchCampaignDetail]
  );

  const renderNameList = (names, emptyLabel) =>
    names.length ? (
      <div className="mt-3 flex flex-wrap gap-2">
        {names.map((name) => (
          <span
            key={name}
            className="rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700 shadow-sm"
          >
            {name}
          </span>
        ))}
      </div>
    ) : (
      <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
    );

  const renderPaymentSchedules = (schedules = [], parentRequest = null) => {
    if (!schedules.length) return null;

    const normalizedSchedules = schedules.map((schedule) => {
      const normalizedStatus =
        typeof schedule?.status === "string"
          ? schedule.status.toUpperCase()
          : schedule?.status;
      const statusMeta = resolveStatusMeta(normalizedStatus);
      const paymentStatus = schedule?.transactionStatus
        ? schedule.transactionStatus.toUpperCase()
        : null;
      const isSchedulePaid =
        normalizedStatus === "PAID" ||
        paymentStatus === "PAID" ||
        paymentStatus === "COMPLETED";
      const canInitiateBase =
        !isSchedulePaid &&
        normalizedStatus === "PENDING" &&
        (paymentStatus === null ||
          ["PENDING", "FAILED", "CANCELLED", "UNDERPAID"].includes(
            paymentStatus
          ));

      return {
        schedule,
        statusMeta,
        paymentStatus,
        isSchedulePaid,
        canInitiateBase,
      };
    });

    const nextPayableScheduleId = (() => {
      const candidates = normalizedSchedules
        .filter((entry) => entry.canInitiateBase)
        .sort((a, b) => {
          const aNumber = Number(a.schedule?.installmentNumber);
          const bNumber = Number(b.schedule?.installmentNumber);
          const aIsValid = Number.isFinite(aNumber);
          const bIsValid = Number.isFinite(bNumber);
          if (aIsValid && bIsValid) return aNumber - bNumber;
          if (aIsValid) return -1;
          if (bIsValid) return 1;
          return 0;
        });

      const nextSchedule = candidates[0]?.schedule;
      return (
        nextSchedule?.id ?? nextSchedule?.contractPaymentScheduleId ?? null
      );
    })();

    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Sparkles size={16} />
          {/* Tiêu đề box */}
          <span>Tiến độ thanh toán</span>
          {/* hoặc: <span>Lịch thanh toán</span> */}
        </div>
        <div className="space-y-3">
          {normalizedSchedules.map(
            ({ schedule, statusMeta, paymentStatus, canInitiateBase }) => {
              const isProcessingPayment =
                initiatingScheduleId ===
                (schedule?.id ?? schedule?.contractPaymentScheduleId);
              const canInitiatePayment =
                canInitiateBase &&
                (schedule?.id ?? schedule?.contractPaymentScheduleId) ===
                  nextPayableScheduleId;

              return (
                <div
                  key={schedule?.id ?? schedule?.installmentNumber}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Đợt thanh toán */}
                    <span className="font-semibold text-slate-900">
                      Đợt {schedule?.installmentNumber ?? "--"}
                    </span>

                    {/* Trạng thái lịch thanh toán */}
                    <Tag
                      color={statusMeta.color}
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      {statusMeta.label}
                    </Tag>

                    {/* Trạng thái giao dịch thanh toán */}
                    {paymentStatus ? (
                      <Tag
                        color={PAYMENT_STATUS_COLOR[paymentStatus] ?? "blue"}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus}
                      </Tag>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Số tiền
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatCurrency(schedule?.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Hạn thanh toán
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatDateTime(schedule?.dueDate, "DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>

                  {canInitiatePayment ? (
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="primary"
                        icon={<Sparkles size={16} />}
                        loading={isProcessingPayment}
                        className="!h-10 !rounded-xl !px-5 font-semibold"
                        onClick={() =>
                          handleInitiatePayment(schedule, parentRequest)
                        }
                      >
                        Thanh toán đợt này
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  const renderWorkTimes = (request) => {
    const bookingRequestId = resolveBookingRequestId(request);
    if (!bookingRequestId) return null;

    const statusEntry = bookingStatusMap.get(bookingRequestId);
    const isStatusLoading =
      statusEntry?.isPending || statusEntry?.isLoading || false;
    const isStatusFetching = statusEntry?.isFetching || false;
    const statusError = statusEntry?.error;
    const statusData = statusEntry?.statusData;
    const workTimes = Array.isArray(statusData?.workTimes)
      ? statusData.workTimes
      : [];

    const renderContent = () => {
      // Lỗi lấy trạng thái công việc
      if (statusError) {
        return (
          <Alert
            type="error"
            showIcon
            message="Không thể tải trạng thái công việc"
            description={statusError?.message}
            className="rounded-xl border border-red-200/60 bg-white/90"
          />
        );
      }

      // Đang tải lần đầu, chưa có dữ liệu
      if (isStatusLoading && !workTimes.length) {
        return <Skeleton active paragraph={{ rows: 3 }} />;
      }

      // Không có ca công việc
      if (!workTimes.length) {
        return (
          <p className="text-sm text-slate-500">
            Chưa có ca công việc nào cho booking này.
          </p>
        );
      }

      return (
        <div className="space-y-3">
          {workTimes.map((workTime) => {
            const workTimeId = resolveWorkTimeId(workTime);
            const workTimeStatus =
              typeof workTime?.status === "string"
                ? workTime.status.toUpperCase()
                : workTime?.status;
            const statusMeta = resolveStatusMeta(workTimeStatus);
            const canComplete =
              workTimeId &&
              workTimeStatus &&
              !["COMPLETED", "CANCELLED"].includes(workTimeStatus);
            const isCompleting =
              completingWorkTimeId === workTimeId &&
              completeWorkTimeMutation?.isPending;

            return (
              <div
                key={workTimeId ?? workTime?.startAt ?? workTime?.startTime}
                className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    Ca công việc
                  </span>
                  <Tag
                    color={statusMeta.color}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {statusMeta.label}
                  </Tag>
                  {workTime?.kolName ? (
                    <span className="text-xs text-slate-500">
                      Host: {workTime.kolName}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Thời gian
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {composeWorktimeDuration(workTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Ghi chú
                    </p>
                    <p className="mt-1 text-slate-900">
                      {workTime?.note ?? "--"}
                    </p>
                  </div>
                </div>

                {canComplete ? (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="primary"
                      loading={isCompleting}
                      className="!h-9 !rounded-lg !px-4 text-sm font-semibold"
                      onClick={() =>
                        handleCompleteWorkTime({
                          workTimeId,
                          bookingRequestId,
                        })
                      }
                    >
                      Hoàn tất công việc
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarRange size={16} />
          <span>Tiến trình công việc</span>
          {isStatusFetching ? (
            <Tag color="processing" className="rounded-full px-3 py-1 text-xs">
              Đang cập nhật
            </Tag>
          ) : null}
        </div>
        {renderContent()}
      </div>
    );
  };

  const renderLivestreamMetrics = (request) => {
    const bookingRequestId = resolveBookingRequestId(request);
    if (!bookingRequestId) return null;

    const statusEntry = bookingStatusMap.get(bookingRequestId);
    const isStatusLoading =
      statusEntry?.isPending || statusEntry?.isLoading || false;
    const statusError = statusEntry?.error;
    const statusData = statusEntry?.statusData;
    const workTimes = Array.isArray(statusData?.workTimes)
      ? statusData.workTimes
      : [];

    const renderMetricContent = () => {
      if (statusError) {
        return (
          <Alert
            type="error"
            showIcon
            message="KhA'ng th ¯Ÿ t §œi ca livestream"
            description={statusError?.message}
            className="rounded-xl border border-red-200/60 bg-white/90"
          />
        );
      }

      if (isStatusLoading && !workTimes.length) {
        return <Skeleton active paragraph={{ rows: 3 }} />;
      }

      if (!workTimes.length) {
        return <Empty description="Ch’øa cA3 ca livestream nAÿo" />;
      }

      return (
        <Space direction="vertical" size="middle" className="w-full">
          {workTimes.map((workTime) => {
            const workTimeId = resolveWorkTimeId(workTime);
            const metrics =
              (worktimeLivestreamMetricsMap.get(workTimeId) ?? null) || null;
            const queryState = findMetricQueryByWorktimeId(workTimeId);
            const metricsError = queryState?.error;
            const errorMessage =
              metricsError?.response?.data?.message ?? metricsError?.message;
            const isMetricsMissing =
              metricsError && isMissingLivestreamMetricError(metricsError);
            const normalizedMetrics = isMetricsMissing ? null : metrics;
            const isMetricsLoading =
              !!(queryState?.isPending || queryState?.isFetching) ||
              (!queryState &&
                (isLoadingWorktimeLivestreamMetrics ||
                  isFetchingWorktimeLivestreamMetrics));
            const shouldShowMetricsError = Boolean(
              metricsError && !isMetricsMissing
            );
            const isButtonLoading =
              confirmingWorktimeId === workTimeId &&
              isConfirmingWorktimeLivestreamMetrics;
            const showConfirmTag =
              typeof normalizedMetrics?.isConfirmed === "boolean";
            const isConfirmedValue = showConfirmTag
              ? normalizedMetrics.isConfirmed
              : Boolean(normalizedMetrics?.confirmedAt);

            return (
              <div
                key={workTimeId ?? workTime?.startAt ?? workTime?.startTime}
                className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span className="text-sm font-semibold text-slate-900">
                      Ca livestream {workTimeId ?? ""}
                    </span>
                  </div>
                  <Space size="small" wrap>
                    {showConfirmTag ? (
                      <Tag color={isConfirmedValue ? "green" : "orange"}>
                        {isConfirmedValue ? "Đã xác nhận" : "Chưa xác nhận"}
                      </Tag>
                    ) : null}
                    {normalizedMetrics?.confirmedAt ? (
                      <Text type="secondary">
                        Xác nhận lúc:{" "}
                        {formatDateTime(normalizedMetrics.confirmedAt)}
                      </Text>
                    ) : null}
                  </Space>
                </div>

                {isMetricsLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : shouldShowMetricsError ? (
                  <Alert
                    type="error"
                    showIcon
                    message="Không thể tải thống kê livestream"
                    description={
                      errorMessage ? String(errorMessage) : undefined
                    }
                  />
                ) : normalizedMetrics ? (
                  <>
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 220 }}
                    >
                      {LIVESTREAM_METRIC_LABELS.map(({ key, label }) => (
                        <Descriptions.Item key={key} label={label}>
                          {formatLivestreamMetricValue(
                            key,
                            normalizedMetrics?.[key]
                          )}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Space size="small" wrap>
                        {normalizedMetrics?.createdAt ? (
                          <Text type="secondary">
                            Cập nhật lúc:{" "}
                            {formatDateTime(normalizedMetrics.createdAt)}
                          </Text>
                        ) : null}
                        {normalizedMetrics?.confirmedAt ? (
                          <Text type="secondary">
                            Xác nhận lúc:{" "}
                            {formatDateTime(normalizedMetrics.confirmedAt)}
                          </Text>
                        ) : null}
                      </Space>
                      {normalizedMetrics?.confirmedAt === null ? (
                        <Button
                          type="primary"
                          ghost
                          onClick={() =>
                            handleConfirmMetrics(workTimeId, queryState)
                          }
                          loading={isButtonLoading}
                          disabled={
                            isButtonLoading ||
                            isMetricsLoading ||
                            !normalizedMetrics ||
                            workTimeId === null ||
                            workTimeId === undefined
                          }
                        >
                          Xác nhận thống kê
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <Empty description="Chưa có thống kê livestream" />
                )}
              </div>
            );
          })}
        </Space>
      );
    };

    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Sparkles size={16} />
          <span>Thống kê livestream</span>
        </div>
        {renderMetricContent()}
      </div>
    );
  };

  const renderBookingRequestCard = (request) => {
    const requestStatus = resolveStatusMeta(request?.status);
    const contractStatus =
      typeof request?.contractStatus === "string"
        ? request.contractStatus.toUpperCase()
        : request?.contractStatus;
    const negotiatedKolNames = extractNames(request?.kols);
    const negotiatedLiveNames = extractNames(request?.lives);
    const canPreviewContract =
      (typeof request?.contractFileUrl === "string" &&
        request.contractFileUrl.trim().length > 0) ||
      (Array.isArray(request?.termLinks) && request.termLinks.length > 0);

    return (
      <Card
        key={request?.id}
        className="rounded-3xl border border-white/50 bg-white/95 shadow-[0_45px_90px_-55px_rgba(79,70,229,0.4)]"
        bodyStyle={{ padding: "1.5rem" }}
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Booking #{request?.bookingNumber ?? "--"}
            </p> */}
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              {request?.campaignName ?? detail?.name ?? "--"}
            </h3>
            <p className="text-xs text-slate-500">
              Tạo lúc {formatDateTime(request?.createdAt)}
            </p>
          </div>
          <Tag
            color={requestStatus.color}
            className="self-start rounded-full px-4 py-1 text-base font-semibold"
          >
            {requestStatus.label}
          </Tag>
        </div>

        <div className="mt-4 grid gap-6 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Mục tiêu dự án
            </p>
            <p className="mt-1 text-base text-slate-900">
              {detail?.objective ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Thời gian thực hiện
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {composeCampaignDuration(request?.startDate, request?.endDate)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Giá trị hợp đồng
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-600">
              {formatCurrency(request?.contractAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Trạng thái hợp đồng
            </p>
            <Tag
              color={STATUS_TAG_COLOR[contractStatus] ?? "default"}
              className="mt-2 rounded-full px-4 py-1 text-sm font-semibold"
            >
              {BOOKING_STATUS_LABEL[contractStatus] ??
                request?.contractStatus ??
                "--"}
            </Tag>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Host chính ưu tiên tham gia
            </p>
            {renderNameList(
              negotiatedKolNames,
              "Chưa cập nhật danh sách Host."
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Trợ Live ưu tiên tham gia
            </p>
            {renderNameList(
              negotiatedLiveNames,
              "Chưa cập nhật danh sách Live."
            )}
          </div>
        </div>

        <div className="mt-6">
          {renderPaymentSchedules(request?.paymentSchedules, request)}
        </div>

        <div className="mt-6">{renderWorkTimes(request)}</div>

        <div className="mt-6">{renderLivestreamMetrics(request)}</div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            icon={<FileText size={16} />}
            className="!h-11 !rounded-xl !border-slate-200 !bg-white !px-5 font-semibold hover:!border-indigo-500/60 hover:!text-indigo-600"
            onClick={() => handleOpenContractPreview(request)}
            disabled={!canPreviewContract}
          >
            Xem hợp đồng
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-purple-300/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={handleBack}
              className="!flex !h-11 !items-center !gap-2 !rounded-xl !border !border-slate-200 !bg-white !font-semibold !text-indigo-600 !shadow-sm transition-all duration-300 hover:!border-indigo-500/60 hover:!bg-indigo-50 hover:!text-indigo-700"
            >
              Trở về danh sách chiến dịch
            </Button>
            <Button
              icon={<RefreshCcw size={16} />}
              onClick={handleRefreshAll}
              loading={isFetchingCampaignDetail}
              className="ml-auto !h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
            >
              Tải lại
            </Button>
          </div>

          <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  <CalendarRange size={16} />
                  <span>Chi tiết chiến dịch</span>
                </div>
                <Title level={3} className="!mt-4 !mb-0 text-slate-900">
                  {detail?.name ?? "--"}
                </Title>
                <p className="mt-2 text-sm text-slate-600">
                  Theo dõi tiến trình triển khai, danh sách Host/Lives và hợp
                  đồng trong chiến dịch của bạn.
                </p>
              </div>
              {detail?.status ? (
                <Tag
                  color={statusMeta.color}
                  className="self-start rounded-full px-4 py-2 text-base font-semibold"
                >
                  {statusMeta.label}
                </Tag>
              ) : null}
            </div>
          </section>

          {campaignDetailError ? (
            <Alert
              type="error"
              showIcon
              message="Không thể tải chi tiết chiến dịch"
              description={campaignDetailError?.message}
              className="rounded-2xl border border-red-200/60 bg-white/90"
            />
          ) : null}

          <Skeleton active loading={isInitialLoading}>
            {detail ? (
              <div className="flex flex-col gap-8">
                <section className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_35px_70px_-45px_rgba(79,70,229,0.35)]">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Thông tin chung
                  </h3>
                  <div className="mt-5 grid gap-6 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Mục tiêu dự án
                      </p>
                      <p className="mt-1 text-base text-slate-900">
                        {detail?.objective ?? "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Ngân sách mục tiêu
                      </p>
                      <p className="mt-1 text-base font-semibold text-emerald-600">
                        {formatCurrency(detail?.targetPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Thời gian triển khai
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {composeCampaignDuration(
                          detail?.startDate,
                          detail?.endDate
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Email người tạo
                      </p>
                      <p className="mt-1 text-base text-slate-900">
                        {detail?.createdByEmail ?? "--"}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_35px_70px_-45px_rgba(79,70,229,0.35)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Danh sách đã chọn ban đầu
                      </h3>
                      <p className="text-sm text-slate-500">
                        Thông tin Host và Live bạn yêu cầu khi tạo chiến dịch.
                      </p>
                    </div>
                    <Users className="text-indigo-500" />
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Host chính
                      </p>
                      {renderNameList(
                        initialKolNames,
                        "Bạn chưa chọn Host nào."
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Trợ Live tham gia
                      </p>
                      {renderNameList(
                        initialLiveNames,
                        "Bạn chưa chọn Live nào."
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_35px_70px_-45px_rgba(79,70,229,0.35)]">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Các đơn booking trong chiến dịch
                    </h3>
                    <p className="text-sm text-slate-500">
                      Danh sách chi tiết các đơn hàng sau khi đàm phán cùng đội
                      ngũ BookingKOL.
                    </p>
                  </div>
                  {bookingRequests.length ? (
                    <div className="space-y-6">
                      {bookingRequests.map((request) =>
                        renderBookingRequestCard(request)
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                      <Sparkles
                        size={32}
                        className="mx-auto mb-3 text-indigo-500"
                      />
                      <p className="text-sm font-medium text-slate-600">
                        Chưa có đơn nào cho chiến dịch này.
                      </p>
                      <p className="text-xs text-slate-500">
                        Khi có kết quả đàm phán, chi tiết sẽ được hiển thị tại
                        đây.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <section className="rounded-3xl border border-white/40 bg-white/95 p-6 text-center shadow-[0_35px_70px_-45px_rgba(79,70,229,0.35)]">
                <Empty
                  description="Không tìm thấy thông tin chiến dịch"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </section>
            )}
          </Skeleton>
        </div>
      </div>

      <ContractTermsDialog
        open={Boolean(contractPreview)}
        contract={contractPreview}
        onClose={handleCloseContractPreview}
        formatCurrency={formatCurrency}
        acknowledgementRequired={false}
      />
    </>
  );
};

export default CampaignBookingDetailPage;
