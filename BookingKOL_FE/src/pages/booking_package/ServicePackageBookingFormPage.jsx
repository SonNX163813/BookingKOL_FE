import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Steps,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  ConfigProvider,
  Select,
  Descriptions,
  Space,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/locale/vi_VN";
import { Crown, Megaphone, CheckCircle, ArrowLeft } from "lucide-react";
import { useCreateBooking } from "../../hook/booking_package/useCreateBooking";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getKolProfiles, resolveAvatarUrl } from "../../services/kol/KolAPI";
import { getServicePackages } from "../../services/service-package/ServicePackageAPI";
import { getMyUserProfile } from "../../services/user/UserService";
import {
  requiredRule,
  phoneRule,
  maxLengthRule,
} from "../../utils/formValidators";
import provinceData from "../../utils/province.json";

dayjs.locale("vi");

// MUI imports cho form tải tệp
import {
  Stack,
  Typography,
  Button as MuiButton,
  Alert,
  IconButton,
} from "@mui/material";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import AttachmentRoundedIcon from "@mui/icons-material/AttachmentRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { toast } from "react-toastify";

const STYLE = {
  textPrimary: "#0f172a",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  accent: "#4f46e5",
  subtleSurface: "#f9fafb",
};

const normalizePackageType = (type) => {
  if (!type) {
    return null;
  }
  return type.toLowerCase() === "vip" ? "vip" : "basic";
};

// HERO_HIGHLIGHTS
const HERO_HIGHLIGHTS = [
  {
    title: "Livestream theo yêu cầu",
    description:
      "Kết nối nhanh với KOL và trợ lý livestream phù hợp mục tiêu kinh doanh.",
  },
  {
    title: "Quy trình tinh gọn",
    description:
      "Bổ sung thông tin, chọn gói, xác nhận chỉ trong 3 bước trực quan.",
  },
  {
    title: "Dữ liệu minh bạch",
    description:
      "Thông tin ngân sách, mục tiêu, tiến độ được đồng bộ và báo cáo liên tục.",
  },
];

const HERO_STATS = [
  { value: "350+", label: "Chiến dịch hoàn tất" },
  { value: "98%", label: "Khách hàng hài lòng" },
  { value: "24/7", label: "Hỗ trợ vận hành" },
];

// ==== Repeat type helpers (shared with admin campaign edit) ====
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
const DOW_ORDER = DOW.map((d) => d.key);
const isDowKey = (v) => DOW_ORDER.includes(v);

const buildRepeatTypeTextFromSelection = (selection = []) => {
  const sel = Array.isArray(selection) ? selection : [];

  // NONE => không gửi repeatType
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
  return "";
};

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

// Danh sách đuôi file cho phép
const ALLOWED_EXTENSIONS = [
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
];

const attachmentHint = `Tối đa ${MAX_ATTACHMENTS} tệp, mỗi tệp ≤ 50MB. Hỗ trợ: .xlsx, .xls, .doc, .docx, .pdf, .jpg, .jpeg, .png`;

// Helper format size
const formatFileSize = (size) => {
  if (!size && size !== 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

// Check đúng định dạng file
const isValidFileType = (file) => {
  const name = file?.name?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
};

// Không cho chọn ngày quá khứ
const MIN_START_DATE_OFFSET_DAYS = 7;

const getMinStartDate = () =>
  dayjs().add(MIN_START_DATE_OFFSET_DAYS, "day").startOf("day");

const disableStartDate = (current) => current && current < getMinStartDate();

// Chỉ cho gõ số trong Input + giới hạn tối đa chữ số
const handleNumberKeyPress = (e, maxLength) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (typeof maxLength === "number") {
    const value = (e.target.value || "").toString();
    const digits = value.replace(/\D/g, "");
    if (digits.length >= maxLength) {
      e.preventDefault();
    }
  }
};

const HANOI_PROVINCE_CODE = 1;
const DEFAULT_PROVINCE_NAME = "Hà Nội";
const WARDS_ERROR_MESSAGE =
  "Không thể tải danh sách phường/xã. Vui lòng thử lại.";

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

const PricingCard = ({
  title,
  features,
  highlight = false,
  onSelect,
  isSelected,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        cursor-pointer relative w-full max-w-sm min-h-[480px] rounded-3xl p-8 flex flex-col justify-between
        transition-all duration-300 transform
        ${
          highlight
            ? "bg-gradient-to-b from-[#4B006E] via-[#2D0C3C] to-[#150021] border-[3px] border-yellow-400"
            : "bg-gradient-to-b from-[#E3F2FF] via-[#C3E0FF] to-[#A9C8FF] border-[3px] border-blue-300"
        }
        ${
          isSelected
            ? highlight
              ? "ring-4 ring-yellow-300 shadow-xl"
              : "ring-4 ring-blue-500 shadow-xl"
            : "hover:-translate-y-1 hover:shadow-2xl"
        }
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-2xl font-extrabold tracking-wide ${
            highlight ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h3>
        {highlight ? (
          <Crown className="text-yellow-400 w-8 h-8 drop-shadow-md" />
        ) : (
          <Megaphone className="text-blue-600 w-8 h-8 drop-shadow-md" />
        )}
      </div>

      <ul
        className={`flex-1 space-y-4 leading-relaxed text-base ${
          highlight ? "text-gray-200" : "text-gray-700"
        }`}
      >
        {features.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle
              className={`w-5 h-5 flex-shrink-0 mt-[2px] ${
                highlight ? "text-yellow-400" : "text-blue-600"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="pt-6 mt-6 flex flex-col items-center">
        <Button
          type={highlight ? "default" : "primary"}
          className={`!font-semibold !h-12 w-full ${
            highlight
              ? "!bg-yellow-400 !text-black hover:bg-yellow-300"
              : "!bg-blue-600 !text-white hover:bg-blue-500"
          }`}
          onClick={onSelect}
        >
          {isSelected ? "Đã chọn" : "Chọn gói"}
        </Button>
      </div>
    </div>
  );
};

// ==== Main Section ====
const ServicePackageBookingFormPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state || {};
  const routePackageType = routeState?.packageType;
  const routePackageId = routeState?.packageId;
  const routePackageName = routeState?.packageName;

  const queryPackageType = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("type");
  }, [location.search]);

  const initialPackageType = useMemo(
    () => normalizePackageType(routePackageType || queryPackageType),
    [routePackageType, queryPackageType]
  );

  const [current, setCurrent] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(
    initialPackageType || null
  );
  const [form] = Form.useForm();
  const [campaignData, setCampaignData] = useState({});
  const [vipExtraData, setVipExtraData] = useState({});
  const [repeatSelection, setRepeatSelection] = useState([]);

  // attachments: [{ id, file, name, size }]
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [locationTouched, setLocationTouched] = useState(false);

  const stepsWrapperRef = useRef(null);

  const hasExternalPackageSelection = Boolean(initialPackageType);
  const shouldShowSelectionStep = !hasExternalPackageSelection;
  const campaignStepIndex = shouldShowSelectionStep ? 1 : 0;
  const confirmStepIndex = campaignStepIndex + 1;

  const handleScrollToForm = () => {
    stepsWrapperRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    if (shouldShowSelectionStep) {
      setCurrent(0);
    } else {
      setCurrent(campaignStepIndex);
    }
  };

  useEffect(() => {
    setWardsLoading(true);
    setWardsError("");

    const hanoiProvince =
      Array.isArray(provinceData) &&
      provinceData.find(
        (province) => String(province?.code) === String(HANOI_PROVINCE_CODE)
      );

    if (hanoiProvince) {
      setProvinceName(hanoiProvince?.name || DEFAULT_PROVINCE_NAME);
      const wardList = Array.isArray(hanoiProvince?.wards)
        ? hanoiProvince.wards
        : [];
      setWards(wardList);
      if (!wardList.length) {
        setWardsError(WARDS_ERROR_MESSAGE);
      }
    } else {
      setProvinceName(DEFAULT_PROVINCE_NAME);
      setWards([]);
      setWardsError(WARDS_ERROR_MESSAGE);
    }

    setWardsLoading(false);
  }, []);

  const selectedWard = useMemo(
    () =>
      wards.find(
        (ward) => String(ward.code) === String(selectedWardCode || "")
      ) || null,
    [selectedWardCode, wards]
  );

  const buildLocation = useCallback(
    (wardName, detail) => {
      const provinceLabel = provinceName || DEFAULT_PROVINCE_NAME;
      const wardLabel = wardName ? `${wardName}, ${provinceLabel}` : "";
      if (detail && wardLabel) return `${detail}, ${wardLabel}`;
      if (wardLabel) return wardLabel;
      return detail || "";
    },
    [provinceName]
  );

  useEffect(() => {
    const wardName = selectedWard?.name || "";
    const locationLabel = buildLocation(wardName, detailAddress);
    form.setFieldsValue({ livestreamAddress: locationLabel });
    if (locationTouched || form.isFieldTouched("livestreamAddress")) {
      form.validateFields(["livestreamAddress"]).catch(() => {});
    }
  }, [buildLocation, detailAddress, form, locationTouched, selectedWard]);

  useEffect(() => {
    if (!initialPackageType) {
      return;
    }
    setSelectedPackage(initialPackageType);
    form.setFieldsValue({ kol: [], assistant: [] });
    setVipExtraData({});
    setCurrent(campaignStepIndex);
  }, [initialPackageType, campaignStepIndex, form]);

  useEffect(() => {
    if (selectedPackage === "vip") return;
    form.setFieldsValue({ kol: [], assistant: [] });
  }, [selectedPackage, form]);

  const { data: myProfileResponse } = useQuery({
    queryKey: ["my-user-profile"],
    queryFn: ({ signal }) => getMyUserProfile({ signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const profileData = myProfileResponse?.data ?? myProfileResponse ?? null;
    if (!profileData) return;

    const updates = {};
    const setIfEmpty = (key, value) => {
      const current = form.getFieldValue(key);
      if (!current && value) {
        updates[key] = value;
      }
    };

    const fullName =
      profileData.fullName ?? profileData.displayName ?? profileData.name ?? "";
    const phone =
      profileData.phone ??
      profileData.phoneNumber ??
      profileData.contactPhone ??
      "";
    const address =
      profileData.permanentAddress ??
      profileData.address ??
      profileData.location ??
      profileData.cityAddress ??
      "";

    setIfEmpty("ordererFullName", fullName);
    setIfEmpty("ordererPhone", phone);
    setIfEmpty("permanentAddress", address);

    const updatedKeys = Object.keys(updates);
    if (updatedKeys.length) {
      form.setFieldsValue(updates);
      // re-run validation so auto-filled fields do not stay marked as empty once data is set
      form.validateFields(updatedKeys).catch(() => {});
    }
  }, [myProfileResponse, form]);

  const {
    data: servicePackages,
    isError: isPackageFetchError,
    error: packageFetchError,
  } = useQuery({
    queryKey: ["service-packages-for-booking"],
    queryFn: ({ signal }) => getServicePackages({ signal }),
    enabled: !routePackageId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const packageTypeIdMap = useMemo(() => {
    if (!Array.isArray(servicePackages)) {
      return {};
    }
    return servicePackages.reduce((acc, pkg) => {
      const type = normalizePackageType(pkg?.packageType);
      if (pkg?.id && type) {
        acc[type] = pkg.id;
      }
      return acc;
    }, {});
  }, [servicePackages]);

  useEffect(() => {
    if (!isPackageFetchError) return;
    const fallbackMessage =
      "Không thể tải danh sách gói dịch vụ. Vui lòng thử lại sau.";
    toast.error(packageFetchError?.message || fallbackMessage);
  }, [isPackageFetchError, packageFetchError]);

  const {
    data: kolResponse,
    isFetching: isFetchingKols,
    isError: isKolFetchError,
    error: kolFetchError,
  } = useQuery({
    queryKey: ["kol-available"],
    queryFn: ({ signal }) => getKolProfiles({ signal, params: { size: 50 } }),
    enabled: selectedPackage === "vip",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { hostOptions, liveOptions } = useMemo(() => {
    const list = Array.isArray(kolResponse?.content) ? kolResponse.content : [];

    const buildOption = (item) => {
      const name =
        item.displayName ||
        item.fullName ||
        item.name ||
        item.username ||
        item.email ||
        item.phone ||
        item.id;
      const avatar = resolveAvatarUrl(item) || item.avatarUrl || "";

      return {
        label: (
          <div className="flex items-center justify-between">
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
            {item.role && (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {item.role}
              </span>
            )}
          </div>
        ),
        value: item.id,
        name,
        avatar,
        role: item.role,
        searchText: `${name ?? ""} ${item.id ?? ""} ${item.role ?? ""}`,
      };
    };

    return list
      .filter((i) => i?.id)
      .reduce(
        (acc, item) => {
          const option = buildOption(item);
          if (item.role === "LIVE") {
            acc.liveOptions.push(option);
          } else {
            acc.hostOptions.push(option);
          }
          return acc;
        },
        { hostOptions: [], liveOptions: [] }
      );
  }, [kolResponse]);

  useEffect(() => {
    if (!isKolFetchError) return;
    const fallbackMessage =
      "Không thể tải danh sách KOL. Vui lòng thử lại sau.";
    toast.error(kolFetchError?.message || fallbackMessage);
  }, [isKolFetchError, kolFetchError]);

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

  useEffect(() => {
    form.setFieldValue("repeatSelection", repeatSelection);
    const text = buildRepeatTypeTextFromSelection(repeatSelection);
    form.setFieldValue("repeatType", text || "");
  }, [repeatSelection, form]);

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
        return next;
      }
      return prev;
    });
  };

  const disableEndDate = useCallback(
    (current) => {
      const start = form.getFieldValue("startDate");
      const minDate = start ? dayjs(start).startOf("day") : getMinStartDate();
      return current && current < minDate;
    },
    [form]
  );

  const validateStartDate = useCallback((_, value) => {
    if (!value) return Promise.resolve();
    return value.isBefore(getMinStartDate(), "day")
      ? Promise.reject(
          new Error("Ngày bắt đầu phải cách hiện tại ít nhất 7 ngày.")
        )
      : Promise.resolve();
  }, []);

  const validateEndDate = useCallback(
    (_, value) => {
      const startDate = form.getFieldValue("startDate");
      if (!value || !startDate) return Promise.resolve();
      const start = dayjs(startDate);
      return value.isBefore(start, "day")
        ? Promise.reject(
            new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.")
          )
        : Promise.resolve();
    },
    [form]
  );

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg !== "vip") {
      form.setFieldsValue({ kol: [], assistant: [] });
      setVipExtraData({});
    }
    setCurrent(campaignStepIndex);
    handleScrollToForm();
  };

  const handleCampaignFormFinish = (values) => {
    const {
      kol,
      assistant,
      startDate,
      endDate,
      repeatSelection: _repeatSelection,
      ...rest
    } = values;

    // đảm bảo có file
    if (!attachments.length) {
      setAttachmentError("Vui lòng chọn tệp tải lên!");
      return;
    }

    const formatted = {
      ...rest,
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
      livestreamHours:
        rest.livestreamHours !== undefined && rest.livestreamHours !== null
          ? Number(rest.livestreamHours)
          : rest.livestreamHours,
    };
    setCampaignData(formatted);

    if (selectedPackage === "vip") {
      const selectedHostIds = Array.isArray(kol) ? kol : [];
      const selectedAssistantIds = Array.isArray(assistant) ? assistant : [];
      const selectedKols = hostOptions.filter((o) =>
        selectedHostIds.includes(o.value)
      );
      const selectedAssistants = liveOptions.filter((o) =>
        selectedAssistantIds.includes(o.value)
      );
      setVipExtraData({
        kol: selectedHostIds,
        assistant: selectedAssistantIds,
        kolNames: selectedKols.map((k) => k.name).join(", "),
        assistantNames: selectedAssistants.map((a) => a.name).join(", "),
      });
    } else {
      setVipExtraData({});
    }

    setCurrent(confirmStepIndex);
  };

  const onSuccess = () => {
    form.resetFields();
    setAttachments([]);
    setVipExtraData({});
    setRepeatSelection([]);
    setDetailAddress("");
    setSelectedWardCode("");
    setLocationTouched(false);
    navigate("/");
  };

  const { isLoadingCreateBooking, handleCreateBooking } =
    useCreateBooking(onSuccess);

  // Xử lý chọn file (MUI input)
  const handleFileInputChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    // 1. Check định dạng trước – nếu có file sai, báo lỗi & chặn luôn
    const invalidFiles = fileList.filter((file) => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      toast.error(
        `Một hoặc nhiều tệp có định dạng không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      );
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    let merged = [...attachments];

    // 2. Check size, trùng, giới hạn
    for (const file of fileList) {
      const size = typeof file.size === "number" ? file.size : 0;

      if (size > MAX_ATTACHMENT_SIZE) {
        toast.error(`"${file.name}" vượt quá 10MB, vui lòng chọn tệp nhỏ hơn.`);
        continue;
      }

      const key = `${file.name}-${size}-${file.lastModified || ""}`;
      const exists = merged.some((item) => item.id === key);
      if (exists) continue;

      merged.push({
        id: key,
        file,
        name: file.name,
        size,
      });
    }

    if (merged.length > MAX_ATTACHMENTS) {
      toast.warning(`Chỉ hỗ trợ tối đa ${MAX_ATTACHMENTS} tệp đính kèm.`);
      merged = merged.slice(0, MAX_ATTACHMENTS);
    }

    setAttachments(merged);
    setAttachmentError("");
    // cập nhật lỗi trong Form nếu có custom validator
    form.validateFields(["attachment"]).catch(() => {});
    // reset input để có thể chọn lại cùng file
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRemoveAttachment = (id) => {
    const next = attachments.filter((item) => item.id !== id);
    setAttachments(next);
    if (!next.length) {
      setAttachmentError("Vui lòng chọn tệp tải lên!");
    } else {
      setAttachmentError("");
    }
    form.validateFields(["attachment"]).catch(() => {});
  };

  const handleConfirm = () => {
    if (!selectedPackage) {
      toast.error("Vui lòng chọn gói dịch vụ trước khi tiếp tục.");
      return;
    }

    const resolvedPackageId =
      routePackageId || packageTypeIdMap[selectedPackage];

    if (!resolvedPackageId) {
      toast.error("Không tìm thấy thông tin gói dịch vụ.");
      return;
    }

    const finalAttachments = attachments
      .map((item) => item.file)
      .filter(Boolean);

    if (!finalAttachments.length) {
      toast.error(
        "Vui lòng chọn tệp đính kèm chiến dịch (tối đa 5 tệp, mỗi tệp ≤ 10MB)."
      );
      return;
    }

    const data = {
      packageId: resolvedPackageId,
      campaignName: campaignData.campaignName,
      objective: campaignData.objective,
      targetPrice: campaignData.targetPrice,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      recurrencePattern: campaignData.recurrencePattern,
      repeatType: campaignData.repeatType,
      livestreamHours:
        campaignData.livestreamHours !== undefined &&
        campaignData.livestreamHours !== null &&
        campaignData.livestreamHours !== ""
          ? Number(campaignData.livestreamHours)
          : undefined,
      livestreamAddress: campaignData.livestreamAddress,
      permanentAddress: campaignData.permanentAddress,
      ordererFullName: campaignData.ordererFullName,
      ordererPhone: campaignData.ordererPhone,
      taxCode: campaignData.taxCode || undefined,
      liveIds:
        selectedPackage === "vip" && Array.isArray(vipExtraData.assistant)
          ? vipExtraData.assistant
          : undefined,
      kolIds:
        selectedPackage === "vip" && Array.isArray(vipExtraData.kol)
          ? vipExtraData.kol
          : undefined,
      attachment: finalAttachments,
    };

    handleCreateBooking(data);
  };

  const selectionStep = {
    title: "Chọn gói dịch vụ",
    content: (
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <PricingCard
            title="Gói Thường"
            features={[
              "Chiến lược tổng quan & đề xuất nhanh",
              "Nghiên cứu thị trường tinh gọn",
              "Hỗ trợ bởi chuyên gia Booking KOL",
              "Triển khai chiến dịch linh hoạt",
            ]}
            onSelect={() => handleSelectPackage("basic")}
            isSelected={selectedPackage === "basic"}
          />
          <PricingCard
            title="Gói VIP"
            features={[
              "Chọn KOL cấp cao theo yêu cầu",
              "Trợ lý livestream chuyên nghiệp",
              "Hỗ trợ 1-1 24/7 trong suốt chiến dịch",
              "Báo cáo chuyên sâu và đề xuất mở rộng",
            ]}
            onSelect={() => handleSelectPackage("vip")}
            isSelected={selectedPackage === "vip"}
          />
        </div>
      </div>
    ),
  };

  const campaignStep = {
    title: "Nhập thông tin chiến dịch",
    content: (
      <div className="space-y-8">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campaignName: "",
            objective: "",
            targetPrice: 3000000,
            startDate: getMinStartDate(),
            endDate: getMinStartDate().add(7, "day"),
            kol: [],
            assistant: [],
            repeatSelection: [],
            repeatType: "",
            livestreamHours: null,
            livestreamAddress: "",
            permanentAddress: "",
            ordererFullName: "",
            ordererPhone: "",
            taxCode: "",
          }}
          onFinish={handleCampaignFormFinish}
        >
          <Form.Item
            label="Tên chiến dịch"
            name="campaignName"
            rules={[
              requiredRule("Tên chiến dịch"),
              maxLengthRule("Tên chiến dịch", 100),
            ]}
          >
            <Input
              className="!h-12"
              maxLength={100}
              placeholder="VD: Chiến dịch tháng 8 - Ra mắt sản phẩm mới"
            />
          </Form.Item>

          <Form.Item
            label="Mục tiêu chiến dịch"
            name="objective"
            rules={[
              requiredRule("Mục tiêu chiến dịch"),
              maxLengthRule("Mục tiêu chiến dịch", 100),
            ]}
          >
            <Input
              className="!h-12"
              maxLength={100}
              placeholder="VD: Tăng nhận diện thương hiệu và thúc đẩy doanh số"
            />
          </Form.Item>

          <Form.Item
            label="Ngân sách mục tiêu (VND)"
            name="targetPrice"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập ngân sách mục tiêu!",
              },
              {
                validator: (_, value) => {
                  if (value == null || value === "") return Promise.resolve();
                  const digits = String(value).replace(/\D/g, "");
                  if (digits.length > 13) {
                    return Promise.reject(
                      new Error("Ngân sách chỉ được tối đa 13 chữ số.")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              className="!w-full !h-12"
              formatter={(value) =>
                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
              }
              parser={(value) => (value ? value.replace(/,/g, "") : "")}
              min={0}
              max={9999999999999} // 13 chữ số
              onKeyPress={(e) => handleNumberKeyPress(e, 13)}
            />
          </Form.Item>

          <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
              label="Ngày bắt đầu"
              name="startDate"
              rules={[
                { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                { validator: validateStartDate },
              ]}
            >
              <DatePicker
                className="w-full !h-12"
                format="DD/MM/YYYY"
                disabledDate={disableStartDate}
              />
            </Form.Item>
            <Form.Item
              label="Ngày kết thúc"
              name="endDate"
              rules={[
                { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                { validator: validateEndDate },
              ]}
            >
              <DatePicker
                className="w-full !h-12"
                format="DD/MM/YYYY"
                disabledDate={disableEndDate}
              />
            </Form.Item>
          </div>

          {/* <Form.Item
            label="Tần suất triển khai"
            name="recurrencePattern"
            rules={[{ max: 100, message: "Tối đa 100 ký tự." }]}
          >
            <Input
              className="!h-12"
              maxLength={100}
              placeholder="VD: Hàng tuần, Hàng tháng, hoặc Không lặp lại"
            />
          </Form.Item> */}

          <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
              label="Tên người đặt"
              name="ordererFullName"
              rules={[
                requiredRule("Tên người đặt"),
                maxLengthRule("Tên người đặt", 100),
              ]}
            >
              <Input
                className="!h-12"
                maxLength={100}
                placeholder="Nhập tên người đặt"
              />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="ordererPhone"
              rules={[requiredRule("Số điện thoại"), phoneRule]}
            >
              <Input
                className="!h-12"
                placeholder="Nhập số điện thoại"
                maxLength={12}
                type="tel"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Địa chỉ người đặt"
            name="permanentAddress"
            rules={[
              requiredRule("Địa chỉ người đặt"),
              maxLengthRule("Địa chỉ người đặt", 100),
            ]}
          >
            <Input
              className="!h-12"
              maxLength={100}
              placeholder="Nhập địa chỉ người đặt"
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => {
              const livestreamErrors = form.getFieldError("livestreamAddress");
              const livestreamError = livestreamErrors?.[0] || "";
              const helperText = livestreamError || wardsError || undefined;
              const status = helperText ? "error" : "";

              return (
                <Form.Item
                  label="Địa chỉ livestream"
                  required
                  validateStatus={status}
                  help={helperText}
                >
                  <Space direction="vertical" size={12} className="w-full">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">
                        Tỉnh / Thành phố
                      </div>
                      <Input
                        className="!h-12"
                        value={provinceName || "Đang tải..."}
                        readOnly
                        status={wardsError ? "error" : ""}
                        placeholder="Tỉnh / Thành phố"
                      />
                      <div className="text-xs text-gray-500">
                        Dịch vụ hiện đang khả dụng tại Hà Nội
                      </div>
                    </div>

                    <Form.Item
                      name="wardCode"
                      rules={[
                        { required: true, message: "Vui lòng chọn phường/xã" },
                      ]}
                    >
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">
                          <span className="text-red-500">* </span>
                          Phường / Xã tại Hà Nội
                        </div>
                        <Select
                          showSearch
                          allowClear
                          className="!w-full"
                          placeholder={
                            wardsLoading ? "Đang tải..." : "Chọn phường/xã"
                          }
                          loading={wardsLoading}
                          options={wards.map((ward) => ({
                            label: ward.name,
                            value: ward.code,
                          }))}
                          onChange={(value) => {
                            setLocationTouched(true);
                            setSelectedWardCode(value || "");
                            form.setFieldValue("wardCode", value);
                          }}
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            (option?.label || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          notFoundContent={
                            wardsLoading
                              ? "Đang tải phường/xã..."
                              : wardsError || "Không tìm thấy phường/xã"
                          }
                          disabled={
                            wardsLoading || (!wards.length && !wardsError)
                          }
                        />
                      </div>
                    </Form.Item>

                    <Form.Item
                      name="detailAddress"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số nhà / tên đường",
                        },
                        { max: 100, message: "Tối đa 100 ký tự" },
                      ]}
                    >
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">
                          <span className="text-red-500">* </span>
                          Số nhà / Tên đường / Tòa nhà
                        </div>

                        <Input
                          className="!h-12"
                          placeholder="Ví dụ: 123 Trần Duy Hưng, Vinhomes..."
                          maxLength={100}
                          onChange={(e) => {
                            setLocationTouched(true);
                            setDetailAddress(e.target.value);
                            form.setFieldValue("detailAddress", e.target.value);
                          }}
                        />
                      </div>
                    </Form.Item>

                    <Form.Item
                      name="livestreamAddress"
                      rules={[
                        requiredRule("Địa chỉ livestream"),
                        maxLengthRule("Địa chỉ livestream", 150),
                      ]}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                  </Space>
                </Form.Item>
              );
            }}
          </Form.Item>

          <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
              label="Số giờ live"
              name="livestreamHours"
              rules={[
                // requiredRule("Số giờ live"),
                {
                  validator: (_, value) => {
                    if (value == null || value === "") {
                      return Promise.resolve();
                    }
                    if (Number(value) > 5000) {
                      return Promise.reject(
                        new Error("Số giờ live tối đa là 5000.")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                className="!w-full !h-12"
                min={1}
                max={5000}
                onKeyPress={(e) => handleNumberKeyPress(e, 4)}
              />
            </Form.Item>

            <Form.Item
              label="Mã thuế (không bắt buộc)"
              name="taxCode"
              rules={[
                maxLengthRule("Mã số thuế", 13),
                {
                  pattern: /^[0-9]*$/,
                  message: "Mã số thuế chỉ được chứa chữ số.",
                },
              ]}
            >
              <Input
                className="!h-12"
                maxLength={13}
                placeholder="Nhập mã số thuế (nếu có)"
                onKeyPress={(e) => handleNumberKeyPress(e, 13)}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Kiểu lặp"
            name="repeatSelection"
            required
            rules={[
              {
                validator: () =>
                  repeatSelection.length
                    ? Promise.resolve()
                    : Promise.reject(new Error("Vui lòng chọn kiểu lặp")),
              },
            ]}
          >
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

          <Form.Item name="repeatType" hidden>
            <Input />
          </Form.Item>

          {/* FORM TẢI TỆP MUI */}
          <Form.Item
            name="attachment"
            // fake field chỉ để validator, UI tự quản attachments
            rules={[
              {
                validator: () => {
                  if (!attachments.length) {
                    return Promise.reject(
                      new Error("Vui lòng chọn tệp tải lên!")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateStatus={attachmentError ? "error" : ""}
            help={attachmentError || undefined}
          >
            <Stack spacing={1.5}>
              <Typography
                variant="subtitle2"
                sx={{ color: STYLE.textPrimary, fontWeight: 600 }}
              >
                Tệp đính kèm{" "}
                <Typography
                  component="span"
                  sx={{ color: "error.main", ml: 0.25 }}
                >
                  *
                </Typography>
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <MuiButton
                  variant="outlined"
                  component="label"
                  startIcon={<UploadRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "14px",
                    borderColor: STYLE.border,
                    color: STYLE.textPrimary,
                    "&:hover": { borderColor: STYLE.accent },
                  }}
                >
                  Tải lên tệp
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".xlsx,.xls,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInputChange}
                  />
                </MuiButton>
                <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
                  {attachmentHint}
                </Typography>
              </Stack>

              {attachmentError && (
                <Alert severity="error" sx={{ borderRadius: "14px" }}>
                  {attachmentError}
                </Alert>
              )}

              {attachments.length > 0 && (
                <Stack spacing={1}>
                  {attachments.map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{
                        borderRadius: "14px",
                        backgroundColor: STYLE.subtleSurface,
                        border: `1px solid ${STYLE.border}`,
                        px: 1.5,
                        py: 1,
                      }}
                    >
                      <AttachmentRoundedIcon
                        sx={{ color: STYLE.accent, fontSize: 20 }}
                      />
                      <Stack sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: STYLE.textPrimary, fontWeight: 500 }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: STYLE.textSecondary }}
                        >
                          {formatFileSize(item.size)}
                        </Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAttachment(item.id)}
                        sx={{
                          color: STYLE.textSecondary,
                          "&:hover": { color: STYLE.accent },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Form.Item>

          {selectedPackage === "vip" && (
            <div className="rounded-3xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Chọn Host chính & Trợ lý LIVE
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Lựa chọn đội ngũ đồng hành phù hợp cho gói VIP của bạn.
              </p>
              <Form.Item label="Host chính" name="kol" rules={[]}>
                <Select
                  mode="multiple"
                  loading={isFetchingKols}
                  options={hostOptions}
                  placeholder="Chọn KOL phù hợp"
                  allowClear
                  showSearch
                  optionFilterProp="searchText"
                  filterOption={(input, option) =>
                    (option?.searchText || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  tagRender={createTagRender(hostOptions)}
                  notFoundContent={
                    isFetchingKols
                      ? "Đang tải danh sách..."
                      : "Không tìm thấy Host chính phù hợp."
                  }
                />
              </Form.Item>

              <Form.Item label="Trợ lý LIVE" name="assistant" rules={[]}>
                <Select
                  mode="multiple"
                  loading={isFetchingKols}
                  options={liveOptions}
                  placeholder="Chọn Trợ lý LIVE hỗ trợ"
                  allowClear
                  showSearch
                  optionFilterProp="searchText"
                  filterOption={(input, option) =>
                    (option?.searchText || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  tagRender={createTagRender(liveOptions)}
                  notFoundContent={
                    isFetchingKols
                      ? "Đang tải danh sách..."
                      : "Không tìm thấy Trợ lý LIVE phù hợp."
                  }
                />
              </Form.Item>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-4 pt-4">
            {shouldShowSelectionStep && (
              <Button className="!h-12" onClick={() => setCurrent(0)}>
                Quay lại
              </Button>
            )}
            <Button className="!h-12 !px-10" type="primary" htmlType="submit">
              Lưu và tiếp tục
            </Button>
          </div>
        </Form>
      </div>
    ),
  };

  const confirmStep = {
    title: "Xác nhận",
    content: (
      <div className="space-y-8">
        <div className="grid gap-6">
          <div>
            <Descriptions
              title="Thông tin chiến dịch"
              bordered
              column={1}
              labelStyle={{ fontWeight: "bold" }}
            >
              <Descriptions.Item label="Tên chiến dịch">
                {campaignData.campaignName}
              </Descriptions.Item>
              <Descriptions.Item label="Mục tiêu chiến dịch">
                {campaignData.objective}
              </Descriptions.Item>
              <Descriptions.Item label="Ngân sách mục tiêu">
                {campaignData.targetPrice !== undefined &&
                campaignData.targetPrice !== null &&
                campaignData.targetPrice !== "" &&
                !Number.isNaN(Number(campaignData.targetPrice))
                  ? `${Number(campaignData.targetPrice).toLocaleString()} VND`
                  : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {campaignData.startDate}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {campaignData.endDate}
              </Descriptions.Item>
              {/* <Descriptions.Item label="Tần suất triển khai">
                {campaignData.recurrencePattern}
              </Descriptions.Item> */}
              <Descriptions.Item label="Kiểu lặp">
                {campaignData.repeatType || "Không lặp"}
              </Descriptions.Item>
              <Descriptions.Item label="Số giờ live">
                {campaignData.livestreamHours ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ livestream">
                {campaignData.livestreamAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ người đặt">
                {campaignData.permanentAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Tên người đặt">
                {campaignData.ordererFullName}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {campaignData.ordererPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Mã thuế">
                {campaignData.taxCode || "--"}
              </Descriptions.Item>
              {attachments.length > 0 && (
                <Descriptions.Item label="Tệp đính kèm">
                  {attachments.map((f) => f.name).join(", ")}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {selectedPackage === "vip" &&
            Object.keys(vipExtraData).length > 0 && (
              <div>
                <Descriptions
                  title="Thông tin gói VIP"
                  bordered
                  column={1}
                  labelStyle={{ fontWeight: "bold" }}
                >
                  <Descriptions.Item label="Host chính">
                    {vipExtraData.kolNames ||
                      vipExtraData.kol?.join(", ") ||
                      "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trợ lý LIVE">
                    {vipExtraData.assistantNames ||
                      vipExtraData.assistant?.join(", ") ||
                      "--"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
        </div>

        <div className="flex flex-wrap justify-end gap-4">
          <Button
            className="!h-12"
            onClick={() => {
              setCurrent(campaignStepIndex);
            }}
          >
            Quay lại
          </Button>
          <Button className="!h-12" type="primary" onClick={handleConfirm}>
            {isLoadingCreateBooking
              ? "... Đang tạo chiến dịch"
              : "Xác nhận và tạo chiến dịch"}
          </Button>
        </div>
      </div>
    ),
  };

  const steps = [
    ...(shouldShowSelectionStep ? [selectionStep] : []),
    campaignStep,
    confirmStep,
  ];

  useEffect(() => {
    if (current >= steps.length) {
      setCurrent(Math.max(steps.length - 1, 0));
    }
  }, [current, steps.length]);

  const handleBack = useCallback(() => {
    navigate("/goi-chien-dich");
  }, [navigate]);

  return (
    <ConfigProvider locale={viVN}>
      <section className="relative min-h-screen overflow-hidden bg-[#eef2ff] text-slate-900">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_20%_20%,rgba(59,130,246,0.15),rgba(147,197,253,0)_60%),radial-gradient(80%_80%_at_80%_0%,rgba(244,114,182,0.18),rgba(244,114,182,0)_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8 py-6">
          <div className="inline-flex">
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={handleBack}
              className="!flex !items-center !gap-2 !h-11 !rounded-[32px] !border !border-white/70 !bg-white !text-indigo-600 !font-semibold !shadow-sm hover:!border-indigo-500/60 hover:!text-indigo-700 hover:!bg-indigo-50 transition-all duration-300"
            >
              Trở về gói chiến dịch
            </Button>
          </div>
        </div>

        <div
          ref={stepsWrapperRef}
          className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div className="rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_160px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="flex flex-col gap-6 px-6 pb-8 pt-8 sm:px-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className=" font-semibold uppercase  text-blue-600">
                    Quy trình đặt gói
                  </p>

                  <p className="text-sm text-slate-500">
                    Cập nhật rõ ràng từng giai đoạn, từ chọn gói, cung cấp thông
                    tin đến xác nhận.
                  </p>
                </div>
                {routePackageName && (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                    Đang đặt gói: {routePackageName}
                  </span>
                )}
              </div>

              <Steps
                current={current}
                className="px-2"
                items={steps.map((s, index) => ({
                  key: index,
                  title: s.title,
                }))}
              />
            </div>

            <div className="rounded-b-[32px] border-t border-slate-100 bg-white/90 px-4 py-6 sm:px-10 sm:py-10">
              {steps[current]?.content}
            </div>
          </div>
        </div>
      </section>
    </ConfigProvider>
  );
};

export default ServicePackageBookingFormPage;
