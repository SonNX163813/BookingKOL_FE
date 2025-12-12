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

/** ===== Repeat type (BE-friendly) ===== */
const REPEAT_NONE = "NONE";
const REPEAT_DAILY = "DAILY";
const REPEAT_WEEKLY = "WEEKLY";

const DOW = [
  { key: "MON", label: "T2" },
  { key: "TUE", label: "T3" },
  { key: "WED", label: "T4" },
  { key: "THU", label: "T5" },
  { key: "FRI", label: "T6" },
  { key: "SAT", label: "T7" },
  { key: "SUN", label: "CN" },
];
const DOW_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const isDowKey = (v) => DOW_ORDER.includes(v);

const buildRepeatTypeTextFromSelection = (selection = []) => {
  const sel = Array.isArray(selection) ? selection : [];
  if (sel.includes(REPEAT_NONE)) return "Không lặp";
  if (sel.includes(REPEAT_DAILY)) return "Hàng ngày";

  const days = sel.filter(isDowKey);
  if (days.length) {
    const sorted = [...new Set(days)].sort(
      (a, b) => DOW_ORDER.indexOf(a) - DOW_ORDER.indexOf(b)
    );
    const labels = sorted
      .map((k) => DOW.find((x) => x.key === k)?.label)
      .filter(Boolean);
    return `Hàng tuần: ${labels.join(", ")}`;
  }
  return "Không lặp";
};

const parseRepeatTypeTextToSelection = (value) => {
  const text = String(value || "").trim();
  if (!text) return [];

  const lower = text.toLowerCase();
  if (lower.includes("không lặp")) return [REPEAT_NONE];
  if (lower.includes("hàng ngày")) return [REPEAT_DAILY];

  const mapLabelToKey = {
    T2: "MON",
    T3: "TUE",
    T4: "WED",
    T5: "THU",
    T6: "FRI",
    T7: "SAT",
    CN: "SUN",
  };

  const m = text.match(/Hàng tuần:\s*(.*)$/i);
  if (m?.[1]) {
    const labels = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const days = labels.map((lb) => mapLabelToKey[lb]).filter(Boolean);
    return [...new Set(days)];
  }

  const found = Object.keys(mapLabelToKey).filter((lb) => text.includes(lb));
  if (found.length)
    return [...new Set(found.map((lb) => mapLabelToKey[lb]).filter(Boolean))];

  return [];
};

const parseRepeatSelectionFromBE = (repeatType, dayOfWeek) => {
  const rt = String(repeatType || "")
    .trim()
    .toUpperCase();

  if (rt === REPEAT_NONE) return [REPEAT_NONE];
  if (rt === REPEAT_DAILY) return [REPEAT_DAILY];

  if (rt === REPEAT_WEEKLY) {
    const days = String(dayOfWeek || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .filter(isDowKey);
    return [...new Set(days)];
  }

  // fallback parse text (cũ)
  const sel = parseRepeatTypeTextToSelection(repeatType);
  return sel.length ? sel : [REPEAT_NONE];
};

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
const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") return "--";
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
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
  REJECTED: "Đã từ chối",
  COMPLETED: "Hoàn tất",
};
const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  NEGOTIATING: "orange",
  APPROVED: "green",
  REJECTED: "red",
  COMPLETED: "blue",
};

/** Tag render: avatar nhỏ + tên, không hiện id */
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

/** Stepper rõ ràng (luôn có nút tăng/giảm) */
const TotalInstallmentsStepper = ({
  value = 1,
  onChange,
  onStep,
  min = 1,
  max = 5,
}) => {
  const v = Number(value) || min;

  const dec = () => {
    const next = Math.max(min, v - 1);
    onChange?.(next);
    onStep?.(next);
  };

  const inc = () => {
    const next = Math.min(max, v + 1);
    onChange?.(next);
    onStep?.(next);
  };

  return (
    <Space.Compact className="w-full">
      <Button onClick={dec} disabled={v <= min}>
        -
      </Button>
      <Input value={v} readOnly className="text-center" />
      <Button onClick={inc} disabled={v >= max}>
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

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kolOptions, setKolOptions] = useState([]);
  const [liveOptions, setLiveOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);

  const [repeatSelection, setRepeatSelection] = useState([REPEAT_NONE]);

  const [contractTooLong, setContractTooLong] = useState(false);
  const [instTooLongMap, setInstTooLongMap] = useState({});

  const [attachList, setAttachList] = useState([]);

  const [totalTooLong, setTotalTooLong] = useState(false);

  const [collapseCampaignInfo, setCollapseCampaignInfo] = useState(false);

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

      // ✅ default BE-friendly
      repeatType: REPEAT_NONE,
      dayOfWeek: undefined,

      totalInstallments: 1,
      installments: [{ amount: "", dueDate: null }],

      liveHours: "",
      unitPrice: "",
      discountPercent: "",
      totalAmount: "",
      attachments: [],
      contractAmount: "",
    });

    setAttachList([]);
    setRepeatSelection([REPEAT_NONE]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, mode]);

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

    const contractAmount =
      source?.contractAmount ??
      source?.contract_amount ??
      source?.contract?.amount ??
      "";

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

    form.setFieldsValue({
      campaignId: source?.campaignId || campaignId,
      intro,
      experience,
      startAt,
      repeatUntil,
      contractAmount: formatNumberWithCommas(contractAmount),

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

      // hidden fields will be synced by effect
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
      totalAmount: "",
      attachments: [],
    });

    setAttachList([]);

    // ✅ selection theo BE repeatType + dayOfWeek (fallback parse text)
    const sel = parseRepeatSelectionFromBE(repeatTypeBE, dayOfWeekBE);
    setRepeatSelection(sel);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetBookingRecord]);

  /**
   * ✅ Sync repeatType + dayOfWeek hidden field theo selection:
   * - NONE / DAILY / WEEKLY
   * - dayOfWeek: "MON,TUE"...
   */
  useEffect(() => {
    const days = repeatSelection.filter(isDowKey);

    let rt = REPEAT_NONE;
    if (repeatSelection.includes(REPEAT_DAILY)) rt = REPEAT_DAILY;
    else if (days.length) rt = REPEAT_WEEKLY;

    form.setFieldValue("repeatType", rt);
    form.setFieldValue("dayOfWeek", days.length ? days.join(",") : undefined);
  }, [repeatSelection, form]);

  // Select logic
  const handleRepeatSelect = (val) => {
    if (val === REPEAT_NONE) return setRepeatSelection([REPEAT_NONE]);
    if (val === REPEAT_DAILY) return setRepeatSelection([REPEAT_DAILY]);

    if (isDowKey(val)) {
      setRepeatSelection((prev) => {
        const days = prev.filter(isDowKey);
        return Array.from(new Set([...days, val]));
      });
    }
  };

  const handleRepeatDeselect = (val) => {
    setRepeatSelection((prev) => {
      if (val === REPEAT_NONE || val === REPEAT_DAILY) return [REPEAT_NONE];
      if (isDowKey(val)) {
        const next = prev.filter((x) => x !== val);
        const stillHasDays = next.some(isDowKey);
        return stillHasDays ? next.filter(isDowKey) : [REPEAT_NONE];
      }
      return prev;
    });
  };

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
  const watchContractAmountRaw = Form.useWatch("contractAmount", form);

  const watchLiveHoursRaw = Form.useWatch("liveHours", form);
  const watchUnitPriceRaw = Form.useWatch("unitPrice", form);
  const watchDiscountRaw = Form.useWatch("discountPercent", form);

  // compute totalAmount
  useEffect(() => {
    const hours = parseDecimal(watchLiveHoursRaw);
    const unit = parseAmount(watchUnitPriceRaw);
    const disc = parseDecimal(watchDiscountRaw);

    const hasHours =
      typeof hours === "number" && !Number.isNaN(hours) && hours > 0;
    const hasUnit = typeof unit === "number" && !Number.isNaN(unit) && unit > 0;

    if (!hasHours || !hasUnit) {
      if (mode === "create") form.setFieldValue("totalAmount", "");
      setTotalTooLong(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchLiveHoursRaw, watchUnitPriceRaw, watchDiscountRaw, mode]);

  const sumState = useMemo(() => {
    const contractAmount = parseAmount(watchContractAmountRaw);
    const list = Array.isArray(watchInstallments) ? watchInstallments : [];
    const amounts = list
      .map((i) => parseAmount(i?.amount))
      .filter((v) => typeof v === "number" && !Number.isNaN(v));

    const hasAnyInstallmentAmount = amounts.length > 0;
    const sumInstallments = amounts.reduce((acc, v) => acc + v, 0);

    const sumMismatch =
      !!contractAmount &&
      hasAnyInstallmentAmount &&
      sumInstallments !== contractAmount;

    return {
      contractAmount,
      hasAnyInstallmentAmount,
      sumInstallments,
      sumMismatch,
    };
  }, [watchInstallments, watchContractAmountRaw]);

  const disableSave =
    sumState.sumMismatch ||
    (mode === "edit" &&
      (isLoadingCampaignBooking ||
        !!errorCampaignBooking ||
        !targetBookingRecord));

  // soft validate (giảm lag)
  const validateTimerRef = useRef(null);
  const softValidateSumGuard = () => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(() => {
      form.validateFields(["__sumGuard"]).catch(() => {});
    }, 120);
  };

  const onSubmit = async (values) => {
    try {
      if (!values.campaignId) throw new Error("Campaign ID là bắt buộc");

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

      // new fields
      const liveHours = parseDecimal(values.liveHours);
      const unitPrice = parseAmount(values.unitPrice);
      const discountPercent = parseDecimal(values.discountPercent);
      const totalAmount = parseAmount(values.totalAmount);

      // attachments: gửi cả fileList để service tự upload multipart
      const attachments = Array.isArray(values.attachments)
        ? values.attachments
        : [];

      if (mode === "create") {
        const bookingPayload = {
          campaignId: values.campaignId,
          description,

          // ✅ BE-friendly
          repeatType: values.repeatType, // NONE/DAILY/WEEKLY
          dayOfWeek: values.dayOfWeek, // "MON,TUE"...

          startAt: values.startAt,
          repeatUntil: values.repeatUntil,
          contractAmount: values.contractAmount,

          kolIds: values.kolIds,
          liveIds: values.liveIds,

          liveHours: typeof liveHours === "number" ? liveHours : undefined,
          unitPrice: typeof unitPrice === "number" ? unitPrice : undefined,
          discountPercent:
            typeof discountPercent === "number" ? discountPercent : undefined,
          totalAmount:
            typeof totalAmount === "number" ? totalAmount : undefined,

          // ✅ pass fileList
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

        message.success("Tạo booking request thành công (đã giữ nguyên trang)");
        refetchCampaignInfo?.();
        return;
      }

      // EDIT mode
      if (!bookingRequestId) {
        message.open({
          type: "error",
          content: "Không tìm thấy bookingRequestId để cập nhật.",
          icon: <XCircle size={18} className="text-red-500" />,
        });
        return;
      }

      const startAtBase = values.startAt ? dayjs(values.startAt) : null;
      const endAtAuto = startAtBase ? startAtBase.add(1, "hour") : null;

      await adminEditBookingRequest(bookingRequestId, {
        description,

        // ✅ BE-friendly
        repeatType: values.repeatType,
        dayOfWeek: values.dayOfWeek,

        startAt: values.startAt,
        endAt: endAtAuto,
        repeatUntil: values.repeatUntil,
        contractAmount: values.contractAmount,

        liveHours: typeof liveHours === "number" ? liveHours : undefined,
        unitPrice: typeof unitPrice === "number" ? unitPrice : undefined,
        discountPercent:
          typeof discountPercent === "number" ? discountPercent : undefined,
        totalAmount: typeof totalAmount === "number" ? totalAmount : undefined,

        kolIds: Array.isArray(values.kolIds) ? values.kolIds : [],
        liveIds: Array.isArray(values.liveIds) ? values.liveIds : [],

        // ✅ upload thật
        attachments,
      });

      message.success(
        "Cập nhật booking request thành công (đã giữ nguyên trang)"
      );
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
              "Campaign này đã có Booking Request, không thể tạo thêm.")) ||
          beMsg ||
          (mode === "edit" ? "Cập nhật thất bại" : "Tạo booking thất bại"),
        icon: <XCircle size={18} className="text-red-500" />,
      });
    }
  };

  const repeatOptions = useMemo(() => {
    const base = [
      { value: REPEAT_NONE, label: "Không lặp" },
      { value: REPEAT_DAILY, label: "Hàng ngày" },
    ];
    const days = DOW.map((d) => ({ value: d.key, label: d.label }));
    return [
      { label: "Tuỳ chọn", options: base },
      { label: "Chọn thứ (Hàng tuần)", options: days },
    ];
  }, []);

  const repeatHint = buildRepeatTypeTextFromSelection(repeatSelection);

  /** Upload handlers */
  const beforeUploadAttachment = (file) => {
    if (!isAllowedAttachFile(file)) {
      message.error(
        "Chỉ hỗ trợ: .xlsx, .xls, .doc, .docx, .pdf và ảnh (jpg, png...)."
      );
      return Upload.LIST_IGNORE;
    }

    if ((file?.size || 0) > MAX_ATTACH_SIZE) {
      message.error(`Mỗi tệp tối đa ${MAX_ATTACH_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }

    const current = form.getFieldValue("attachments") || attachList || [];
    if (Array.isArray(current) && current.length >= MAX_ATTACH_FILES) {
      message.error(`Chỉ được đính kèm tối đa ${MAX_ATTACH_FILES} tệp.`);
      return Upload.LIST_IGNORE;
    }

    // prevent auto upload (giữ fileList tại client)
    return false;
  };

  const onChangeAttachment = (info) => {
    let next = Array.isArray(info?.fileList) ? [...info.fileList] : [];

    next = next.filter((f) => {
      const raw = f?.originFileObj || f;
      return isAllowedAttachFile(raw);
    });

    next = next.filter((f) => {
      const raw = f?.originFileObj || f;
      return (raw?.size || 0) <= MAX_ATTACH_SIZE;
    });

    if (next.length > MAX_ATTACH_FILES) {
      message.warning(`Chỉ được đính kèm tối đa ${MAX_ATTACH_FILES} tệp.`);
      next = next.slice(0, MAX_ATTACH_FILES);
    }

    setAttachList(next);
    form.setFieldValue("attachments", next);
  };

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
                  ? "Chỉnh sửa Booking Request"
                  : "Tạo/Chỉnh sửa Booking Campaign"}
              </h1>
            </div>
          </div>

          <Space>
            <Button
              type="default"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
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
                  <Descriptions.Item label="Ngân sách chiến dịch">
                    {formatCurrency(campaignInfo?.targetPrice)}
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
                  <Descriptions.Item label="Ngân sách chiến dịch">
                    {formatCurrency(campaignInfo?.targetPrice)}
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
                  <Descriptions.Item label="Kiểu lặp">
                    {campaignInfo?.repeatType ?? "--"}
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
        <Card bordered={false} className="shadow-sm">
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Campaign ID"
                  name="campaignId"
                  rules={[{ required: true, message: "Bắt buộc" }]}
                >
                  <Input
                    placeholder="e7d9-... (campaignId)"
                    disabled={!!campaignId || mode === "edit"}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Kiểu lặp">
                  <Space direction="vertical" className="w-full" size={8}>
                    <Select
                      className="w-full"
                      mode="multiple"
                      allowClear
                      placeholder="Chọn: Không lặp / Hàng ngày / hoặc chọn các thứ"
                      options={repeatOptions}
                      value={repeatSelection}
                      maxTagCount="responsive"
                      onSelect={handleRepeatSelect}
                      onDeselect={handleRepeatDeselect}
                      onClear={() => setRepeatSelection([REPEAT_NONE])}
                      onChange={(vals) => {
                        if (!Array.isArray(vals) || vals.length === 0)
                          return setRepeatSelection([REPEAT_NONE]);
                        if (vals.includes(REPEAT_NONE))
                          return setRepeatSelection([REPEAT_NONE]);
                        if (vals.includes(REPEAT_DAILY))
                          return setRepeatSelection([REPEAT_DAILY]);
                        setRepeatSelection(vals.filter(isDowKey));
                      }}
                    />
                    <div className="text-xs text-gray-500">{repeatHint}</div>
                  </Space>
                </Form.Item>

                {/* ✅ hidden fields send to BE */}
                <Form.Item name="repeatType" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="dayOfWeek" hidden>
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Thời điểm bắt đầu (startAt)"
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
                  label="Lặp đến ngày (repeatUntil)"
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

              <Col xs={24} md={8}>
                <Form.Item
                  label="Số giờ live"
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
                        if (raw.length > 13)
                          return Promise.reject(
                            new Error("Chỉ tối đa 13 chữ số")
                          );
                        if (Number(raw) <= 0)
                          return Promise.reject(new Error("Đơn giá phải > 0"));
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="VD: 500,000" inputMode="numeric" />
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
                      beforeUpload={beforeUploadAttachment}
                      fileList={attachList}
                      accept={ACCEPT_ATTACH}
                      onChange={onChangeAttachment}
                    >
                      <Button icon={<Paperclip size={16} />}>Chọn tệp</Button>
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
                <Form.Item
                  label="Ngân sách chiến dịch (VND)"
                  name="contractAmount"
                  validateStatus={contractTooLong ? "error" : undefined}
                  help={
                    contractTooLong
                      ? "Chỉ có thể nhập tối đa 13 chữ số"
                      : undefined
                  }
                  normalize={(val) => {
                    const digits = String(val || "").replace(/\D/g, "");
                    const limited = digits.slice(0, 13);
                    return formatNumberWithCommas(limited);
                  }}
                  rules={[
                    { required: true, message: "Giá booking là bắt buộc" },
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
                            new Error("Chỉ có thể nhập tối đa 13 chữ số")
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
                      const digits = String(e?.target?.value || "").replace(
                        /\D/g,
                        ""
                      );
                      setContractTooLong(digits.length > 13);
                      softValidateSumGuard();
                    }}
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
                  message="Tổng số tiền các đợt thanh toán phải bằng Giá booking."
                  description={
                    sumState.contractAmount
                      ? `Tổng đợt hiện tại: ${formatNumberWithCommas(
                          sumState.sumInstallments
                        )} / Giá booking: ${formatNumberWithCommas(
                          sumState.contractAmount
                        )}`
                      : undefined
                  }
                />
              )}

              <Form.Item
                name="__sumGuard"
                style={{ display: "none" }}
                dependencies={["installments", "contractAmount"]}
                rules={[
                  () => ({
                    validator() {
                      if (sumState.sumMismatch) {
                        return Promise.reject(
                          new Error(
                            "Tổng số tiền các đợt thanh toán phải bằng Giá booking."
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
                              label={
                                index === 0 ? "Hạn thanh toán (dueDate)" : ""
                              }
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
              >
                {mode === "edit"
                  ? "Cập nhật booking request"
                  : "Tạo yêu cầu booking"}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
