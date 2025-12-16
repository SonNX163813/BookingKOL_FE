import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Checkbox,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  Grid,
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  Edit3,
  FileText,
  Layers,
  UserCircle2,
} from "lucide-react";
import { useGetMySingleBookingRequestDetail } from "../../../hook/user/booking/useGetMySingleBookingRequestDetail";
import { UploadOutlined } from "@ant-design/icons";
import { useUpdateMySingleBookingRequest } from "../../../hook/user/booking/useUpdateMySingleBookingRequest";
import UserKolFeedbackSection from "../../../components/home/booking/UserKolFeedbackSection";
import ContractTermsDialog from "../../../components/home/booking/ContractTermsDialog";
import { useGetPlatforms } from "../../../hook/platform/useGetPlatforms";
import { useGetWorktimeLivestreamMetrics } from "../../../hook/user/booking/useGetWorktimeLivestreamMetrics";
import { useConfirmMyWorktimeLivestreamMetrics } from "../../../hook/user/booking/useConfirmMyWorktimeLivestreamMetrics";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../../constants/mySingleBookingStatuses";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const OTHER_PLATFORM_VALUE = "__OTHER_PLATFORM__";

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") =>
  value ? (dayjs(value).isValid() ? dayjs(value).format(pattern) : "--") : "--";

const formatCurrency = (value, currency = "VND") =>
  value
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value)
    : "--";

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatArray = (v) => (Array.isArray(v) && v.length ? v.join(", ") : "--");

const normalizeStatus = (s) =>
  s && typeof s === "string" ? s.toUpperCase() : s;

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "--";
  return value ? "Yes" : "No";
};

const extractUrlsFromText = (text) => {
  if (typeof text !== "string" || !text.length) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  const normalized = matches.map((url) => url.replace(/[),.]+$/, ""));
  return Array.from(new Set(normalized));
};

const normalizeIdValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  try {
    return String(value);
  } catch {
    return null;
  }
};

const resolveContractIdentifier = (contract) =>
  normalizeIdValue(
    contract?.id ??
      contract?.contractId ??
      contract?.contract?.id ??
      contract?.contractDTO?.id
  );

const resolveFeedbackContractIdentifier = (feedback) =>
  normalizeIdValue(
    feedback?.contractId ??
      feedback?.bookingContractId ??
      feedback?.kolContractId ??
      feedback?.contract?.id ??
      feedback?.contractDTO?.id
  );

const resolveContractKolIdentifier = (contract) =>
  normalizeIdValue(
    contract?.kolId ??
      contract?.kol?.id ??
      contract?.kolDTO?.id ??
      contract?.kolProfile?.id ??
      contract?.kolProfileId
  );

const resolveFeedbackKolIdentifier = (feedback) =>
  normalizeIdValue(
    feedback?.kolId ??
      feedback?.kol?.id ??
      feedback?.kolDTO?.id ??
      feedback?.kolProfileId
  );

const resolveKolIdentifier = (kol) =>
  normalizeIdValue(
    kol?.id ??
      kol?.kolId ??
      kol?.kolProfileId ??
      kol?.userId ??
      kol?.profileId ??
      kol?.kolProfile?.id
  );

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

const resolveWorktimeId = (worktime) =>
  worktime?.id ??
  worktime?.worktimeId ??
  worktime?.workTimeId ??
  worktime?.work_time_id ??
  null;

const MySingleBookingRequestDetail = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const screens = useBreakpoint();

  const {
    isLoadingMyBookingRequestDetail,
    isFetchingMyBookingRequestDetail,
    myBookingRequestDetailResponse,
    refetchMyBookingRequestDetail,
    myBookingRequestDetailError,
  } = useGetMySingleBookingRequestDetail(requestId);
  const {
    isUpdatingMySingleBookingRequest,
    handleUpdateMySingleBookingRequest,
  } = useUpdateMySingleBookingRequest();
  const { platforms, isLoadingPlatforms } = useGetPlatforms();
  const [updateForm] = Form.useForm();
  const [newAttachments, setNewAttachments] = useState([]);
  const [fileIdsToDelete, setFileIdsToDelete] = useState([]);
  const [confirmingWorktimeId, setConfirmingWorktimeId] = useState(null);
  const [contractPreview, setContractPreview] = useState(null);
  const platformOptions = useMemo(() => {
    const unique = new Map();
    (platforms ?? []).forEach((item) => {
      const labelRaw =
        typeof item?.name === "string" && item.name.trim().length > 0
          ? item.name.trim()
          : typeof item?.key === "string" && item.key.trim().length > 0
          ? item.key.trim()
          : "";
      if (!labelRaw) return;
      const normalizedKey = labelRaw.toLowerCase();
      if (!unique.has(normalizedKey)) {
        unique.set(normalizedKey, {
          value: labelRaw,
          label: labelRaw,
        });
      }
    });
    return Array.from(unique.values());
  }, [platforms]);

  const platformValueMap = useMemo(() => {
    const map = new Map();
    platformOptions.forEach((option) => {
      map.set(option.value.toLowerCase(), option.value);
    });
    return map;
  }, [platformOptions]);

  const platformSelectOptions = useMemo(
    () => [
      ...platformOptions,
      {
        value: OTHER_PLATFORM_VALUE,
        label: "Khác (nhập tay)",
      },
    ],
    [platformOptions]
  );

  const selectedPlatform = Form.useWatch("platform", updateForm);
  const showCustomPlatformInput = selectedPlatform === OTHER_PLATFORM_VALUE;

  const handlePlatformChange = useCallback(
    (value) => {
      if (value !== OTHER_PLATFORM_VALUE) {
        updateForm.setFieldsValue({ platformOther: "" });
      }
    },
    [updateForm]
  );

  const detail = myBookingRequestDetailResponse?.data ?? null;
  const refund = detail?.refundDTO ?? null;
  const refundStatus = normalizeStatus(refund?.status);
  const contracts = Array.isArray(detail?.contracts)
    ? detail.contracts.filter(Boolean)
    : [];
  const contractsWithTerms = useMemo(() => {
    if (!contracts.length) {
      return [];
    }
    return contracts.map((contract) => {
      const termsText =
        typeof contract?.terms === "string" ? contract.terms : "";
      return {
        ...contract,
        terms: termsText,
        termLinks: extractUrlsFromText(termsText),
      };
    });
  }, [contracts]);
  const feedbackSummaries = useMemo(
    () =>
      Array.isArray(detail?.feedbackDTOS)
        ? detail.feedbackDTOS.filter(Boolean)
        : [],
    [detail?.feedbackDTOS]
  );
  const kolInfo = detail?.kol ?? null;
  const attachedFiles = Array.isArray(detail?.attachedFiles)
    ? detail.attachedFiles.filter(Boolean)
    : [];
  const worktimes = useMemo(() => {
    if (Array.isArray(detail?.kolWorkTimes)) {
      return detail.kolWorkTimes.filter(Boolean);
    }
    return detail?.kolWorkTimes ? [detail.kolWorkTimes] : [];
  }, [detail?.kolWorkTimes]);
  const latestKolWorktime = worktimes[0] ?? null;
  const kolWorkTimesStatusLabel = normalizeStatus(latestKolWorktime?.status);
  const worktimeIds = useMemo(
    () =>
      worktimes
        .map((worktime) => resolveWorktimeId(worktime))
        .filter((id) => id !== null && id !== undefined),
    [worktimes]
  );
  const contractsWithFeedback = useMemo(() => {
    if (!contractsWithTerms.length) {
      return [];
    }

    const remaining = [...feedbackSummaries];

    return contractsWithTerms.map((currentContract) => {
      const contractId = resolveContractIdentifier(currentContract);
      const kolId =
        resolveContractKolIdentifier(currentContract) ??
        resolveKolIdentifier(kolInfo);

      let matchIndex = -1;

      if (contractId) {
        matchIndex = remaining.findIndex((candidate) => {
          const candidateContractId =
            resolveFeedbackContractIdentifier(candidate);
          return candidateContractId && candidateContractId === contractId;
        });
      }

      if (matchIndex < 0 && kolId) {
        matchIndex = remaining.findIndex((candidate) => {
          const candidateKolId = resolveFeedbackKolIdentifier(candidate);
          return candidateKolId && candidateKolId === kolId;
        });
      }

      if (matchIndex < 0 && remaining.length === 1) {
        matchIndex = 0;
      }

      const matchedFeedback =
        matchIndex >= 0 ? remaining.splice(matchIndex, 1)[0] : null;

      return {
        contract: currentContract,
        feedbackSummary: matchedFeedback,
      };
    });
  }, [contractsWithTerms, feedbackSummaries, kolInfo]);

  const handleOpenContractPreview = useCallback((contract) => {
    if (!contract) {
      return;
    }

    const termsText = typeof contract?.terms === "string" ? contract.terms : "";

    const normalizedContract = {
      ...contract,
      terms: termsText,
      termLinks:
        Array.isArray(contract?.termLinks) && contract.termLinks.length > 0
          ? contract.termLinks
          : extractUrlsFromText(termsText),
    };

    const hasValidAmount =
      typeof normalizedContract.amount === "number" &&
      !Number.isNaN(normalizedContract.amount);

    if (!hasValidAmount) {
      const fallbackAmount =
        typeof contract?.paymentDTO?.totalAmount === "number"
          ? contract.paymentDTO.totalAmount
          : typeof contract?.paymentDTO?.amount === "number"
          ? contract.paymentDTO.amount
          : undefined;
      normalizedContract.amount = fallbackAmount;
    }

    setContractPreview(normalizedContract);
  }, []);

  const handleCloseContractPreview = useCallback(() => {
    setContractPreview(null);
  }, []);

  const {
    worktimeLivestreamMetricsMap,
    worktimeLivestreamMetricQueries,
    resolvedWorktimeIds,
    isLoadingWorktimeLivestreamMetrics,
    isFetchingWorktimeLivestreamMetrics,
  } = useGetWorktimeLivestreamMetrics(worktimeIds, {
    enabled:
      !isLoadingMyBookingRequestDetail &&
      !isFetchingMyBookingRequestDetail &&
      worktimeIds.length > 0,
    retry: false,
    staleTime: Infinity, // dữ liệu luôn “tươi”, React Query không refetch lại
    cacheTime: Infinity, // giữ cache vĩnh viễn
    refetchOnWindowFocus: false, // không refetch khi quay lại tab
    refetchOnMount: false, // không refetch khi re-render lại trang
    refetchOnReconnect: false, // không refetch khi reconnect mạng
  });

  const findQueryByWorktimeId = useCallback(
    (worktimeId) => {
      if (worktimeId === null || worktimeId === undefined) {
        return null;
      }

      const normalizedTarget = String(worktimeId);
      const index = resolvedWorktimeIds.findIndex(
        (id) => String(id) === normalizedTarget
      );

      return index >= 0 ? worktimeLivestreamMetricQueries[index] : null;
    },
    [resolvedWorktimeIds, worktimeLivestreamMetricQueries]
  );

  const {
    isConfirmingWorktimeLivestreamMetrics,
    handleConfirmWorktimeLivestreamMetrics,
  } = useConfirmMyWorktimeLivestreamMetrics();

  const handleConfirmMetrics = useCallback(
    async (worktimeId, query) => {
      if (worktimeId === null || worktimeId === undefined) return;
      setConfirmingWorktimeId(worktimeId);
      try {
        await handleConfirmWorktimeLivestreamMetrics(worktimeId);
        if (query?.refetch) {
          await query.refetch();
        }
        await refetchMyBookingRequestDetail();
      } catch (error) {
        // handled by interceptors
      } finally {
        setConfirmingWorktimeId(null);
      }
    },
    [handleConfirmWorktimeLivestreamMetrics, refetchMyBookingRequestDetail]
  );
  const formattedAttachments = useMemo(
    () =>
      attachedFiles
        .map((item) => {
          const rawId =
            item?.id ??
            item?.fileId ??
            item?.file?.id ??
            item?.file?.fileId ??
            null;
          return {
            id: rawId ? String(rawId) : null,
            name:
              item?.file?.fileName ??
              item?.fileName ??
              (rawId ? `Tệp ${String(rawId).slice(-6)}` : "Tệp không tên"),
            type: item?.file?.fileType ?? item?.fileType ?? "",
          };
        })
        .filter(Boolean),
    [attachedFiles]
  );
  const deletableAttachments = useMemo(
    () => formattedAttachments.filter((item) => item.id),
    [formattedAttachments]
  );
  const deletableAttachmentOptions = useMemo(
    () =>
      deletableAttachments.map((item) => ({
        label: `${item.name}${item.type ? ` (${item.type})` : ""}`,
        value: item.id,
      })),
    [deletableAttachments]
  );

  const status = normalizeStatus(detail?.status);
  const statusLabel = status ? BOOKING_STATUS_LABEL[status] ?? status : "--";
  const isUpdated = status === "PAID";

  const handleBack = useCallback(() => {
    navigate("/don-booking-kol");
  }, [navigate]);

  const updateFormInitialValues = useMemo(() => {
    const rawPlatform =
      typeof detail?.platform === "string" && detail.platform.trim().length > 0
        ? detail.platform.trim()
        : typeof detail?.contact?.platform === "string" &&
          detail.contact.platform.trim().length > 0
        ? detail.contact.platform.trim()
        : "";
    const matchedPlatform =
      rawPlatform && platformValueMap.get(rawPlatform.toLowerCase());

    return {
      fullName:
        detail?.fullName ??
        detail?.contact?.fullName ??
        detail?.user?.fullName ??
        "",
      phone:
        detail?.phone ?? detail?.contact?.phone ?? detail?.user?.phone ?? "",
      email:
        detail?.email ?? detail?.contact?.email ?? detail?.user?.email ?? "",
      description: detail?.description ?? "",
      location: detail?.location ?? "",
      platform: matchedPlatform
        ? matchedPlatform
        : rawPlatform
        ? OTHER_PLATFORM_VALUE
        : undefined,
      platformOther: matchedPlatform ? "" : rawPlatform,
    };
  }, [detail, platformValueMap]);

  useEffect(() => {
    if (!detail) return;
    updateForm.setFieldsValue(updateFormInitialValues);
  }, [detail, updateForm, updateFormInitialValues]);

  useEffect(() => {
    if (!detail) return;
    setNewAttachments([]);
    setFileIdsToDelete([]);
  }, [detail]);

  const handleUploadChange = useCallback(({ fileList }) => {
    setNewAttachments(fileList);
  }, []);

  const handleSelectFilesToDelete = useCallback((values) => {
    const sanitized = (values ?? [])
      .map((value) => (value == null ? null : String(value)))
      .filter((value) => typeof value === "string" && value.trim().length > 0);
    setFileIdsToDelete(sanitized);
  }, []);

  const handleTriggerInlineUpdate = useCallback(() => {
    updateForm.submit();
  }, [updateForm]);

  const handleSubmitUpdate = useCallback(
    async (values) => {
      const attachmentsPayload = newAttachments
        .map((file) => file?.originFileObj)
        .filter(Boolean);

      const resolvedPlatform =
        values?.platform === OTHER_PLATFORM_VALUE
          ? values?.platformOther
          : values?.platform;

      const valuesWithPlatform = {
        ...values,
        platform: resolvedPlatform,
      };

      const payloadDto = {};
      [
        "fullName",
        "phone",
        "email",
        "description",
        "location",
        "platform",
      ].forEach((key) => {
        const raw = valuesWithPlatform?.[key];
        if (raw === undefined || raw === null) return;
        if (typeof raw === "string") {
          payloadDto[key] = raw.trim();
        } else {
          payloadDto[key] = raw;
        }
      });

      const sanitizedIds = fileIdsToDelete.filter(
        (id) => typeof id === "string" && id.trim().length > 0
      );

      try {
        await handleUpdateMySingleBookingRequest({
          requestId,
          updateBookingReqDTO:
            Object.keys(payloadDto).length > 0 ? payloadDto : undefined,
          attachedFiles: attachmentsPayload,
          fileIdsToDelete: sanitizedIds,
        });
        await refetchMyBookingRequestDetail();
        setNewAttachments([]);
        setFileIdsToDelete([]);
      } catch (error) {
        // handled by interceptors
      }
    },
    [
      newAttachments,
      fileIdsToDelete,
      handleUpdateMySingleBookingRequest,
      requestId,
      refetchMyBookingRequestDetail,
    ]
  );

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "Tên tệp",
        dataIndex: ["file", "fileName"],
        key: "fileName",
        render: (_, r) => (
          <Typography
            sx={{
              maxWidth: 200, // hoặc width: 240 nếu muốn cố định
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "normal",
              fontWeight: 500,
            }}
          >
            {r?.file?.fileName ?? "--"}
          </Typography>
        ),
      },
      {
        title: "Loại",
        dataIndex: ["file", "fileType"],
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Liên kết",
        key: "link",
        render: (_, r) =>
          r?.file?.fileUrl ? (
            <Typography.Link
              href={r.file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở
            </Typography.Link>
          ) : (
            "--"
          ),
      },
    ],
    []
  );

  const isLoading =
    isLoadingMyBookingRequestDetail || isFetchingMyBookingRequestDetail;

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-purple-300/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 flex flex-col gap-10">
          {/* Header */}
          <div>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={handleBack}
              className="!flex !items-center !gap-2 !h-11 !rounded-xl !border !border-slate-200 !bg-white !text-indigo-600 !font-semibold !shadow-sm hover:!border-indigo-500/60 hover:!text-indigo-700 hover:!bg-indigo-50 transition-all duration-300"
            >
              Trở về đơn đặt KOL
            </Button>
          </div>
          <section className="rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  <CalendarRange size={16} />
                  <span>Chi tiết booking KOL</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Xem chi tiết thông tin đơn, hợp đồng và thanh toán.
                </p>
              </div>
            </div>
          </section>

          {myBookingRequestDetailError ? (
            <Alert
              type="error"
              showIcon
              message="Không thể tải chi tiết đơn booking"
              description={
                myBookingRequestDetailError?.message ?? "Vui lòng thử lại sau."
              }
            />
          ) : null}

          <Skeleton active loading={isLoading}>
            {detail ? (
              <>
                {/* Booking Info */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <UserCircle2 size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Thông tin đơn booking
                    </span>
                  </Space>
                  <Space direction="vertical" size="large" className="w-full">
                    <Descriptions bordered size="middle" column={1}>
                      <Descriptions.Item label="Trạng thái">
                        {status ? (
                          <Tag color={STATUS_TAG_COLOR[status] ?? "default"}>
                            {statusLabel}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian thực hiện">
                        {composeExecutionTime(detail)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {formatDateTime(detail?.createdAt)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Form
                      form={updateForm}
                      layout="vertical"
                      initialValues={updateFormInitialValues}
                      onFinish={handleSubmitUpdate}
                      requiredMark={false}
                      className="w-full"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item
                          label="Người liên hệ"
                          name="fullName"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập người liên hệ",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập tên người liên hệ" />
                        </Form.Item>
                        <Form.Item
                          label="Số điện thoại"
                          name="phone"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập số điện thoại",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập số điện thoại liên hệ" />
                        </Form.Item>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            { required: true, message: "Vui lòng nhập email" },
                            { type: "email", message: "Email không hợp lệ" },
                          ]}
                        >
                          <Input placeholder="Nhập email liên hệ" />
                        </Form.Item>
                        <Form.Item label="Địa điểm" name="location">
                          <Input placeholder="Nhập địa điểm thực hiện" />
                        </Form.Item>

                        <Form.Item
                          label="Nền tảng"
                          className="md:col-span-2"
                          required
                        >
                          <Space
                            direction="vertical"
                            size={8}
                            className="w-full"
                          >
                            <Form.Item
                              name="platform"
                              noStyle
                              rules={[
                                {
                                  required: true,
                                  message: "Vui lòng chọn nền tảng",
                                },
                              ]}
                            >
                              <Select
                                showSearch
                                placeholder="Chọn nền tảng"
                                options={platformSelectOptions}
                                optionFilterProp="label"
                                loading={isLoadingPlatforms}
                                onChange={handlePlatformChange}
                              />
                            </Form.Item>
                            {showCustomPlatformInput ? (
                              <Form.Item
                                name="platformOther"
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập nền tảng",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập nền tảng khác" />
                              </Form.Item>
                            ) : null}
                          </Space>
                        </Form.Item>
                      </div>
                      <Form.Item label="Ghi chú" name="description">
                        <Input.TextArea
                          rows={4}
                          placeholder="Mô tả chi tiết yêu cầu hoặc ghi chú"
                        />
                      </Form.Item>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Tệp đính kèm hiện có
                          </p>
                          <p className="mb-3 text-slate-500">
                            Chọn các tệp bạn muốn xóa khi cập nhật.
                          </p>

                          {deletableAttachmentOptions.length > 0 ? (
                            <Checkbox.Group
                              value={fileIdsToDelete}
                              onChange={handleSelectFilesToDelete}
                              className="flex flex-col gap-2"
                            >
                              {deletableAttachmentOptions.map((item) => (
                                <Checkbox
                                  key={item.value}
                                  value={item.value}
                                  className="!w-full"
                                >
                                  <div
                                    className={`text-sm transition-all duration-200 break-words whitespace-normal block w-full ${
                                      fileIdsToDelete.includes(item.value)
                                        ? "line-through text-slate-700/60"
                                        : "text-slate-700"
                                    }`}
                                    style={{
                                      wordBreak: "break-word",
                                      overflowWrap: "break-word",
                                      whiteSpace: "normal",
                                      width: "100%",
                                      display: "block",
                                    }}
                                  >
                                    {item.label}
                                  </div>
                                </Checkbox>
                              ))}
                            </Checkbox.Group>
                          ) : (
                            <div className="text-sm text-slate-500">
                              Không có tệp đính kèm.
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Thêm tệp mới
                          </p>
                          <p className="mb-3  text-slate-500">
                            Các tệp này sẽ được đính kèm khi cập nhật.
                          </p>
                          <Upload
                            beforeUpload={() => false}
                            multiple
                            fileList={newAttachments}
                            onChange={handleUploadChange}
                          >
                            <Button icon={<UploadOutlined />}>Chọn tệp</Button>
                          </Upload>
                        </div>
                      </div>
                      {isUpdated ? (
                        <div className="mt-6 flex justify-end">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={isUpdatingMySingleBookingRequest}
                            className="!h-11 !rounded-xl !bg-indigo-600 !px-6 hover:!bg-indigo-500"
                          >
                            Cập nhật thông tin
                          </Button>
                        </div>
                      ) : null}
                    </Form>
                  </Space>
                </section>

                {/* Attached Files */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <FileText size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Tệp đính kèm
                    </span>
                  </Space>
                  {attachedFiles.length > 0 ? (
                    <Table
                      columns={attachedFileColumns}
                      dataSource={attachedFiles}
                      pagination={false}
                      rowKey={(r) => r?.id ?? Math.random()}
                      className="mt-4"
                    />
                  ) : (
                    <Empty description="Không có tệp đính kèm" />
                  )}
                </section>

                {/* Worktimes & Metrics */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <CalendarRange size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Thống kê livestream theo phiên
                    </span>
                  </Space>

                  {worktimes.length > 0 ? (
                    <Space
                      direction="vertical"
                      size="large"
                      className="w-full mt-4"
                    >
                      {worktimes.map((worktime, index) => {
                        const rawWorktimeId = resolveWorktimeId(worktime);
                        const worktimeKey =
                          rawWorktimeId !== null && rawWorktimeId !== undefined
                            ? rawWorktimeId
                            : `worktime-${index}`;
                        const metrics =
                          rawWorktimeId !== null && rawWorktimeId !== undefined
                            ? worktimeLivestreamMetricsMap.get(rawWorktimeId)
                            : null;
                        const queryState = findQueryByWorktimeId(rawWorktimeId);
                        const isMetricsLoading =
                          !!(queryState?.isPending || queryState?.isFetching) ||
                          (!queryState &&
                            (isLoadingWorktimeLivestreamMetrics ||
                              isFetchingWorktimeLivestreamMetrics));
                        const metricsError = queryState?.error;
                        const errorMessage =
                          metricsError?.response?.data?.message ??
                          metricsError?.message;
                        const isMetricsMissing =
                          metricsError &&
                          isMissingLivestreamMetricError(metricsError);
                        const normalizedMetrics = isMetricsMissing
                          ? null
                          : metrics;
                        const shouldShowMetricsError = Boolean(
                          metricsError && !isMetricsMissing
                        );
                        const worktimeStatus = normalizeStatus(
                          worktime?.status
                        );
                        const worktimeStatusLabel = worktimeStatus
                          ? BOOKING_STATUS_LABEL[worktimeStatus] ??
                            worktimeStatus
                          : null;
                        const isButtonLoading =
                          confirmingWorktimeId === rawWorktimeId &&
                          isConfirmingWorktimeLivestreamMetrics;
                        const showConfirmTag =
                          typeof normalizedMetrics?.isConfirmed === "boolean";
                        const isConfirmedValue = showConfirmTag
                          ? normalizedMetrics.isConfirmed
                          : Boolean(normalizedMetrics?.confirmedAt);

                        return (
                          <Card
                            key={worktimeKey}
                            type="inner"
                            className="shadow-sm"
                            title={`Phiên làm việc ${rawWorktimeId ?? ""}`}
                          >
                            <Descriptions bordered size="middle" column={1}>
                              <Descriptions.Item label="Bắt đầu">
                                {formatDateTime(
                                  worktime?.startAt ?? worktime?.startTime
                                )}
                              </Descriptions.Item>
                              <Descriptions.Item label="Kết thúc">
                                {formatDateTime(
                                  worktime?.endAt ?? worktime?.endTime
                                )}
                              </Descriptions.Item>
                              <Descriptions.Item label="Trạng thái">
                                {worktimeStatusLabel ? (
                                  <Tag
                                    color={
                                      STATUS_TAG_COLOR[worktimeStatus] ??
                                      "default"
                                    }
                                  >
                                    {worktimeStatusLabel}
                                  </Tag>
                                ) : (
                                  "--"
                                )}
                              </Descriptions.Item>
                              {worktime?.note ? (
                                <Descriptions.Item label="Ghi chú">
                                  <Text style={{ whiteSpace: "pre-wrap" }}>
                                    {worktime.note}
                                  </Text>
                                </Descriptions.Item>
                              ) : null}
                            </Descriptions>

                            <div className="mt-4">
                              <Space
                                direction="vertical"
                                size="middle"
                                className="w-full"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-base font-semibold text-slate-900">
                                    Thống kê livestream
                                  </span>
                                  <Space size="small" wrap>
                                    {showConfirmTag ? (
                                      <Tag
                                        color={
                                          isConfirmedValue ? "green" : "orange"
                                        }
                                      >
                                        {isConfirmedValue
                                          ? "Đã xác nhận"
                                          : "Chưa xác nhận"}
                                      </Tag>
                                    ) : null}
                                    {normalizedMetrics?.confirmedAt ? (
                                      <Text type="secondary">
                                        Xác nhận lúc:{" "}
                                        {formatDateTime(
                                          normalizedMetrics.confirmedAt
                                        )}
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
                                      errorMessage
                                        ? String(errorMessage)
                                        : undefined
                                    }
                                  />
                                ) : normalizedMetrics ? (
                                  <>
                                    <Descriptions
                                      bordered
                                      size="middle"
                                      column={
                                        screens.lg ? 3 : screens.md ? 2 : 1
                                      }
                                      labelStyle={{ width: 220 }}
                                    >
                                      {LIVESTREAM_METRIC_LABELS.map(
                                        ({ key, label }) => (
                                          <Descriptions.Item
                                            key={key}
                                            label={label}
                                          >
                                            {formatLivestreamMetricValue(
                                              key,
                                              normalizedMetrics?.[key]
                                            )}
                                          </Descriptions.Item>
                                        )
                                      )}
                                    </Descriptions>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <Space size="small" wrap>
                                        {normalizedMetrics?.createdAt ? (
                                          <Text type="secondary">
                                            Cập nhật lúc:{" "}
                                            {formatDateTime(
                                              normalizedMetrics.createdAt
                                            )}
                                          </Text>
                                        ) : null}
                                        {normalizedMetrics?.confirmedAt ? (
                                          <Text type="secondary">
                                            Xác nhận lúc:{" "}
                                            {formatDateTime(
                                              normalizedMetrics.confirmedAt
                                            )}
                                          </Text>
                                        ) : null}
                                      </Space>
                                      {normalizedMetrics?.confirmedAt ===
                                      null ? (
                                        <Button
                                          type="primary"
                                          ghost
                                          onClick={() =>
                                            handleConfirmMetrics(
                                              rawWorktimeId,
                                              queryState
                                            )
                                          }
                                          loading={isButtonLoading}
                                          disabled={
                                            isButtonLoading ||
                                            isMetricsLoading ||
                                            !normalizedMetrics ||
                                            rawWorktimeId === null ||
                                            rawWorktimeId === undefined
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
                              </Space>
                            </div>
                          </Card>
                        );
                      })}
                    </Space>
                  ) : (
                    <Empty description="Chưa có phiên làm việc" />
                  )}
                </section>

                {/* User Info */}
                {/* <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <UserCircle2 size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Thông tin người đặt
                    </span>
                  </Space>
                  {detail?.user ? (
                    <Descriptions
                      bordered
                      size="middle"
                      column={1}
                      className="mt-4"
                    >
                      <Descriptions.Item label="Tên">
                        {detail.user.fullName ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {detail.user.email ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">
                        {detail.user.phone ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ">
                        {detail.user.address ?? "--"}
                      </Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Empty description="Không có thông tin người đặt" />
                  )}
                </section> */}

                {/* KOL Info */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6 md:p-8 space-y-6">
                  {/* Header */}
                  <Space>
                    <UserCircle2 size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Hồ sơ KOL
                    </span>
                  </Space>

                  {/* Thông tin KOL */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Thông tin KOL
                      </span>
                    </div>

                    {detail?.kol ? (
                      <Descriptions
                        bordered
                        size="middle"
                        column={1}
                        className="[&_.ant-descriptions-item-label]:w-56 [&_.ant-descriptions-item-label]:bg-slate-50 [&_.ant-descriptions-item-label]:font-medium [&_.ant-descriptions-item-label]:text-slate-700 [&_.ant-descriptions-item-content]:bg-white [&_.ant-descriptions-item-content]:text-slate-900 mt-2"
                      >
                        <Descriptions.Item label="Tên KOL">
                          {detail.kol.displayName ??
                            detail.kol.fullName ??
                            "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Quốc gia">
                          {detail.kol.country ?? "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thành phố">
                          {detail.kol.city ?? "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Danh mục">
                          {formatArray(
                            detail.kol.categories
                              ?.map((c) => c?.name)
                              .filter(Boolean)
                          ) || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kinh nghiệm">
                          {detail.kol.experience ?? "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mô tả">
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {detail.kol.bio ?? "--"}
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <div className="py-6">
                        <Empty description="Không có thông tin KOL" />
                      </div>
                    )}
                  </div>

                  {/* Thông tin làm việc gần nhất */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Thông tin làm việc gần nhất
                      </span>
                    </div>

                    {latestKolWorktime ? (
                      <Descriptions
                        bordered
                        size="middle"
                        column={1}
                        className="[&_.ant-descriptions-item-label]:w-56 [&_.ant-descriptions-item-label]:bg-slate-50 [&_.ant-descriptions-item-label]:font-medium [&_.ant-descriptions-item-label]:text-slate-700 [&_.ant-descriptions-item-content]:bg-white [&_.ant-descriptions-item-content]:text-slate-900 mt-2"
                      >
                        <Descriptions.Item label="Trạng thái làm việc">
                          {kolWorkTimesStatusLabel ? (
                            <Tag
                              color={
                                STATUS_TAG_COLOR[kolWorkTimesStatusLabel] ??
                                "default"
                              }
                            >
                              {BOOKING_STATUS_LABEL[kolWorkTimesStatusLabel] ??
                                latestKolWorktime?.status ??
                                "--"}
                            </Tag>
                          ) : (
                            "--"
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                          {latestKolWorktime.note || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian bắt đầu làm việc">
                          {formatDateTime(
                            latestKolWorktime.startAt ??
                              latestKolWorktime.startTime
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian kết thúc làm việc">
                          {formatDateTime(
                            latestKolWorktime.endAt ?? latestKolWorktime.endTime
                          )}
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <div className="py-6">
                        <Empty description="Không có thông tin làm việc của KOL" />
                      </div>
                    )}
                  </div>
                </section>

                {/* Contract & Payment */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <Layers size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Hợp đồng & thanh toán
                    </span>
                  </Space>
                  {contractsWithTerms.length > 0 ? (
                    <Space
                      direction="vertical"
                      size="large"
                      className="w-full mt-4"
                    >
                      {contractsWithFeedback.map(
                        ({ contract: c, feedbackSummary }) => {
                          const paymentStatus = normalizeStatus(
                            c?.paymentDTO?.status
                          );
                          const contractStatus = normalizeStatus(c?.status);
                          const canPreviewContract =
                            (typeof c?.terms === "string" &&
                              c.terms.trim().length > 0) ||
                            (Array.isArray(c?.termLinks) &&
                              c.termLinks.length > 0);
                          return (
                            <Card
                              key={c?.id}
                              type="inner"
                              title={`Hợp đồng ${c?.contractNumber ?? ""}`}
                              className="shadow-sm"
                            >
                              <Descriptions bordered size="middle" column={1}>
                                <Descriptions.Item label="Trạng thái hợp đồng">
                                  <Tag
                                    color={
                                      STATUS_TAG_COLOR[
                                        c?.status?.toUpperCase()
                                      ] ?? "default"
                                    }
                                  >
                                    {BOOKING_STATUS_LABEL[
                                      c?.status?.toUpperCase()
                                    ] ?? c?.status}
                                  </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Thanh toán">
                                  {paymentStatus ? (
                                    <Tag
                                      color={
                                        PAYMENT_STATUS_COLOR[paymentStatus]
                                      }
                                    >
                                      {PAYMENT_STATUS_LABEL[paymentStatus]}
                                    </Tag>
                                  ) : (
                                    "--"
                                  )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng tiền">
                                  {formatCurrency(
                                    c?.paymentDTO?.totalAmount,
                                    c?.paymentDTO?.currency ?? "VND"
                                  )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Đã thanh toán">
                                  {formatCurrency(
                                    c?.paymentDTO?.paidAmount,
                                    c?.paymentDTO?.currency ?? "VND"
                                  )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian cập nhật">
                                  {formatDateTime(c?.paymentDTO?.updatedAt)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Hết hạn thanh toán">
                                  {formatDateTime(c?.paymentDTO?.expiresAt)}
                                </Descriptions.Item>
                              </Descriptions>
                              <div className="mt-4 flex justify-end">
                                <Button
                                  icon={<FileText size={16} />}
                                  onClick={() => handleOpenContractPreview(c)}
                                  disabled={!canPreviewContract}
                                >
                                  Xem hợp đồng
                                </Button>
                              </div>
                              {contractStatus === "COMPLETED" && (
                                <UserKolFeedbackSection
                                  contract={c}
                                  kol={detail?.kol}
                                  initialFeedback={feedbackSummary}
                                  onFeedbackUpdated={() =>
                                    refetchMyBookingRequestDetail()
                                  }
                                />
                              )}
                            </Card>
                          );
                        }
                      )}
                    </Space>
                  ) : (
                    <Empty description="Không có thông tin hợp đồng" />
                  )}
                </section>

                {/* Refund */}
                <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                  <Space>
                    <Layers size={18} />
                    <span className="text-lg font-semibold text-slate-900">
                      Hoàn tiền
                    </span>
                  </Space>

                  {refund ? (
                    <Card
                      type="inner"
                      className="shadow-sm mt-4"
                      title="Thông tin hoàn tiền"
                    >
                      <Descriptions bordered size="middle" column={1}>
                        <Descriptions.Item label="Trạng thái hoàn tiền">
                          {refundStatus ? (
                            <Tag
                              color={
                                PAYMENT_STATUS_COLOR[refundStatus] ?? "default"
                              }
                            >
                              {PAYMENT_STATUS_LABEL[refundStatus] ??
                                refund?.status ??
                                "--"}
                            </Tag>
                          ) : (
                            "--"
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền hoàn">
                          {formatCurrency(
                            refund.amount,
                            // ưu tiên currency từ hợp đồng nếu có, fallback VND
                            contracts?.[0]?.paymentDTO?.currency ?? "VND"
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lý do hoàn tiền">
                          {refund.reason || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngân hàng nhận">
                          {refund.bankName && refund.bankNumber
                            ? `${refund.bankName} – ${refund.bankNumber}`
                            : "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chủ tài khoản">
                          {refund.ownerName || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                          {refund.description || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian yêu cầu hoàn tiền">
                          {formatDateTime(refund.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian đã hoàn">
                          {refund.refundedAt
                            ? formatDateTime(refund.refundedAt)
                            : "--"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ) : (
                    <Empty
                      description="Không có thông tin hoàn tiền"
                      className="mt-4"
                    />
                  )}
                </section>
              </>
            ) : (
              <Empty description="Không tìm thấy dữ liệu" />
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

export default MySingleBookingRequestDetail;
