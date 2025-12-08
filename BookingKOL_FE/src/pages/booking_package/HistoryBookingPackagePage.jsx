import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Tag,
} from "antd";
import {
  CalendarRange,
  ClipboardList,
  Eye,
  RotateCcw,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { useGetHistoryBookingBackage } from "../../hook/booking_package/useGetHistoryBookingBackage";
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_OPTIONS,
  STATUS_TAG_COLOR,
} from "../../constants/mySingleBookingStatuses";
import {
  cancelUserContract,
  cancelUserBookingRequest,
  rejectUserContract,
  signUserContract,
} from "../../services/booking/BookingServices";
import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";

const { RangePicker } = DatePicker;

const resolvePackageStatus = (status) => {
  const normalized = status?.toUpperCase();
  return {
    label: BOOKING_STATUS_LABEL[normalized] ?? normalized ?? "--",
    color: STATUS_TAG_COLOR[normalized] ?? "default",
  };
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "--";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} ₫`;
};

const composeBudgetRange = (targetPrice) => {
  if (targetPrice === null || targetPrice === undefined) {
    return "--";
  }
  return `${formatCurrency(targetPrice)}`;
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const date = dayjs(value);
  return date.isValid() ? date.format(pattern) : "--";
};

const composeCampaignDuration = (start, end) => {
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start, "DD/MM/YYYY");
  const endLabel = formatDateTime(end, "DD/MM/YYYY");
  if (!startLabel || startLabel === "--") return endLabel;
  if (!endLabel || endLabel === "--") return startLabel;
  if (dayjs(start).isValid() && dayjs(start).isSame(end, "day")) {
    return startLabel;
  }
  return `${startLabel} → ${endLabel}`;
};

const PACKAGE_STATUS_FILTER_OPTIONS = BOOKING_STATUS_OPTIONS.filter((option) =>
  ["REQUESTED", "NEGOTIATING", "ACCEPTED"].includes(option.value)
);

const HistoryBookingPackagePage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});
  const [rejectModalInfo, setRejectModalInfo] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [cancellingContractId, setCancellingContractId] = useState(null);
  const [cancellingBookingRequestId, setCancellingBookingRequestId] =
    useState(null);
  const [modal, modalContextHolder] = Modal.useModal();

  const {
    isGetHistoryBookingBackage,
    ResponseGetHistoryBookingPackage,
    refetchHistoryBookingPackage,
  } = useGetHistoryBookingBackage(page, size, filters);

  const handleViewCampaignDetail = useCallback(
    (campaignId) => {
      if (!campaignId) return;
      navigate(`/don-booking-chien-dich/${campaignId}`);
    },
    [navigate]
  );

  const handleFilterSubmit = (values = {}) => {
    const keywordValue =
      typeof values?.keyword === "string" ? values.keyword.trim() : "";
    const statusValue =
      typeof values?.status === "string"
        ? values.status.toUpperCase()
        : undefined;
    const campaignRange = Array.isArray(values?.campaignDuration)
      ? values.campaignDuration
      : [];
    const createdRange = Array.isArray(values?.createdRange)
      ? values.createdRange
      : [];

    const nextFilters = {};

    if (keywordValue) {
      nextFilters.keyword = keywordValue;
    }
    if (statusValue) {
      nextFilters.status = statusValue;
    }
    if (campaignRange.length === 2) {
      const start = campaignRange[0]?.startOf("day");
      const end = campaignRange[1]?.endOf("day");
      if (start?.isValid()) {
        nextFilters.campaignStartFrom = start.toISOString();
      }
      if (end?.isValid()) {
        nextFilters.campaignEndTo = end.toISOString();
      }
    }
    if (createdRange.length === 2) {
      const createdFrom = createdRange[0]?.startOf("day");
      const createdTo = createdRange[1]?.endOf("day");
      if (createdFrom?.isValid()) {
        nextFilters.createdFrom = createdFrom.toISOString();
      }
      if (createdTo?.isValid()) {
        nextFilters.createdTo = createdTo.toISOString();
      }
    }

    setFilters(nextFilters);
    setPage(0);
  };

  const handleResetFilters = () => {
    form.resetFields();
    setFilters({});
    setPage(0);
  };

  const closeRejectModal = () => {
    setRejectModalInfo(null);
    setRejectReason("");
    setRejectReasonError("");
  };

  const signContractMutation = useMutation({
    mutationFn: signUserContract,
    onSuccess: () => {
      refetchHistoryBookingPackage?.();
    },
  });

  const rejectContractMutation = useMutation({
    mutationFn: rejectUserContract,
    onSuccess: () => {
      closeRejectModal();
      refetchHistoryBookingPackage?.();
    },
  });

  const cancelContractMutation = useMutation({
    mutationFn: cancelUserContract,
    onSuccess: () => {
      refetchHistoryBookingPackage?.();
    },
    onSettled: () => {
      setCancellingContractId(null);
    },
  });

  const cancelBookingRequestMutation = useMutation({
    mutationFn: cancelUserBookingRequest,
    onSuccess: () => {
      refetchHistoryBookingPackage?.();
    },
    onSettled: () => {
      setCancellingBookingRequestId(null);
    },
  });

  const data =
    ResponseGetHistoryBookingPackage?.data?.content &&
    Array.isArray(ResponseGetHistoryBookingPackage.data.content)
      ? ResponseGetHistoryBookingPackage.data.content
      : [];

  const totalElements =
    ResponseGetHistoryBookingPackage?.data?.totalElements ?? 0;

  const hasData = data.length > 0;
  const isInitialLoading = isGetHistoryBookingBackage && !hasData;

  const skeletonItems = useMemo(
    () => Array.from({ length: Math.min(size, 6) }, (_, index) => index),
    [size]
  );

  const pageRange = useMemo(() => {
    if (!totalElements) return null;
    const start = page * size + 1;
    const end = Math.min((page + 1) * size, totalElements);
    return { start, end };
  }, [page, size, totalElements]);

  useEffect(() => {
    if (!isGetHistoryBookingBackage && page > 0 && !hasData) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [hasData, isGetHistoryBookingBackage, page]);

  const isRejectModalOpen = Boolean(rejectModalInfo);
  const rejectCampaignName = rejectModalInfo?.campaignName ?? "--";

  const isSigningContract = signContractMutation.isPending;
  const isRejectingContract = rejectContractMutation.isPending;
  const isCancellingContract = cancelContractMutation.isPending;
  const isCancellingBookingRequest = cancelBookingRequestMutation.isPending;
  const isAnyActionLoading =
    isSigningContract ||
    isRejectingContract ||
    isCancellingContract ||
    isCancellingBookingRequest;

  const handleAcceptContract = useCallback(
    (record) => {
      const contractId = record?.contractId;
      const bookingRequestId = record?.bookingRequestId;
      if (!contractId || !bookingRequestId || isAnyActionLoading) {
        return;
      }
      signContractMutation.mutate({
        contractId,
        bookingRequestId,
      });
    },
    [isAnyActionLoading, signContractMutation]
  );

  const openRejectModal = useCallback(
    (record) => {
      const contractId = record?.contractId;
      const bookingRequestId = record?.bookingRequestId;
      if (!contractId || !bookingRequestId || isAnyActionLoading) {
        return;
      }
      setRejectModalInfo({
        contractId,
        bookingRequestId,
        campaignName: record?.campaignName ?? "--",
      });
      setRejectReason("");
      setRejectReasonError("");
    },
    [isAnyActionLoading]
  );

  const handleRejectReasonChange = (event) => {
    if (rejectReasonError) {
      setRejectReasonError("");
    }
    setRejectReason(event?.target?.value ?? "");
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalInfo?.contractId || !rejectModalInfo?.bookingRequestId) {
      setRejectReasonError("Thiếu thông tin hợp đồng, vui lòng tải lại trang.");
      return;
    }
    const normalizedReason = rejectReason.trim();
    if (!normalizedReason) {
      setRejectReasonError("Vui lòng nhập lý do từ chối hợp đồng.");
      return;
    }
    await rejectContractMutation.mutateAsync({
      contractId: rejectModalInfo.contractId,
      bookingRequestId: rejectModalInfo.bookingRequestId,
      reason: normalizedReason,
    });
  };

  const handleCancelBookingRequest = useCallback(
    (record) => {
      const bookingRequestId = record?.bookingRequestId;
      if (!bookingRequestId || isCancellingBookingRequest) {
        return;
      }
      modal.confirm({
        title: "Hủy đơn",
        content: `Bạn có chắc nhắn muốn hủy đơn cho chiến dịch "${
          record?.campaignName ?? "--"
        }"? Thao tác này không thể hoàn tác.`,
        okText: "Hủy đơn",
        cancelText: "Giữ lại",
        centered: true,
        okButtonProps: { danger: true },
        onOk: () => {
          setCancellingBookingRequestId(bookingRequestId);
          return cancelBookingRequestMutation.mutateAsync(bookingRequestId);
        },
      });
    },
    [cancelBookingRequestMutation, isCancellingBookingRequest, modal]
  );

  const handleCancelContract = useCallback(
    (record) => {
      const bookingRequestId = record?.bookingRequestId;
      if (!bookingRequestId || isCancellingContract) {
        return;
      }
      modal.confirm({
        title: "Hủy hợp đồng",
        content: `Bạn có chắc chắn hủy hợp đồng cho chiến dịch "${
          record?.campaignName ?? "--"
        }"? Thao tác này không thể hoàn tác.`,
        okText: "Hủy hợp đồng",
        cancelText: "Giữ lại",
        centered: true,
        okButtonProps: { danger: true },
        onOk: () => {
          setCancellingContractId(bookingRequestId);
          return cancelContractMutation.mutateAsync(bookingRequestId);
        },
      });
    },
    [cancelContractMutation, isCancellingContract, modal]
  );

  const renderBookingActions = useCallback(
    (record) => {
      const bookingRequestId = record?.bookingRequestId;
      const campaignId = record?.campaignId ?? record?.id;
      const canViewDetail = Boolean(campaignId);
      const campaignStatusSource =
        record?.campaignStatus ?? record?.status ?? record?.bookingStatus;

      const normalizedCampaignStatus =
        typeof campaignStatusSource === "string"
          ? campaignStatusSource.toUpperCase()
          : "";

      const isTerminalStatus = ["COMPLETED", "CANCELLED"].includes(
        normalizedCampaignStatus
      );

      // const kolWorktimes = resolveKolWorktimes(record);
      // const hasKolSchedule = kolWorktimes.length > 0;

      const canCancelBookingRequest =
        (normalizedCampaignStatus === "ACCEPTED" && bookingRequestId) ||
        (normalizedCampaignStatus === "REQUESTED" && bookingRequestId);
      //  &&
      // hasKolSchedule;

      const canCancelContract =
        !isTerminalStatus &&
        !["NEGOTIATING", "CANCELLED", "REJECTED"].includes(
          normalizedCampaignStatus
        ) &&
        record?.contractId &&
        bookingRequestId;

      const canManageContract =
        !isTerminalStatus &&
        normalizedCampaignStatus === "NEGOTIATING" &&
        record?.contractId &&
        bookingRequestId;

      const hasNonViewActions =
        canManageContract || canCancelContract || canCancelBookingRequest;

      const isCancellingContractThisRow =
        isCancellingContract && cancellingContractId === bookingRequestId;
      const isCancellingBookingRequestThisRow =
        isCancellingBookingRequest &&
        cancellingBookingRequestId === bookingRequestId;

      if (!canViewDetail && !hasNonViewActions) {
        return null;
      }

      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {canManageContract ? (
            <>
              <Button
                type="primary"
                style={{
                  color: "#ffffff",
                  height: "2.5rem",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "16px",
                  backgroundColor: BOOKING_FLOW_STYLE.accent,
                }}
                onClick={() => handleAcceptContract(record)}
                loading={isSigningContract}
                disabled={
                  isRejectingContract ||
                  isCancellingContract ||
                  isCancellingBookingRequest
                }
              >
                Chấp nhận hợp đồng
              </Button>
              <Button
                danger
                style={{
                  height: "2.5rem",
                  borderRadius: "16px",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 600,
                }}
                onClick={() => openRejectModal(record)}
                disabled={
                  isSigningContract ||
                  isCancellingContract ||
                  isCancellingBookingRequest
                }
              >
                Từ chối hợp đồng
              </Button>
            </>
          ) : null}
          {canViewDetail ? (
            <Button
              onClick={() => handleViewCampaignDetail(campaignId)}
              disabled={!canViewDetail}
              style={{
                color: "#ffffff",
                height: "2.5rem",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "16px",
                backgroundColor: BOOKING_FLOW_STYLE.accent,
              }}
            >
              Xem chi tiết
            </Button>
          ) : null}
          {/* {canCancelContract ? (
            <Button
              danger
              style={{
                height: "2.5rem",
                borderRadius: "16px",
                backgroundColor: "#dc2626",
                fontWeight: 600,
                color: "#ffffff",
              }}
              onClick={() => handleCancelContract(record)}
              disabled={!bookingRequestId || isAnyActionLoading}
              loading={isCancellingContractThisRow}
            >
              Hủy hợp đồng
            </Button>
          ) : null} */}
          {canCancelBookingRequest ? (
            <Button
              danger
              style={{
                height: "2.5rem",
                borderRadius: "16px",
                backgroundColor: "#dc2626",
                fontWeight: 600,
                color: "#ffffff",
              }}
              onClick={() => handleCancelBookingRequest(record)}
              disabled={!bookingRequestId || isAnyActionLoading}
              loading={isCancellingBookingRequestThisRow}
            >
              Hủy đơn
            </Button>
          ) : null}
        </div>
      );
    },
    [
      handleAcceptContract,
      openRejectModal,
      handleCancelContract,
      handleCancelBookingRequest,
      handleViewCampaignDetail,
      isSigningContract,
      isRejectingContract,
      isCancellingContract,
      isCancellingBookingRequest,
      isAnyActionLoading,
      cancellingContractId,
      cancellingBookingRequestId,
    ]
  );

  const handleRejectModalCancel = () => {
    if (rejectContractMutation.isPending) return;
    closeRejectModal();
  };

  const summaryCards = useMemo(() => {
    const counts = data.reduce((acc, item) => {
      const statusSource =
        item?.campaignStatus ?? item?.status ?? item?.bookingStatus;
      const key =
        typeof statusSource === "string" ? statusSource.toUpperCase() : null;
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const total = Number.isFinite(totalElements) ? totalElements : 0;
    const completed = counts.COMPLETED ?? 0;
    const approved = counts.APPROVED ?? 0;
    const requested = counts.REQUESTED ?? 0;
    const rejected = counts.REJECTED ?? 0;

    return [
      {
        key: "total",
        label: "Tổng chiến dịch",
        value: total.toLocaleString("vi-VN"),
        caption: `Hoàn tất: ${completed.toLocaleString("vi-VN")} chiến dịch`,
        gradient: "from-indigo-500/70 via-sky-500/60 to-cyan-500/50",
        icon: ClipboardList,
      },
      {
        key: "approved",
        label: "Đã phê duyệt",
        value: approved.toLocaleString("vi-VN"),
        caption: "Chiến dịch đang triển khai",
        gradient: "from-emerald-500/70 via-teal-500/60 to-sky-500/50",
        icon: CalendarRange,
      },
      {
        key: "requested",
        label: "Chờ xác nhận",
        value: requested.toLocaleString("vi-VN"),
        caption: "Đang đợi phê duyệt từ quản trị",
        gradient: "from-amber-500/70 via-orange-500/60 to-rose-500/40",
        icon: RefreshCcw,
      },
      {
        key: "rejected",
        label: "Từ chối",
        value: rejected.toLocaleString("vi-VN"),
        caption: "Chiến dịch bị từ chối hoặc hủy",
        gradient: "from-rose-500/70 via-red-500/60 to-orange-500/40",
        icon: Sparkles,
      },
    ];
  }, [data, totalElements]);

  const handlePaginationChange = (nextPage, nextSize) => {
    const sizeChanged = nextSize !== size;
    setSize(nextSize);
    setPage(sizeChanged ? 0 : nextPage - 1);
  };

  const handleRefresh = () => {
    setPage(0);
    refetchHistoryBookingPackage?.();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden py-12 flex items-center justify-center">
      {modalContextHolder}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-10 px-4 md:px-6 lg:px-8">
        {/* SECTION BỘ LỌC */}
        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Bộ lọc thông minh
                </h2>
                <p className="text-sm text-slate-500">
                  Kiểm soát danh sách đơn theo trạng thái và thời gian.
                </p>
              </div>
              <Space size="middle" className="flex flex-wrap">
                <Button
                  icon={<RotateCcw size={16} />}
                  onClick={handleResetFilters}
                  className="!h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
                >
                  Đặt lại
                </Button>
                <Button
                  icon={<RefreshCcw size={16} />}
                  onClick={() => refetchHistoryBookingPackage?.()}
                  loading={isGetHistoryBookingBackage}
                  className="!h-11 !rounded-xl !border-transparent !bg-indigo-500 !text-white hover:!bg-indigo-600"
                >
                  Làm mới
                </Button>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilterSubmit}
              className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-12"
            >
              <Form.Item
                label="Trạng thái booking"
                name="status"
                className="lg:col-span-4"
              >
                <Select
                  placeholder="Chọn trạng thái"
                  allowClear
                  options={PACKAGE_STATUS_FILTER_OPTIONS}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                label="Ngày tạo"
                name="createdRange"
                className="lg:col-span-4"
              >
                <RangePicker
                  className="w-full"
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>

              <div className="md:col-span-2 lg:col-span-12 flex flex-wrap justify-end gap-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Search size={16} />}
                  className="!h-11 !rounded-xl !bg-slate-900 !px-6 hover:!bg-slate-800"
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </Form>
          </div>
        </section>

        {/* SECTION DANH SÁCH ĐƠN */}
        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Danh sách đơn chiến dịch
                </h2>
                <p className="text-sm text-slate-500">
                  Xem nhanh ngân sách, thời gian triển khai và trạng thái của
                  từng đơn.
                </p>
              </div>
              {pageRange ? (
                <Space size="small" className="text-sm text-slate-500">
                  <span>Hiển thị</span>
                  <strong className="text-slate-900">
                    {pageRange.start.toLocaleString("vi-VN")}-
                    {pageRange.end.toLocaleString("vi-VN")}
                  </strong>
                  <span>trong</span>
                  <strong className="text-slate-900">
                    {totalElements.toLocaleString("vi-VN")}
                  </strong>
                </Space>
              ) : (
                <div className="text-sm text-slate-500">
                  Không có dữ liệu để hiển thị.
                </div>
              )}
            </div>

            {/* <div className="mt-6 flex justify-end">
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={handleRefresh}
                loading={isGetHistoryBookingBackage}
                className="!h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
              >
                Làm mới
              </Button>
            </div> */}

            <div className="mt-4">
              {isInitialLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {skeletonItems.map((index) => (
                    <div
                      key={`package-skeleton-${index}`}
                      className="animate-pulse rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm"
                    >
                      <div className="mb-4 h-5 w-32 rounded bg-slate-200/80" />
                      <div className="mb-3 h-4 w-24 rounded bg-slate-200/70" />
                      <div className="space-y-3">
                        <div className="h-4 w-full rounded bg-slate-200/60" />
                        <div className="h-4 w-3/4 rounded bg-slate-200/60" />
                        <div className="h-4 w-2/3 rounded bg-slate-200/60" />
                      </div>
                      <div className="mt-6 h-10 w-28 rounded bg-slate-200/70" />
                    </div>
                  ))}
                </div>
              ) : hasData ? (
                <div className="grid grid-cols-1 gap-4">
                  {data.map((record) => {
                    const key =
                      record?.id ?? record?.campaignId ?? Math.random();
                    const campaignId = record?.campaignId ?? record?.id;
                    const campaignStatusSource =
                      record?.campaignStatus ??
                      record?.status ??
                      record?.bookingStatus;

                    const statusMeta =
                      resolvePackageStatus(campaignStatusSource);

                    const kolNames = Array.isArray(record?.kols)
                      ? record.kols
                          .map((kol) => kol?.displayName)
                          .filter(Boolean)
                      : [];

                    const liveNames = Array.isArray(record?.lives)
                      ? record.lives
                          .map((live) => live?.displayName)
                          .filter(Boolean)
                      : [];

                    return (
                      <article
                        key={key}
                        className="group flex h-full flex-col justify-between gap-5 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(79,70,229,0.5)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Chiến dịch
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {record?.campaignName ?? "--"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Tạo lúc {formatDateTime(record?.createdAt)}
                            </p>
                          </div>
                          <Tag
                            color={statusMeta.color}
                            className="rounded-full px-3 py-1 text-sm font-medium"
                          >
                            {statusMeta.label}
                          </Tag>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          <Tag
                            color="purple"
                            className="rounded-full px-3 py-1 text-sm font-medium"
                          >
                            Gói {record?.packageName ?? "--"}
                          </Tag>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {composeBudgetRange(record?.targetPrice)}
                          </span>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Thời gian</span>
                            <span className="text-right font-medium text-slate-900">
                              {composeCampaignDuration(
                                record?.startDate,
                                record?.endDate
                              )}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">
                              Số Host Chính tham gia
                            </span>
                            <span className="text-right font-semibold text-indigo-600">
                              {kolNames.length}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">
                              Số Trợ LIVE tham gia
                            </span>
                            <span className="text-right font-semibold text-indigo-600">
                              {liveNames.length}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">
                              Mục tiêu chiến dịch
                            </span>
                            <span className="text-right font-semibold text-indigo-600">
                              {record?.objective ?? "--"}
                            </span>
                          </div>
                        </div>

                        {kolNames.length ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">
                              Danh sách Host Chính:
                            </span>{" "}
                            {kolNames.join(", ")}
                          </div>
                        ) : null}

                        {liveNames.length ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">
                              Danh sách Trợ LIVE:
                            </span>{" "}
                            {liveNames.join(", ")}
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          {renderBookingActions(record)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <Sparkles size={28} className="mb-3 text-indigo-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Bạn chưa có đơn chiến dịch nào.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử đặt gói chiến dịch mới hoặc tải lại để cập nhật dữ
                    liệu mới nhất.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <Pagination
                current={page + 1}
                pageSize={size}
                total={totalElements}
                showSizeChanger
                pageSizeOptions={["10", "20", "50", "100"]}
                onChange={handlePaginationChange}
                className="rounded-full border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* MODAL TỪ CHỐI HỢP ĐỒNG */}
        <Modal
          centered
          title="Từ chối hợp đồng"
          open={isRejectModalOpen}
          onOk={handleRejectSubmit}
          onCancel={handleRejectModalCancel}
          okText="Từ chối hợp đồng"
          cancelText="Hủy"
          maskClosable={!rejectContractMutation.isPending}
          confirmLoading={rejectContractMutation.isPending}
          styles={{
            content: { borderRadius: 20 },
            header: { borderRadius: "20px 20px 0 0" },
          }}
        >
          <p className="mb-4 text-sm text-slate-600">
            Nhập lý do từ chối cho chiến dịch{" "}
            <span className="font-semibold text-slate-900">
              {rejectCampaignName}
            </span>
            .
          </p>
          <Input.TextArea
            rows={4}
            maxLength={1000}
            showCount
            value={rejectReason}
            onChange={handleRejectReasonChange}
            placeholder="Ví dụ: Điều khoản chưa phù hợp với ngân sách..."
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 20,
            }}
          />
          {rejectReasonError ? (
            <p className="mt-2 text-sm text-red-500">{rejectReasonError}</p>
          ) : null}
        </Modal>
      </div>
    </div>
  );
};

export default HistoryBookingPackagePage;
