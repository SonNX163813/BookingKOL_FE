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
  message,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { ArrowLeft, Save, CalendarRange, XCircle, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getKolProfiles, resolveAvatarUrl } from "../../../services/kol/KolAPI";
import { adminCreateBookingFromCampaign } from "../../../services/admin/AdminBookingFromCampaignAPI";
import { adminCreateContractPayments } from "../../../services/admin/AdminContractPaymentAPI";
import {
  adminGetCampaignInfo,
  adminGetCampaignBookingDetail,
} from "../../../services/admin/AdminBookingCampaignAPI";
import { update } from "../../../config/axios-config"; // ✅ PUT dùng update()

dayjs.locale("vi");

const { Text } = Typography;
const { useBreakpoint } = Grid;

/** ===== Repeat type (1 dropdown) ===== */
const REPEAT_NONE = "NONE";
const REPEAT_DAILY = "DAILY";

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

  // NONE => không gửi repeatType
  if (sel.includes(REPEAT_NONE)) return "";

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
  return "";
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
  if (found.length) {
    return [...new Set(found.map((lb) => mapLabelToKey[lb]).filter(Boolean))];
  }

  return [];
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

/** ✅ Stepper rõ ràng (luôn có nút tăng/giảm) */
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

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kolOptions, setKolOptions] = useState([]);
  const [liveOptions, setLiveOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);

  // ✅ repeat selection (1 dropdown): ["DAILY"] | ["NONE"] | ["MON","WED",...]
  const [repeatSelection, setRepeatSelection] = useState([]);

  // ✅ inline warning state (không dùng toast) + giảm lag
  const [contractTooLong, setContractTooLong] = useState(false);
  const [instTooLongMap, setInstTooLongMap] = useState({}); // { [fieldKey]: true }

  const screens = useBreakpoint();
  const row = location.state || {};

  const campaignIdFromState = row.campaignId;
  const campaignIdFromQuery = search.get("campaignId");
  const campaignId = campaignIdFromState || campaignIdFromQuery || "";

  // ====== Campaign info ======
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

  // ✅ LẤY bookingRequests theo campaignId
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

  /** ✅ Sync installments array theo count */
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

  // Prefill (create mode)
  useEffect(() => {
    const stateRow = location.state || {};
    if (mode !== "create") return;

    const intro = stateRow.objective || stateRow.campaignName || "";
    form.setFieldsValue({
      campaignId,
      intro,
      experience: "",
      repeatType: "",
      totalInstallments: 1,
      installments: [{ amount: "", dueDate: null }],
    });

    setRepeatSelection([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, mode]);

  // Prefill (edit mode) từ targetBookingRecord
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

    const repeatTypeText = source?.repeatType ?? source?.repeat_type ?? "";

    const { intro, experience } = splitDescToIntroExp(
      source?.description || ""
    );

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
      repeatType: "",
    });

    setRepeatSelection(parseRepeatTypeTextToSelection(repeatTypeText));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetBookingRecord]);

  // ✅ Sync repeatType hidden field từ repeatSelection
  useEffect(() => {
    const text = buildRepeatTypeTextFromSelection(repeatSelection);
    form.setFieldValue("repeatType", text || "");
  }, [repeatSelection, form]);

  // ✅ Select logic: exclusive NONE/DAILY vs multiple DOW
  const handleRepeatSelect = (val) => {
    if (val === REPEAT_NONE) {
      setRepeatSelection([REPEAT_NONE]);
      return;
    }
    if (val === REPEAT_DAILY) {
      setRepeatSelection([REPEAT_DAILY]);
      return;
    }
    if (isDowKey(val)) {
      setRepeatSelection((prev) => {
        const days = prev.filter(isDowKey);
        return Array.from(new Set([...days, val]));
      });
    }
  };

  const handleRepeatDeselect = (val) => {
    setRepeatSelection((prev) => {
      if (val === REPEAT_NONE || val === REPEAT_DAILY) return [];
      if (isDowKey(val)) {
        const next = prev.filter((x) => x !== val);
        const stillHasDays = next.some(isDowKey);
        return stillHasDays ? next.filter(isDowKey) : [];
      }
      return prev;
    });
  };

  // Load KOL / LIVE
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

  const watchInstallments = Form.useWatch("installments", form);
  const watchContractAmountRaw = Form.useWatch("contractAmount", form);

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

  // ✅ tránh spam validate trong khi gõ (giảm lag)
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

      // sanitize repeatType: NONE -> rỗng
      if (repeatSelection.includes(REPEAT_NONE)) {
        form.setFieldValue("repeatType", "");
      }

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

      // ✅ dayOfWeek cho API edit: join keys MON,TUE...
      const weeklyDays = repeatSelection.filter(isDowKey);
      const dayOfWeek = weeklyDays.length ? weeklyDays.join(",") : undefined;

      const description = buildDescriptionPayload(
        values.intro,
        values.experience
      );

      if (mode === "create") {
        const bookingPayload = {
          campaignId: values.campaignId,
          description,
          repeatType: values.repeatType || undefined,
          startAt: values.startAt,
          repeatUntil: values.repeatUntil,
          contractAmount: values.contractAmount,
          kolIds: values.kolIds,
          liveIds: values.liveIds,
        };

        const bookingResult = await adminCreateBookingFromCampaign(
          bookingPayload
        );
        const data =
          (bookingResult && bookingResult.data) || bookingResult || {};

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

        // ✅ KHÔNG navigate đi đâu: ở lại trang edit
        message.success("Tạo booking request thành công (đã giữ nguyên trang)");
        refetchCampaignInfo?.();
        return;
      }

      // ✅ EDIT mode: gọi PUT /v1/admin/bookings/edit/{bookingRequestId}
      if (!bookingRequestId) {
        message.open({
          type: "error",
          content: "Không tìm thấy bookingRequestId để cập nhật.",
          icon: <XCircle size={18} className="text-red-500" />,
        });
        return;
      }

      // NOTE: Form hiện chưa có endAt => set tạm endAt = startAt + 1 giờ
      const startAtBase = values.startAt ? dayjs(values.startAt) : null;
      const endAtAuto = startAtBase ? startAtBase.add(1, "hour") : null;

      const url = `/v1/admin/bookings/edit/${encodeURIComponent(
        bookingRequestId
      )}`;

      await update({
        url,
        data: {
          description,
          repeatType: values.repeatType || undefined,
          dayOfWeek,
          startAt: values.startAt
            ? dayjs(values.startAt).toISOString()
            : undefined,
          endAt: endAtAuto ? dayjs(endAtAuto).toISOString() : undefined,
          repeatUntil: values.repeatUntil
            ? dayjs(values.repeatUntil).format("YYYY-MM-DD")
            : undefined,
          contractAmount: parseAmount(values.contractAmount) ?? 0,
          contractFile: "", // nếu BE bắt buộc field này thì để string rỗng; có upload file thì set sau
          kolIds: Array.isArray(values.kolIds) ? values.kolIds : [],
          liveIds: Array.isArray(values.liveIds) ? values.liveIds : [],
        },
      });

      // ✅ KHÔNG navigate: ở lại
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

      if (is409) {
        message.open({
          type: "error",
          content:
            beMsg || "Campaign này đã có Booking Request, không thể tạo thêm.",
          icon: <XCircle size={18} className="text-red-500" />,
        });
      } else {
        message.open({
          type: "error",
          content:
            beMsg ||
            (mode === "edit" ? "Cập nhật thất bại" : "Tạo booking thất bại"),
          icon: <XCircle size={18} className="text-red-500" />,
        });
      }
    }
  };

  // options cho 1 dropdown
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

  const repeatHint =
    buildRepeatTypeTextFromSelection(repeatSelection) || "Không lặp";

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
                  ? `Chỉnh sửa Booking Request `
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
          title={
            <Space>
              <Layers size={18} />
              <span>Thông tin yêu cầu từ khách hàng</span>
            </Space>
          }
          loading={isLoadingCampaign}
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

              <Descriptions
                bordered
                size="middle"
                column={screens.lg ? 3 : screens.md ? 2 : 1}
                styles={{ label: { width: 180 } }}
              >
                <Descriptions.Item label="Tên Campaign">
                  {campaignInfo?.name ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Người tạo (email)">
                  <Text copyable>{campaignInfo?.createdBy ?? "--"}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Mục tiêu" span={screens.lg ? 3 : 1}>
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {campaignInfo?.objective ?? "--"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Giá mục tiêu">
                  {formatCurrency(campaignInfo?.targetPrice)}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày bắt đầu">
                  {formatDate(campaignInfo?.startDate)}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày kết thúc">
                  {formatDate(campaignInfo?.endDate)}
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
            </>
          ) : (
            <Text type="secondary">Không có dữ liệu campaign.</Text>
          )}
        </Card>

        {/* Form */}
        <Card bordered={false} className="shadow-sm">
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={[16, 16]}>
              {/* Campaign ID */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Campaign ID (campaignId)"
                  name="campaignId"
                  rules={[{ required: true, message: "Bắt buộc" }]}
                >
                  <Input
                    placeholder="e7d9-... (campaignId)"
                    disabled={!!campaignId || mode === "edit"}
                  />
                </Form.Item>
              </Col>

              {/* ✅ Kiểu lặp */}
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
                      onClear={() => setRepeatSelection([])}
                      onChange={(vals) => {
                        if (!Array.isArray(vals)) return;
                        if (vals.includes(REPEAT_NONE)) {
                          setRepeatSelection([REPEAT_NONE]);
                          return;
                        }
                        if (vals.includes(REPEAT_DAILY)) {
                          setRepeatSelection([REPEAT_DAILY]);
                          return;
                        }
                        setRepeatSelection(vals.filter(isDowKey));
                      }}
                    />
                    <div className="text-xs text-gray-500">{repeatHint}</div>
                  </Space>
                </Form.Item>

                {/* hidden field submit đúng format BE */}
                <Form.Item name="repeatType" hidden>
                  <Input />
                </Form.Item>
              </Col>

              {/* StartAt */}
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
                      setTimeout(() => {
                        form.validateFields(["repeatUntil"]).catch(() => {});
                      }, 0);
                    }}
                  />
                </Form.Item>
              </Col>

              {/* RepeatUntil */}
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

              {/* ✅ Giới thiệu (bắt buộc) */}
              <Col xs={24}>
                <Form.Item label="Mô tả chiến dịch" name="intro">
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    placeholder="Nhập giới thiệu..."
                  />
                </Form.Item>
              </Col>

              {/* ✅ Kinh nghiệm (bắt buộc) */}

              {/* ✅ Contract amount (bắt buộc) + báo lỗi dưới input + giảm lag */}
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

              {/* KOL IDs */}
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

              {/* LIVE IDs */}
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
                  {/* ✅ không cho gõ số, mặc định 1, tăng/giảm tới 5 */}
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
