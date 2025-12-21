// src/pages/admin/booking/EditBookingCampain.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import viVN from "antd/locale/vi_VN";
import {
  ArrowLeft,
  Save,
  CalendarRange,
  XCircle,
  Layers,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getKolProfiles, resolveAvatarUrl } from "../../../services/kol/KolAPI";
import {
  adminCreateBookingFromCampaign,
  adminEditBookingRequest,
} from "../../../services/admin/AdminBookingFromCampaignAPI";
import { adminCreateContractPayments } from "../../../services/admin/AdminContractPaymentAPI";
import {
  adminGetCampaignInfo,
  adminGetCampaignBookingDetail,
} from "../../../services/admin/AdminBookingCampaignAPI";

dayjs.locale("vi");

const { Text } = Typography;
const { useBreakpoint } = Grid;

/** ✅ List page route */
const BOOKING_CAMPAIGN_LIST_PATH = "/admin/management-booking-campaigns";

/** ===== Upload constraints ===== */
const MAX_ATTACH_FILES = 5;
const MAX_ATTACH_SIZE_MB = 10;
const MAX_ATTACH_SIZE = MAX_ATTACH_SIZE_MB * 1024 * 1024;
const ALLOWED_ATTACH_EXTS = [
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
];
const ACCEPT_ATTACH = ".xlsx,.xls,.doc,.docx,.pdf,.jpg,.jpeg,.png";

/** ✅ Livestream address constraints */
const MAX_LIVESTREAM_ADDR_LEN = 500;

/** ===== Repeat type (BE-friendly) ===== */
const REPEAT_NONE = "NONE";

/** Helpers */
const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};
const formatDate = (value, pattern = "DD/MM/YYYY") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};
const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const formatArrayText = (items) => {
  if (!Array.isArray(items) || !items.length) return "--";
  return items
    .map((x) => x?.displayName || x?.name || x?.id)
    .filter(Boolean)
    .join(", ");
};

const CAMPAIGN_STATUS_LABEL = {
  REQUESTED: "Đang yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  APPROVED: "Đã phê duyệt",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  COMPLETED: "Hoàn tất",
};
const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  NEGOTIATING: "orange",
  APPROVED: "green",
  ACCEPTED: "cyan",
  REJECTED: "red",
  COMPLETED: "blue",
};

/** ✅ NEW: packageType label ngay trong file */
const PACKAGE_TYPE_LABEL = {
  normal: "Gói thường",
  vip: "Gói VIP",
};
const normalizePackageType = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "vip") return "vip";
  return "normal"; // default
};
const formatPackageType = (value) => {
  const key = normalizePackageType(value);
  return PACKAGE_TYPE_LABEL[key] ?? key;
};

/** Tag render */
const createTagRender = (options) => (tagProps) => {
  const { value, closable, onClose } = tagProps;
  const opt = options.find((o) => o.value === value);
  if (!opt) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[2px] bg-gray-100 rounded-full mr-1 mb-1"
      onClick={(e) => e.stopPropagation()}
    >
      {opt.avatar && (
        <img
          src={opt.avatar}
          alt={opt.name || "KOL"}
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      <span className="text-xs">{opt.name || "KOL"}</span>
      {closable && (
        <span
          onClick={onClose}
          className="cursor-pointer ml-1 text-gray-400 hover:text-red-400"
        >
          ×
        </span>
      )}
    </span>
  );
};

const formatNumberWithCommas = (value) => {
  if (value === undefined || value === null) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const parseAmount = (value) => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).replace(/,/g, "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const normalizeDecimalInput = (
  val,
  { maxIntDigits = 4, maxDecDigits = 2 } = {}
) => {
  const s = String(val ?? "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  if (!s) return "";

  const firstDot = s.indexOf(".");
  if (firstDot === -1) {
    const intOnly = s.replace(/\D/g, "").slice(0, maxIntDigits);
    return intOnly;
  }

  const intPart = s
    .slice(0, firstDot)
    .replace(/\D/g, "")
    .slice(0, maxIntDigits);
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\D/g, "")
    .slice(0, maxDecDigits);

  return decPart ? `${intPart}.${decPart}` : intPart;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).replace(/,/g, ".").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const splitDescToIntroExp = (raw) => {
  const t = String(raw || "").trim();
  if (!t) return { intro: "", experience: "" };

  const lower = t.toLowerCase();
  const key = "kinh nghiệm:";
  const idx = lower.indexOf(key);
  if (idx === -1) return { intro: t, experience: "" };

  const intro = t.slice(0, idx).trim();
  const experience = t.slice(idx + key.length).trim();
  return { intro, experience };
};

const buildDescriptionPayload = (intro, experience) => {
  const a = String(intro || "").trim();
  const b = String(experience || "").trim();
  if (!b) return a;
  if (!a) return `Kinh nghiệm:\n${b}`.trim();
  return `${a}\n\nKinh nghiệm:\n${b}`.trim();
};

/** Stepper */
const TotalInstallmentsStepper = ({
  value = 1,
  onChange,
  onStep,
  min = 1,
  max = 5,
  disabled = false,
}) => {
  const v = Number(value) || min;

  const dec = () => {
    if (disabled) return;
    const next = Math.max(min, v - 1);
    onChange?.(next);
    onStep?.(next);
  };

  const inc = () => {
    if (disabled) return;
    const next = Math.min(max, v + 1);
    onChange?.(next);
    onStep?.(next);
  };

  return (
    <Space.Compact className="w-full">
      <Button onClick={dec} disabled={disabled || v <= min}>
        -
      </Button>
      <Input value={v} readOnly disabled={disabled} className="text-center" />
      <Button onClick={inc} disabled={disabled || v >= max}>
        +
      </Button>
    </Space.Compact>
  );
};

/** Upload helpers */
const getFileExt = (name = "") => {
  const n = String(name || "").toLowerCase();
  const idx = n.lastIndexOf(".");
  return idx >= 0 ? n.slice(idx) : "";
};

const isAllowedAttachFile = (file) => {
  const name = file?.name || file?.filename || "";
  const ext = getFileExt(name);
  return ALLOWED_ATTACH_EXTS.includes(ext);
};

/** Map BE attachments -> Upload fileList */
const mapServerAttachmentsToUploadList = (raw) => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((it, idx) => {
      if (!it) return null;

      if (typeof it === "string") {
        const nameGuess = it.split("/").pop() || `file-${idx + 1}`;
        return {
          uid: `server-${idx}`,
          name: nameGuess,
          status: "done",
          url: it,
          isExisting: true,
        };
      }

      const id =
        it?.id || it?.fileId || it?.attachmentId || it?.uid || `server-${idx}`;
      const name =
        it?.fileName ||
        it?.name ||
        it?.originalName ||
        it?.filename ||
        `file-${idx + 1}`;
      const url = it?.url || it?.fileUrl || it?.downloadUrl || it?.path || "";

      return {
        uid: String(id),
        name,
        status: "done",
        url: url || undefined,
        isExisting: true,
        serverId: id,
      };
    })
    .filter(Boolean);
};

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kolOptions, setKolOptions] = useState([]);
  const [liveOptions, setLiveOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);

  const [instTooLongMap, setInstTooLongMap] = useState({});
  const [attachList, setAttachList] = useState([]);
  const [totalTooLong, setTotalTooLong] = useState(false);
  const [collapseCampaignInfo, setCollapseCampaignInfo] = useState(false);

  // ✅ cảnh báo khi đơn giá đạt 13 chữ số
  const [unitPriceAtLimit, setUnitPriceAtLimit] = useState(false);

  // ✅ chống double submit
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const isBusy = submitting;

  const screens = useBreakpoint();
  const row = location.state || {};

  const campaignIdFromState = row.campaignId;
  const campaignIdFromQuery = search.get("campaignId");
  const campaignId = campaignIdFromState || campaignIdFromQuery || "";

  // Campaign info
  const {
    data: campaignResponse,
    isLoading: isLoadingCampaign,
    error: errorCampaign,
    refetch: refetchCampaignInfo,
  } = useQuery({
    queryKey: ["admin-campaign-info", campaignId],
    queryFn: () => adminGetCampaignInfo(campaignId),
    enabled: !!campaignId,
    retry: false,
  });

  const campaignInfo = campaignResponse?.data ?? campaignResponse ?? null;
  const normalizedStatus = normalizeStatus(campaignInfo?.status);
  const statusLabel =
    CAMPAIGN_STATUS_LABEL[normalizedStatus] ?? normalizedStatus ?? "--";

  // ✅ Auto back to list when campaign is ACCEPTED or REJECTED
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    if (isLoadingCampaign) return;
    if (!campaignInfo) return;

    const st = normalizeStatus(campaignInfo?.status);
    if (st === "ACCEPTED" || st === "REJECTED") {
      redirectedRef.current = true;
      message.info("Campaign đã được xử lý. Quay lại danh sách...");
      navigate(BOOKING_CAMPAIGN_LIST_PATH, { replace: true });
    }
  }, [isLoadingCampaign, campaignInfo, navigate]);

  const isNegotiating = normalizedStatus === "NEGOTIATING";
  const mode = isNegotiating ? "edit" : "create";

  // Booking detail (edit mode)
  const {
    data: campaignBookingRes,
    isLoading: isLoadingCampaignBooking,
    error: errorCampaignBooking,
    refetch: refetchCampaignBooking,
  } = useQuery({
    queryKey: ["admin-campaign-booking-detail", campaignId],
    queryFn: () => adminGetCampaignBookingDetail(campaignId),
    enabled: mode === "edit" && !!campaignId,
    retry: false,
  });

  const bookingsDetail = campaignBookingRes?.data ?? campaignBookingRes ?? null;

  const bookingRequests = useMemo(() => {
    return Array.isArray(bookingsDetail?.bookingRequests)
      ? bookingsDetail.bookingRequests
      : [];
  }, [bookingsDetail?.bookingRequests]);

  const targetBookingRecord = useMemo(() => {
    if (!bookingRequests.length) return null;
    return (
      bookingRequests.find(
        (r) => normalizeStatus(r?.status) === "NEGOTIATING"
      ) || bookingRequests[0]
    );
  }, [bookingRequests]);

  const bookingRequestId =
    targetBookingRecord?.id ||
    targetBookingRecord?.bookingRequestId ||
    targetBookingRecord?.bookingId ||
    row?.bookingRequestId ||
    search.get("bookingRequestId") ||
    "";

  const hasCampaignKols =
    Array.isArray(campaignInfo?.kols) && campaignInfo.kols.length > 0;
  const hasCampaignLives =
    Array.isArray(campaignInfo?.lives) && campaignInfo.lives.length > 0;

  /** Sync installments array theo count */
  const syncInstallmentsByCount = (n) => {
    let count = Number(n);
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (count > 5) count = 5;

    const current = form.getFieldValue("installments") || [];
    const next = Array.isArray(current) ? [...current] : [];

    if (count > next.length) {
      for (let i = next.length; i < count; i++)
        next.push({ amount: "", dueDate: null });
    } else if (count < next.length) {
      next.length = count;
    }

    if (count === 1 && next.length === 0)
      next.push({ amount: "", dueDate: null });
    form.setFieldValue("installments", next);
  };

  // Prefill create mode
  useEffect(() => {
    if (mode !== "create") return;

    const stateRow = location.state || {};
    const intro = stateRow.objective || stateRow.campaignName || "";

    form.setFieldsValue({
      campaignId,
      intro,
      experience: "",

      // ✅ livestreamAddress
      livestreamAddress:
        stateRow.livestreamAddress || campaignInfo?.livestreamAddress || "",

      // ✅ no UI for repeat -> default
      repeatType: REPEAT_NONE,
      dayOfWeek: undefined,

      totalInstallments: 1,
      installments: [{ amount: "", dueDate: null }],

      liveHours: "",
      unitPrice: "",
      discountPercent: "",
      totalAmount: "",
      attachments: [],
    });

    setAttachList([]);
    setUnitPriceAtLimit(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, mode]);

  // ✅ nếu campaignInfo load sau, auto fill livestreamAddress khi đang create & field đang trống
  useEffect(() => {
    if (mode !== "create") return;
    const cur = String(form.getFieldValue("livestreamAddress") || "").trim();
    if (cur) return;
    const addr = String(campaignInfo?.livestreamAddress || "").trim();
    if (addr) form.setFieldValue("livestreamAddress", addr);
  }, [mode, campaignInfo?.livestreamAddress, form]);

  // Prefill edit mode from targetBookingRecord
  useEffect(() => {
    if (mode !== "edit") return;
    if (!targetBookingRecord) return;

    const source = targetBookingRecord;

    const rawInst =
      source?.installments ||
      source?.paymentSchedules ||
      source?.contractPayments ||
      source?.payments ||
      [];

    const installments = Array.isArray(rawInst)
      ? rawInst.slice(0, 5).map((it) => ({
          amount: formatNumberWithCommas(it?.amount ?? it?.paymentAmount ?? ""),
          dueDate: it?.dueDate ? dayjs(it.dueDate) : null,
        }))
      : [];

    const totalInstallments = installments.length || 1;

    const startAtRaw = source?.startAt || source?.start_time || null;
    const repeatUntilRaw = source?.repeatUntil || source?.repeat_until || null;

    const startAt = startAtRaw ? dayjs(startAtRaw).minute(0).second(0) : null;
    const repeatUntil = repeatUntilRaw ? dayjs(repeatUntilRaw) : null;

    // ✅ keep BE values (no UI)
    const repeatTypeBE =
      source?.repeatType ?? source?.repeat_type ?? REPEAT_NONE;
    const dayOfWeekBE =
      source?.dayOfWeek ?? source?.day_of_week ?? source?.dow ?? "";

    const { intro, experience } = splitDescToIntroExp(
      source?.description || ""
    );

    const liveHours =
      source?.hours ??
      source?.liveHours ??
      source?.hoursLive ??
      source?.liveHour ??
      source?.live_duration_hours ??
      "";

    const unitPrice =
      source?.unitPrice ??
      source?.pricePerHour ??
      source?.unit_price ??
      source?.unitPricePerHour ??
      "";

    const discountPercent =
      source?.discount ??
      source?.discountPercent ??
      source?.discount_rate ??
      "";

    // ✅ warning state theo unitPrice từ BE
    const unitDigits = String(unitPrice || "").replace(/\D/g, "");
    setUnitPriceAtLimit(unitDigits.length >= 13);

    form.setFieldsValue({
      campaignId: source?.campaignId || campaignId,
      intro,
      experience,

      // ✅ livestreamAddress (ưu tiên booking, fallback campaign)
      livestreamAddress:
        source?.livestreamAddress ||
        source?.liveAddress ||
        campaignInfo?.livestreamAddress ||
        "",

      startAt,
      repeatUntil,

      kolIds:
        source?.kolIds || source?.kols?.map((k) => k?.id).filter(Boolean) || [],
      liveIds:
        source?.liveIds ||
        source?.lives?.map((l) => l?.id).filter(Boolean) ||
        [],

      totalInstallments,
      installments: installments.length
        ? installments
        : [{ amount: "", dueDate: null }],

      repeatType: repeatTypeBE || REPEAT_NONE,
      dayOfWeek: dayOfWeekBE || undefined,

      liveHours: liveHours
        ? normalizeDecimalInput(liveHours, { maxIntDigits: 4, maxDecDigits: 2 })
        : "",
      unitPrice: unitPrice ? formatNumberWithCommas(unitPrice) : "",
      discountPercent: discountPercent
        ? normalizeDecimalInput(discountPercent, {
            maxIntDigits: 3,
            maxDecDigits: 2,
          })
        : "",
      totalAmount: "", // auto compute
      attachments: [],
    });

    // Prefill attachments (để xoá từng file khi update)
    const serverAttach =
      source?.attachments ||
      source?.attachmentFiles ||
      source?.files ||
      source?.fileAttachments ||
      [];
    const serverFileList = mapServerAttachmentsToUploadList(serverAttach);

    setAttachList(serverFileList);
    form.setFieldValue("attachments", serverFileList);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetBookingRecord]);

  // Load KOL/LIVE
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchKols = async () => {
      try {
        setLoadingKols(true);

        const res = await getKolProfiles({
          signal: controller.signal,
          params: { page: 0, size: 500 },
        });

        if (ignore) return;
        const list = Array.isArray(res?.content) ? res.content : [];

        const buildOption = (item) => {
          const name =
            item.displayName ||
            item.fullName ||
            item.username ||
            item.email ||
            item.phone ||
            item.id;

          const avatar = resolveAvatarUrl(item) || item.avatarUrl || "";

          return {
            label: (
              <div className="flex items-center gap-2">
                {avatar && (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span>{name}</span>
              </div>
            ),
            value: item.id,
            name,
            avatar,
            searchText: `${name} ${item.id}`,
          };
        };

        const kolOpts = list
          .filter((i) => String(i?.role || "").toUpperCase() === "KOL")
          .map(buildOption);

        const liveOpts = list
          .filter((i) => String(i?.role || "").toUpperCase() === "LIVE")
          .map(buildOption);

        setKolOptions(kolOpts);
        setLiveOptions(liveOpts);
      } catch (err) {
        if (!ignore) {
          console.error("Fetch KOL/LIVE error:", err);
          message.open({
            type: "error",
            content: "Không tải được danh sách KOL / trợ LIVE",
            icon: <XCircle size={18} className="text-red-500" />,
          });
        }
      } finally {
        if (!ignore) setLoadingKols(false);
      }
    };

    fetchKols();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const disabledStartDate = (current) => {
    if (!current) return false;
    return current < dayjs().startOf("day");
  };

  const disabledRepeatUntilDate = (current) => {
    if (!current) return false;
    const startAt = form.getFieldValue("startAt");
    if (!startAt) return current < dayjs().startOf("day");
    const minEndDate = dayjs(startAt).startOf("day").add(1, "day");
    return current < minEndDate;
  };

  const disabledDueDateByIndex = (current, index) => {
    if (!current) return false;

    const today = dayjs().startOf("day");
    if (index === 0) return current < today;

    const installments = form.getFieldValue("installments") || [];
    const prev = installments?.[index - 1]?.dueDate;

    if (!prev) return current < today;

    const min = dayjs(prev).startOf("day").add(1, "day");
    return current < min;
  };

  const normalizeStartAtMinute = (val) => {
    if (!val) return val;
    const d = dayjs(val);
    if (!d.isValid()) return val;
    return d.minute(0).second(0);
  };

  // watchers
  const watchInstallments = Form.useWatch("installments", form);
  const watchTotalAmountRaw = Form.useWatch("totalAmount", form);

  const watchLiveHoursRaw = Form.useWatch("liveHours", form);
  const watchUnitPriceRaw = Form.useWatch("unitPrice", form);
  const watchDiscountRaw = Form.useWatch("discountPercent", form);

  // ✅ livestreamAddress watcher (fix rules-of-hooks lint)
  const useWatch = Form.useWatch;
  const watchLivestreamAddress = useWatch("livestreamAddress", form);
  const livestreamAddrLen = String(watchLivestreamAddress || "").length;
  const livestreamAddrAtLimit = livestreamAddrLen >= MAX_LIVESTREAM_ADDR_LEN;

  // soft validate (giảm lag)
  const validateTimerRef = useRef(null);
  const softValidateSumGuard = () => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(() => {
      form.validateFields(["__sumGuard"]).catch(() => {});
    }, 120);
  };

  // compute totalAmount
  useEffect(() => {
    const hours = parseDecimal(watchLiveHoursRaw);
    const unit = parseAmount(watchUnitPriceRaw);
    const disc = parseDecimal(watchDiscountRaw);

    const hasHours =
      typeof hours === "number" && !Number.isNaN(hours) && hours > 0;
    const hasUnit = typeof unit === "number" && !Number.isNaN(unit) && unit > 0;

    if (!hasHours || !hasUnit) {
      form.setFieldValue("totalAmount", "");
      setTotalTooLong(false);
      softValidateSumGuard();
      return;
    }

    const safeDisc =
      typeof disc === "number" && Number.isFinite(disc) ? disc : 0;
    const d = Math.min(100, Math.max(0, safeDisc));

    const total = Math.round(hours * unit * (1 - d / 100));
    const digits = String(total).replace(/\D/g, "");
    setTotalTooLong(digits.length > 13);

    form.setFieldValue(
      "totalAmount",
      formatNumberWithCommas(digits.slice(0, 13))
    );
    softValidateSumGuard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchLiveHoursRaw, watchUnitPriceRaw, watchDiscountRaw, mode]);

  /** ✅ validate installments sum == totalAmount */
  const sumState = useMemo(() => {
    const totalAmount = parseAmount(watchTotalAmountRaw);

    const list = Array.isArray(watchInstallments) ? watchInstallments : [];
    const amounts = list
      .map((i) => parseAmount(i?.amount))
      .filter((v) => typeof v === "number" && !Number.isNaN(v));

    const hasAnyInstallmentAmount = amounts.length > 0;
    const sumInstallments = amounts.reduce((acc, v) => acc + v, 0);

    const sumMismatch =
      !!totalAmount &&
      hasAnyInstallmentAmount &&
      sumInstallments !== totalAmount;

    return {
      totalAmount,
      hasAnyInstallmentAmount,
      sumInstallments,
      sumMismatch,
    };
  }, [watchInstallments, watchTotalAmountRaw]);

  const disableSave =
    isBusy ||
    sumState.sumMismatch ||
    (mode === "edit" &&
      (isLoadingCampaignBooking ||
        !!errorCampaignBooking ||
        !targetBookingRecord));

  const onSubmit = async (values) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);

    try {
      if (!values.campaignId) throw new Error("Thiếu campaignId");

      const rawInstallments = Array.isArray(values.installments)
        ? values.installments
        : [];

      const cleanedInstallments = rawInstallments
        .map((ins) => {
          const amount = parseAmount(ins?.amount);

          let dueDate;
          if (dayjs.isDayjs(ins?.dueDate))
            dueDate = ins.dueDate.format("YYYY-MM-DD");
          else if (ins?.dueDate) {
            const d = dayjs(ins.dueDate);
            dueDate = d.isValid() ? d.format("YYYY-MM-DD") : undefined;
          }

          if (!amount || !dueDate) return null;
          return { amount, dueDate };
        })
        .filter(Boolean);

      let totalInstallments = Number(values.totalInstallments);
      if (!Number.isFinite(totalInstallments) || totalInstallments <= 0)
        totalInstallments = 1;
      if (totalInstallments > 5) totalInstallments = 5;

      const description = buildDescriptionPayload(
        values.intro,
        values.experience
      );

      const liveHours = parseDecimal(values.liveHours);
      const unitPrice = parseAmount(values.unitPrice);
      const discountPercent = parseDecimal(values.discountPercent);
      const totalAmount = parseAmount(values.totalAmount);

      // ✅ bỏ “giá booking” -> dùng totalAmount làm contractAmount
      const contractAmount =
        typeof totalAmount === "number" ? totalAmount : undefined;

      const attachments = Array.isArray(values.attachments)
        ? values.attachments
        : [];

      const livestreamAddress = String(values.livestreamAddress || "").trim();

      if (mode === "create") {
        const bookingPayload = {
          campaignId: values.campaignId,
          description,

          livestreamAddress: livestreamAddress || undefined,

          repeatType: REPEAT_NONE,
          dayOfWeek: undefined,

          startAt: values.startAt,
          repeatUntil: values.repeatUntil,

          contractAmount,

          kolIds: values.kolIds,
          liveIds: values.liveIds,

          liveHours: typeof liveHours === "number" ? liveHours : undefined,
          unitPrice: typeof unitPrice === "number" ? unitPrice : undefined,
          discountPercent:
            typeof discountPercent === "number" ? discountPercent : undefined,
          totalAmount:
            typeof totalAmount === "number" ? totalAmount : undefined,

          attachments,
        };

        const bookingResult = await adminCreateBookingFromCampaign(
          bookingPayload
        );
        const data = bookingResult?.data ?? bookingResult ?? {};

        const contractId =
          data.contractId ||
          data.contract_id ||
          data.contract?.id ||
          data.contract?.contractId ||
          null;

        const bookingRequestIdCreated =
          data.bookingRequestId ||
          data.booking_request_id ||
          data.bookingRequest?.id ||
          data.booking?.id ||
          data.bookingId ||
          data.id ||
          null;

        if (cleanedInstallments.length > 0) {
          if (!contractId || !bookingRequestIdCreated) {
            message.open({
              type: "error",
              content:
                "Đã tạo booking nhưng không lấy được contractId/bookingRequestId để tạo lịch thanh toán.",
              icon: <XCircle size={18} className="text-red-500" />,
            });
          } else {
            await adminCreateContractPayments({
              contractId,
              bookingRequestId: bookingRequestIdCreated,
              totalInstallments,
              installments: cleanedInstallments,
            });
          }
        }

        message.success("Tạo yêu cầu chiến dịch thành công ");
        navigate(BOOKING_CAMPAIGN_LIST_PATH, { replace: true });
        return;
      }

      // EDIT mode
      if (!bookingRequestId) {
        message.open({
          type: "error",
          content: "Không tìm thấy yêu cầu đặt lịch để cập nhật.",
          icon: <XCircle size={18} className="text-red-500" />,
        });
        return;
      }

      const startAtBase = values.startAt ? dayjs(values.startAt) : null;
      const endAtAuto = startAtBase ? startAtBase.add(1, "hour") : null;

      await adminEditBookingRequest(bookingRequestId, {
        description,

        livestreamAddress: livestreamAddress || undefined,

        repeatType: values.repeatType ?? REPEAT_NONE,
        dayOfWeek: values.dayOfWeek,

        startAt: values.startAt,
        endAt: endAtAuto,
        repeatUntil: values.repeatUntil,

        contractAmount,

        liveHours: typeof liveHours === "number" ? liveHours : undefined,
        unitPrice: typeof unitPrice === "number" ? unitPrice : undefined,
        discountPercent:
          typeof discountPercent === "number" ? discountPercent : undefined,
        totalAmount: typeof totalAmount === "number" ? totalAmount : undefined,

        kolIds: Array.isArray(values.kolIds) ? values.kolIds : [],
        liveIds: Array.isArray(values.liveIds) ? values.liveIds : [],

        attachments,
      });

      message.success("Cập nhật yêu cầu chiến dịch thành công ");
      refetchCampaignBooking?.();
      refetchCampaignInfo?.();
    } catch (err) {
      const beMsg =
        err?.response?.data?.message?.[0] ||
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        "";

      const is409 = err?.response?.status === 409 || err?.appStatus === 409;

      message.open({
        type: "error",
        content:
          (is409 &&
            (beMsg ||
              "Campaign này đã có đơn đặt chiến dịch, không thể tạo thêm.")) ||
          beMsg ||
          (mode === "edit" ? "Cập nhật thất bại" : "Tạo thất bại"),
        icon: <XCircle size={18} className="text-red-500" />,
      });
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  /** Upload handlers */
  const onChangeAttachment = (info) => {
    let next = Array.isArray(info?.fileList) ? [...info.fileList] : [];

    next = next.filter((f) => {
      const raw = f?.originFileObj || f;
      return isAllowedAttachFile(raw);
    });

    next = next.filter((f) => {
      const raw = f?.originFileObj || f;
      const size = raw?.size || 0;
      return size <= MAX_ATTACH_SIZE;
    });

    if (next.length > MAX_ATTACH_FILES) {
      message.warning(`Chỉ được đính kèm tối đa ${MAX_ATTACH_FILES} tệp.`);
      next = next.slice(0, MAX_ATTACH_FILES);
    }

    setAttachList(next);
    form.setFieldValue("attachments", next);
  };

  const onRemoveAttachment = (file) => {
    const next = (attachList || []).filter((f) => f.uid !== file.uid);
    setAttachList(next);
    form.setFieldValue("attachments", next);
    return true;
  };

  const formCardTitle =
    mode === "edit"
      ? "Thông tin chỉnh sửa đơn đặt chiến dịch"
      : "Thông tin tạo đơn đặt chiến dịch";

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold uppercase">
                {mode === "edit"
                  ? "Chỉnh sửa yêu cầu chiến dịch"
                  : "Tạo đơn đặt chiến dịch"}
              </h1>
            </div>
          </div>

          <Space>
            <Button
              type="default"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
              disabled={isBusy}
            >
              Quay lại
            </Button>
          </Space>
        </div>

        {/* Campaign info */}
        <Card
          className="shadow-sm"
          bordered={false}
          loading={isLoadingCampaign}
          title={
            <Space>
              <Layers size={18} />
              <span>Thông tin yêu cầu từ khách hàng</span>
            </Space>
          }
          extra={
            <Button
              size="small"
              type="default"
              onClick={() => setCollapseCampaignInfo((v) => !v)}
              disabled={isBusy}
              icon={
                collapseCampaignInfo ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )
              }
            >
              {collapseCampaignInfo ? "Mở rộng" : "Thu gọn"}
            </Button>
          }
        >
          {errorCampaign ? (
            <Alert
              type="error"
              showIcon
              message="Không thể tải thông tin campaign."
              description={String(errorCampaign?.message ?? "")}
            />
          ) : campaignInfo ? (
            <>
              <Space size="middle" wrap className="justify-between w-full mb-4">
                <Tag
                  color={CAMPAIGN_STATUS_COLOR[normalizedStatus] ?? "default"}
                >
                  {statusLabel}
                </Tag>
              </Space>

              {collapseCampaignInfo ? (
                <Descriptions
                  bordered
                  size="middle"
                  column={screens.lg ? 3 : screens.md ? 2 : 1}
                  styles={{ label: { width: 180 } }}
                >
                  <Descriptions.Item label="Tên Campaign">
                    {campaignInfo?.name ?? "--"}
                  </Descriptions.Item>

                  {/* ✅ NEW: packageType */}
                  <Descriptions.Item label="Gói dịch vụ">
                    {formatPackageType(campaignInfo?.packageType ?? "normal")}
                  </Descriptions.Item>

                  <Descriptions.Item label="Thời gian">
                    {formatDate(campaignInfo?.startDate)} -{" "}
                    {formatDate(campaignInfo?.endDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người đặt">
                    {campaignInfo?.ordererFullName ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {campaignInfo?.ordererPhone ? (
                      <Text copyable>{campaignInfo.ordererPhone}</Text>
                    ) : (
                      "--"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số giờ livestream">
                    {campaignInfo?.livestreamHours ?? "--"}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Descriptions
                  bordered
                  size="middle"
                  column={screens.lg ? 3 : screens.md ? 2 : 1}
                  styles={{ label: { width: 180 } }}
                >
                  <Descriptions.Item label="Tên Campaign">
                    {campaignInfo?.name ?? "--"}
                  </Descriptions.Item>

                  {/* ✅ NEW: packageType */}
                  <Descriptions.Item label="Gói dịch vụ">
                    {formatPackageType(campaignInfo?.packageType ?? "normal")}
                  </Descriptions.Item>

                  <Descriptions.Item label="Họ và tên người đặt">
                    {campaignInfo?.ordererFullName ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {campaignInfo?.ordererPhone ? (
                      <Text copyable>{campaignInfo.ordererPhone}</Text>
                    ) : (
                      "--"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Text copyable>{campaignInfo?.createdBy ?? "--"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mục tiêu" span={screens.lg ? 3 : 1}>
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {campaignInfo?.objective ?? "--"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày bắt đầu">
                    {formatDate(campaignInfo?.startDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày kết thúc">
                    {formatDate(campaignInfo?.endDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số giờ livestream">
                    {campaignInfo?.livestreamHours ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Địa chỉ livestream"
                    span={screens.lg ? 3 : 1}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {campaignInfo?.livestreamAddress ?? "--"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Địa chỉ thường trú"
                    span={screens.lg ? 3 : 1}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {campaignInfo?.permanentAddress ?? "--"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã số thuế">
                    {campaignInfo?.taxCode ? (
                      <Text copyable>{campaignInfo.taxCode}</Text>
                    ) : (
                      "--"
                    )}
                  </Descriptions.Item>

                  {hasCampaignKols && (
                    <Descriptions.Item
                      label="KOL tham gia"
                      span={screens.lg ? 3 : 1}
                    >
                      {formatArrayText(campaignInfo?.kols)}
                    </Descriptions.Item>
                  )}
                  {hasCampaignLives && (
                    <Descriptions.Item
                      label="Trợ Live tham gia"
                      span={screens.lg ? 3 : 1}
                    >
                      {formatArrayText(campaignInfo?.lives)}
                    </Descriptions.Item>
                  )}

                  <Descriptions.Item label="Tạo lúc">
                    {formatDateTime(campaignInfo?.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập nhật lúc">
                    {formatDateTime(campaignInfo?.updatedAt)}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </>
          ) : (
            <Text type="secondary">Không có dữ liệu campaign.</Text>
          )}
        </Card>

        {/* Form */}
        <Card
          bordered={false}
          className="shadow-sm"
          title={
            <Space>
              <Layers size={18} />
              <span>{formCardTitle}</span>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            disabled={isBusy}
          >
            {/* ✅ Ẩn Campaign ID nhưng vẫn submit */}
            <Form.Item
              name="campaignId"
              hidden
              rules={[{ required: true, message: "Thiếu campaignId" }]}
            >
              <Input />
            </Form.Item>

            {/* ✅ hidden repeat fields (no UI) */}
            <Form.Item name="repeatType" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="dayOfWeek" hidden>
              <Input />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Thời điểm bắt đầu"
                  name="startAt"
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    () => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (
                          dayjs(value).isBefore(dayjs().startOf("day"), "day")
                        ) {
                          return Promise.reject(
                            new Error("Ngày bắt đầu phải từ hôm nay trở đi.")
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{
                      format: "HH:mm",
                      minuteStep: 60,
                      defaultValue: dayjs().minute(0).second(0),
                    }}
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn ngày giờ bắt đầu"
                    disabledDate={disabledStartDate}
                    inputReadOnly
                    onChange={(val) => {
                      const fixed = normalizeStartAtMinute(val);
                      if (fixed) form.setFieldValue("startAt", fixed);
                      setTimeout(
                        () =>
                          form.validateFields(["repeatUntil"]).catch(() => {}),
                        0
                      );
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Thời điểm kết thúc"
                  name="repeatUntil"
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        const startAt = getFieldValue("startAt");
                        if (!startAt) return Promise.resolve();
                        const startDate = dayjs(startAt).startOf("day");
                        const endDate = dayjs(value).startOf("day");
                        if (endDate.isAfter(startDate))
                          return Promise.resolve();
                        return Promise.reject(
                          new Error("Ngày kết thúc phải sau ngày bắt đầu.")
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày kết thúc lặp"
                    disabledDate={disabledRepeatUntilDate}
                    inputReadOnly
                  />
                </Form.Item>
              </Col>

              {/* ✅ Livestream address + warning dưới input khi đạt max */}
              <Col xs={24}>
                <Form.Item
                  label="Địa chỉ livestream"
                  name="livestreamAddress"
                  validateStatus={livestreamAddrAtLimit ? "warning" : undefined}
                  help={
                    livestreamAddrAtLimit
                      ? `Đã đạt tối đa ${MAX_LIVESTREAM_ADDR_LEN} ký tự.`
                      : undefined
                  }
                  rules={[
                    {
                      validator: (_, v) => {
                        if (!v) return Promise.resolve();
                        if (String(v).length > MAX_LIVESTREAM_ADDR_LEN) {
                          return Promise.reject(
                            new Error(`Tối đa ${MAX_LIVESTREAM_ADDR_LEN} ký tự`)
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={2}
                    maxLength={MAX_LIVESTREAM_ADDR_LEN}
                    placeholder="Nhập địa chỉ livestream (không bắt buộc)"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Số giờ livestream"
                  name="liveHours"
                  normalize={(val) =>
                    normalizeDecimalInput(val, {
                      maxIntDigits: 4,
                      maxDecDigits: 2,
                    })
                  }
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    {
                      validator: (_, v) => {
                        const n = parseDecimal(v);
                        if (n === undefined) return Promise.resolve();
                        if (n <= 0)
                          return Promise.reject(
                            new Error("Số giờ live phải > 0")
                          );
                        if (n > 9999.99)
                          return Promise.reject(
                            new Error("Số giờ live quá lớn")
                          );
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="VD: 2 hoặc 2.5" inputMode="decimal" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Đơn giá (VND/giờ)"
                  name="unitPrice"
                  validateStatus={unitPriceAtLimit ? "warning" : undefined}
                  help={
                    unitPriceAtLimit
                      ? "Đơn giá đã đạt tối đa 13 chữ số."
                      : undefined
                  }
                  normalize={(val) => {
                    const digits = String(val || "").replace(/\D/g, "");
                    const limited = digits.slice(0, 13);
                    return formatNumberWithCommas(limited);
                  }}
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    {
                      validator: (_, v) => {
                        const raw = String(v || "")
                          .replace(/,/g, "")
                          .trim();
                        if (!raw) return Promise.resolve();
                        if (!/^\d+$/.test(raw))
                          return Promise.reject(
                            new Error("Đơn giá không hợp lệ")
                          );
                        if (Number(raw) <= 0)
                          return Promise.reject(new Error("Đơn giá phải > 0"));
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="VD: 500,000"
                    inputMode="numeric"
                    onChange={(e) => {
                      const digits = String(e?.target?.value || "").replace(
                        /\D/g,
                        ""
                      );
                      setUnitPriceAtLimit(digits.length >= 13);
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Giảm giá (%)"
                  name="discountPercent"
                  normalize={(val) =>
                    normalizeDecimalInput(val, {
                      maxIntDigits: 3,
                      maxDecDigits: 2,
                    })
                  }
                  rules={[
                    {
                      validator: (_, v) => {
                        if (
                          v === undefined ||
                          v === null ||
                          String(v).trim() === ""
                        )
                          return Promise.resolve();
                        const n = parseDecimal(v);
                        if (n === undefined)
                          return Promise.reject(
                            new Error("Giảm giá không hợp lệ")
                          );
                        if (n < 0 || n > 100)
                          return Promise.reject(
                            new Error("Giảm giá phải từ 0 - 100")
                          );
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="VD: 10 hoặc 10.5" inputMode="decimal" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Tổng tiền (VND)"
                  name="totalAmount"
                  validateStatus={totalTooLong ? "error" : undefined}
                  help={
                    totalTooLong
                      ? "Tổng tiền vượt quá 13 chữ số (đang bị cắt bớt)"
                      : undefined
                  }
                >
                  <Input readOnly placeholder="Tổng tiền đơn hàng" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Tệp đính kèm"
                  name="attachments"
                  valuePropName="fileList"
                  getValueFromEvent={(e) =>
                    Array.isArray(e) ? e : e?.fileList
                  }
                >
                  <>
                    <Upload
                      multiple
                      maxCount={MAX_ATTACH_FILES}
                      disabled={isBusy}
                      beforeUpload={(file) => {
                        if (!isAllowedAttachFile(file)) {
                          message.error(
                            "Chỉ hỗ trợ: .xlsx, .xls, .doc, .docx, .pdf và ảnh (jpg, png...)."
                          );
                          return Upload.LIST_IGNORE;
                        }
                        if ((file?.size || 0) > MAX_ATTACH_SIZE) {
                          message.error(
                            `Mỗi tệp tối đa ${MAX_ATTACH_SIZE_MB}MB.`
                          );
                          return Upload.LIST_IGNORE;
                        }
                        const current =
                          form.getFieldValue("attachments") || attachList || [];
                        if (
                          Array.isArray(current) &&
                          current.length >= MAX_ATTACH_FILES
                        ) {
                          message.error(
                            `Chỉ được đính kèm tối đa ${MAX_ATTACH_FILES} tệp.`
                          );
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                      fileList={attachList}
                      accept={ACCEPT_ATTACH}
                      onChange={onChangeAttachment}
                      onRemove={onRemoveAttachment}
                      showUploadList={{
                        showRemoveIcon: true,
                        removeIcon: <X size={14} />,
                        showPreviewIcon: true,
                      }}
                    >
                      <Button icon={<Paperclip size={16} />} disabled={isBusy}>
                        Chọn tệp
                      </Button>
                    </Upload>

                    <div className="text-xs text-gray-500 mt-1">
                      Chỉ hỗ trợ: .xlsx, .xls, .doc, .docx, .pdf và ảnh (jpg,
                      png...). Tối đa {MAX_ATTACH_FILES} tệp (mỗi tệp tối đa{" "}
                      {MAX_ATTACH_SIZE_MB}MB).
                    </div>
                  </>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Mô tả chiến dịch" name="intro">
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    placeholder="Nhập giới thiệu..."
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Host chính" name="kolIds">
                  <Select
                    mode="multiple"
                    placeholder="Chọn KOL (không bắt buộc)"
                    options={kolOptions}
                    loading={loadingKols}
                    allowClear
                    showSearch
                    optionFilterProp="searchText"
                    filterOption={(input, option) =>
                      (option?.searchText || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    tagRender={createTagRender(kolOptions)}
                    disabled={isBusy}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Trợ Live" name="liveIds">
                  <Select
                    mode="multiple"
                    placeholder="Chọn trợ LIVE (không bắt buộc)"
                    options={liveOptions}
                    loading={loadingKols}
                    allowClear
                    showSearch
                    optionFilterProp="searchText"
                    filterOption={(input, option) =>
                      (option?.searchText || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    tagRender={createTagRender(liveOptions)}
                    disabled={isBusy}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Payment schedule */}
            <div className="mt-6 border-t pt-4">
              <h2 className="text-base font-semibold mb-2">
                Cấu hình thanh toán hợp đồng
              </h2>

              {sumState.sumMismatch && (
                <Alert
                  type="error"
                  showIcon
                  className="mb-3"
                  message="Tổng số tiền các đợt thanh toán phải bằng Tổng tiền của chiến dịch (VND)."
                  description={
                    sumState.totalAmount
                      ? `Tổng đợt hiện tại: ${formatNumberWithCommas(
                          sumState.sumInstallments
                        )} / Tổng tiền: ${formatNumberWithCommas(
                          sumState.totalAmount
                        )}`
                      : undefined
                  }
                />
              )}

              <Form.Item
                name="__sumGuard"
                style={{ display: "none" }}
                dependencies={["installments", "totalAmount"]}
                rules={[
                  () => ({
                    validator() {
                      if (sumState.sumMismatch) {
                        return Promise.reject(
                          new Error(
                            "Tổng số tiền các đợt thanh toán phải bằng Tổng tiền (VND)."
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input style={{ display: "none" }} />
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Số lần thanh toán (1 - 5)"
                    name="totalInstallments"
                    initialValue={1}
                    getValueFromEvent={(v) => v}
                    rules={[
                      { required: true, message: "Bắt buộc" },
                      {
                        validator: (_, v) => {
                          const n = Number(v);
                          if (!Number.isFinite(n))
                            return Promise.reject(
                              new Error("Giá trị không hợp lệ")
                            );
                          if (n < 1 || n > 5)
                            return Promise.reject(
                              new Error("Chỉ được từ 1 - 5")
                            );
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <TotalInstallmentsStepper
                      min={1}
                      max={5}
                      disabled={isBusy}
                      onStep={(n) => {
                        syncInstallmentsByCount(n);
                        softValidateSumGuard();
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.List name="installments">
                {(fields) => (
                  <>
                    {fields.map((field, index) => {
                      const tooLong = !!instTooLongMap[field.key];

                      return (
                        <Row key={field.key} gutter={[8, 8]} align="middle">
                          <Col xs={24} md={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "amount"]}
                              fieldKey={[field.fieldKey, "amount"]}
                              label={
                                index === 0 ? "Số tiền đợt thanh toán" : ""
                              }
                              validateStatus={tooLong ? "error" : undefined}
                              help={
                                tooLong
                                  ? "Chỉ có thể nhập tối đa 13 chữ số"
                                  : undefined
                              }
                              normalize={(val) => {
                                const digits = String(val || "").replace(
                                  /\D/g,
                                  ""
                                );
                                const limited = digits.slice(0, 13);
                                return formatNumberWithCommas(limited);
                              }}
                              rules={[
                                { required: true, message: "Bắt buộc" },
                                {
                                  validator: (_, v) => {
                                    const raw = String(v || "")
                                      .replace(/,/g, "")
                                      .trim();
                                    if (!raw) return Promise.resolve();
                                    if (!/^\d+$/.test(raw))
                                      return Promise.reject(
                                        new Error("Số tiền không hợp lệ")
                                      );
                                    if (raw.length > 13)
                                      return Promise.reject(
                                        new Error(
                                          "Chỉ có thể nhập tối đa 13 chữ số"
                                        )
                                      );
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input
                                placeholder="1,000,000"
                                inputMode="numeric"
                                onChange={(e) => {
                                  const digits = String(
                                    e?.target?.value || ""
                                  ).replace(/\D/g, "");
                                  setInstTooLongMap((prev) => ({
                                    ...prev,
                                    [field.key]: digits.length > 13,
                                  }));
                                  softValidateSumGuard();
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "dueDate"]}
                              fieldKey={[field.fieldKey, "dueDate"]}
                              label={index === 0 ? "Hạn thanh toán" : ""}
                              dependencies={
                                index > 0
                                  ? [["installments", index - 1, "dueDate"]]
                                  : undefined
                              }
                              rules={[
                                { required: true, message: "Bắt buộc" },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value) return Promise.resolve();

                                    const today = dayjs().startOf("day");
                                    const cur = dayjs(value).startOf("day");
                                    if (cur.isBefore(today)) {
                                      return Promise.reject(
                                        new Error(
                                          "Hạn thanh toán phải chọn từ ngày hôm nay trở đi."
                                        )
                                      );
                                    }

                                    if (index > 0) {
                                      const installments =
                                        getFieldValue("installments") || [];
                                      const prev =
                                        installments?.[index - 1]?.dueDate;
                                      if (prev) {
                                        const prevDay =
                                          dayjs(prev).startOf("day");
                                        if (!cur.isAfter(prevDay)) {
                                          return Promise.reject(
                                            new Error(
                                              "Hạn thanh toán của đợt sau phải sau đợt trước."
                                            )
                                          );
                                        }
                                      }
                                    }
                                    return Promise.resolve();
                                  },
                                }),
                              ]}
                            >
                              <DatePicker
                                className="w-full"
                                format="DD/MM/YYYY"
                                placeholder="Chọn hạn thanh toán"
                                disabledDate={(current) =>
                                  disabledDueDateByIndex(current, index)
                                }
                                inputReadOnly
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      );
                    })}
                  </>
                )}
              </Form.List>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                htmlType="submit"
                type="primary"
                icon={<Save size={16} />}
                disabled={disableSave}
                loading={isBusy}
              >
                {mode === "edit"
                  ? "Cập nhật yêu cầu chiến dịch"
                  : "Tạo yêu cầu chiến dịch"}
              </Button>

              <Button onClick={() => navigate(-1)} disabled={isBusy}>
                Hủy
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
