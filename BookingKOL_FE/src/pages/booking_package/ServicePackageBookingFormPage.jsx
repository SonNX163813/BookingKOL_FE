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
  message,
  Descriptions,
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

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

const attachmentHint = `Tối đa ${MAX_ATTACHMENTS} tệp, mỗi tệp ≤ 10MB`;

const formatFileSize = (size) => {
  if (!size && size !== 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

  // attachments: [{ id, file, name, size }]
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");

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
    message.error(packageFetchError?.message || fallbackMessage);
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
    message.error(kolFetchError?.message || fallbackMessage);
  }, [isKolFetchError, kolFetchError]);

  useEffect(() => {
    if (selectedPackage !== "vip") return;
    if (!hostOptions.length) return;
    const currentKol = form.getFieldValue("kol");
    if (!Array.isArray(currentKol) || currentKol.length === 0) {
      form.setFieldsValue({ kol: [hostOptions[0].value] });
    }
  }, [selectedPackage, hostOptions, form]);

  useEffect(() => {
    if (selectedPackage !== "vip") return;
    if (!liveOptions.length) return;
    const currentAssistant = form.getFieldValue("assistant");
    if (!Array.isArray(currentAssistant) || currentAssistant.length === 0) {
      form.setFieldsValue({ assistant: [liveOptions[0].value] });
    }
  }, [selectedPackage, liveOptions, form]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg !== "vip") {
      form.setFieldsValue({ kol: [], assistant: [] });
      setVipExtraData({});
    }
    setCurrent(campaignStepIndex);
  };

  const handleCampaignFormFinish = (values) => {
    const { kol, assistant, startDate, endDate, ...rest } = values;

    // đảm bảo có file
    if (!attachments.length) {
      setAttachmentError("Vui lòng chọn tệp tải lên!");
      return;
    }

    const formatted = {
      ...rest,
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
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
    navigate("/");
  };

  const { isLoadingCreateBooking, handleCreateBooking } =
    useCreateBooking(onSuccess);

  // Xử lý chọn file (MUI input)
  const handleFileInputChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    let merged = [...attachments];

    for (const file of fileList) {
      const size = typeof file.size === "number" ? file.size : 0;

      if (size > MAX_ATTACHMENT_SIZE) {
        message.error(
          `"${file.name}" vượt quá 10MB, vui lòng chọn tệp nhỏ hơn.`
        );
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
      message.warning(`Chỉ hỗ trợ tối đa ${MAX_ATTACHMENTS} tệp đính kèm.`);
      merged = merged.slice(0, MAX_ATTACHMENTS);
    }

    setAttachments(merged);
    setAttachmentError("");
    // cập nhật lỗi trong Form nếu có custom validator
    form.validateFields(["attachment"]).catch(() => {});
    // reset input để có thể chọn lại cùng file
    event.target.value = "";
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
      message.error("Vui lòng chọn gói dịch vụ trước khi tiếp tục.");
      return;
    }

    const resolvedPackageId =
      routePackageId || packageTypeIdMap[selectedPackage];

    if (!resolvedPackageId) {
      message.error("Không tìm thấy thông tin gói dịch vụ.");
      return;
    }

    const finalAttachments = attachments
      .map((item) => item.file)
      .filter(Boolean);

    if (!finalAttachments.length) {
      message.error(
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
            startDate: dayjs(),
            endDate: dayjs().add(7, "day"),
            kol: [],
            assistant: [],
          }}
          onFinish={handleCampaignFormFinish}
        >
          <Form.Item
            label="Tên chiến dịch"
            name="campaignName"
            rules={[
              { required: true, message: "Vui lòng nhập tên chiến dịch!" },
            ]}
          >
            <Input
              className="!h-12"
              placeholder="VD: Chiến dịch tháng 8 - Ra mắt sản phẩm mới"
            />
          </Form.Item>

          <Form.Item
            label="Mục tiêu chiến dịch"
            name="objective"
            rules={[
              { required: true, message: "Vui lòng nhập mục tiêu chiến dịch!" },
            ]}
          >
            <Input
              className="!h-12"
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
            ]}
          >
            <InputNumber
              className="!w-full !h-12"
              formatter={(value) =>
                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
              }
              parser={(value) => (value ? value.replace(/,/g, "") : "")}
              min={0}
            />
          </Form.Item>

          <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
              label="Ngày bắt đầu"
              name="startDate"
              rules={[
                { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
              ]}
            >
              <DatePicker className="w-full !h-12" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label="Ngày kết thúc"
              name="endDate"
              rules={[
                { required: true, message: "Vui lòng chọn ngày kết thúc!" },
              ]}
            >
              <DatePicker className="w-full !h-12" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item label="Tần suất triển khai" name="recurrencePattern">
            <Input
              className="!h-12"
              placeholder="VD: Hàng tuần, Hàng tháng, hoặc Không lặp lại"
            />
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
              <Form.Item
                label="Host chính"
                name="kol"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một Host chính!",
                  },
                ]}
              >
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

              <Form.Item
                label="Trợ lý LIVE"
                name="assistant"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một Trợ lý LIVE!",
                  },
                ]}
              >
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
            <Button
              className="!h-12 !px-10"
              type="primary"
              htmlType="submit"
              disabled={
                selectedPackage === "vip" &&
                (!hostOptions.length || !liveOptions.length)
              }
            >
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
              <Descriptions.Item label="Tần suất triển khai">
                {campaignData.recurrencePattern}
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
                    {vipExtraData.kolNames || vipExtraData.kol?.join(", ")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trợ lý LIVE">
                    {vipExtraData.assistantNames ||
                      vipExtraData.assistant?.join(", ")}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-600">
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
