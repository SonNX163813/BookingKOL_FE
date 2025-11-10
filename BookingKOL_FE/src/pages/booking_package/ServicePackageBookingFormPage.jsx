import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Steps,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Select,
  message,
  Descriptions,
} from "antd";
import dayjs from "dayjs";
import { Crown, Megaphone, CheckCircle } from "lucide-react";
import { useCreateBooking } from "../../hook/booking_package/useCreateBooking";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getKolProfiles } from "../../services/kol/KolAPI";
import { getServicePackages } from "../../services/service-package/ServicePackageAPI";

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

const ASSISTANT_OPTIONS = [
  { value: "Ngoc Anh", label: "Ngọc Anh" },
  { value: "Bao Tram", label: "Bảo Trâm" },
  { value: "Quang Minh", label: "Quang Minh" },
];

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

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
  const [vipForm] = Form.useForm();
  const [campaignData, setCampaignData] = useState({});
  const [vipExtraData, setVipExtraData] = useState({});
  const [attachmentFile, setAttachmentFile] = useState(null);
  const stepsWrapperRef = useRef(null);

  const hasExternalPackageSelection = Boolean(initialPackageType);
  const shouldShowSelectionStep = !hasExternalPackageSelection;
  const campaignStepIndex = shouldShowSelectionStep ? 1 : 0;
  const vipStepIndex = selectedPackage === "vip" ? campaignStepIndex + 1 : -1;
  const confirmStepIndex =
    selectedPackage === "vip" ? campaignStepIndex + 2 : campaignStepIndex + 1;

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
    vipForm.resetFields();
    setVipExtraData({});
    setCurrent(campaignStepIndex);
  }, [initialPackageType, campaignStepIndex, vipForm]);

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
      "Khong the tai danh sach goi dich vu. Vui long thu lai sau.";
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

  const kolOptions = useMemo(() => {
    const list = Array.isArray(kolResponse?.content) ? kolResponse.content : [];
    return list
      .filter((kol) => kol?.id)
      .map((kol) => ({
        value: kol.id,
        label:
          kol.displayName ||
          kol.name ||
          kol.fullName ||
          `KOL ${String(kol.id).slice(0, 6)}`,
      }));
  }, [kolResponse]);

  useEffect(() => {
    if (!isKolFetchError) return;
    const fallbackMessage =
      "Khong the tai danh sach KOL. Vui long thu lai sau.";
    message.error(kolFetchError?.message || fallbackMessage);
  }, [isKolFetchError, kolFetchError]);

  useEffect(() => {
    if (selectedPackage !== "vip") return;
    if (!kolOptions.length) return;
    const currentKol = vipForm.getFieldValue("kol");
    if (!currentKol) {
      vipForm.setFieldsValue({ kol: kolOptions[0].value });
    }
  }, [selectedPackage, kolOptions, vipForm]);

  useEffect(() => {
    if (selectedPackage !== "vip") return;
    if (!vipExtraData.kol && !vipExtraData.assistant) return;
    if (
      vipExtraData.kol &&
      !kolOptions.some((option) => option.value === vipExtraData.kol)
    )
      return;
    vipForm.setFieldsValue({
      kol: vipExtraData.kol ?? vipForm.getFieldValue("kol"),
      assistant:
        vipExtraData.assistant ??
        vipForm.getFieldValue("assistant") ??
        "Ngoc Anh",
    });
  }, [selectedPackage, vipExtraData, kolOptions, vipForm]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg !== "vip") {
      vipForm.resetFields();
      setVipExtraData({});
    }
    setCurrent(campaignStepIndex);
  };

  const handleCampaignFormFinish = (values) => {
    const formatted = {
      ...values,
      startDate: values.startDate.format("YYYY-MM-DD"),
      endDate: values.endDate.format("YYYY-MM-DD"),
    };
    setCampaignData(formatted);

    if (selectedPackage === "vip") {
      setCurrent(vipStepIndex);
    } else {
      setCurrent(confirmStepIndex);
    }
  };

  const handleVipFormFinish = (values) => {
    const selectedKols = kolOptions.filter((option) =>
      values.kol.includes(option.value)
    );
    const selectedAssistants = ASSISTANT_OPTIONS.filter((option) =>
      values.assistant.includes(option.value)
    );

    setVipExtraData({
      ...values,
      kolNames: selectedKols.map((k) => k.label).join(", "),
      assistantNames: selectedAssistants.map((a) => a.label).join(", "),
    });
    setCurrent(confirmStepIndex);
  };

  const onSuccess = () => {
    form.resetFields();
    setAttachmentFile(null);
    navigate("/");
  };

  const { isLoadingCreateBooking, handleCreateBooking } =
    useCreateBooking(onSuccess);

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_ATTACHMENT_SIZE) {
      message.error("Vui lòng chọn tệp nhỏ hơn 10MB.");
      event.target.value = "";
      return;
    }
    setAttachmentFile(file || null);
    event.target.value = "";
  };

  const handleConfirm = () => {
    if (!selectedPackage) {
      message.error("Vui long chon goi dich vu truoc khi tiep tuc.");
      return;
    }

    const resolvedPackageId =
      routePackageId || packageTypeIdMap[selectedPackage];

    if (!resolvedPackageId) {
      message.error("Khong tim thay thong tin goi dich vu.");
      return;
    }

    const data = {
      packageId: resolvedPackageId,
      campaignName: campaignData.campaignName,
      objective: campaignData.objective,
      budgetMin: campaignData.budgetMin,
      budgetMax: campaignData.budgetMax,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      recurrencePattern: campaignData.recurrencePattern,
      // liveIds:
      //   selectedPackage === "vip" ? vipExtraData.assistant ?? [] : [],
      kolIds: selectedPackage === "vip" ? vipExtraData.kol ?? [] : [],
      attachment: attachmentFile || undefined,
    };

    handleCreateBooking(data);
  };

  const selectionStep = {
    title: "Chọn gói dịch vụ",
    content: (
      <div className="space-y-8">
        {/* <div className="rounded-3xl border border-white/50 bg-gradient-to-r from-[#3117ff] via-[#6d37ff] to-[#a125ff] p-6 text-white shadow-2xl shadow-indigo-500/40">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/80">
            Buoc 1
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Chon cach dong hanh
          </h3>
          <p className="mt-3 text-sm text-white/85">
            Hay cung chung toi xay dung mot chien dich livestream an tuong voi
            doi ngu KOL va tro ly da kinh nghiem. Moi goi duoc chuan hoa nhu
            giao dien CourseLivestream: sang trong, cap nhat ro rang, thao tac
            nhanh.
          </p>
        </div> */}
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
        {/* <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.4em] text-blue-600">
            Buoc 2
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Mo ta chien dich
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Dien cac thong tin tuong tu bo cuc CourseLivestream: ro rang, tinh
            gon va tao cam hung.
          </p>
        </div> */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campaignName: "",
            objective: "",
            budgetMin: 1000000,
            budgetMax: 5000000,
            startDate: dayjs(),
            endDate: dayjs().add(7, "day"),
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
              placeholder="VD: Tăng nhận diện thương hiệu và thúc đẩy doanh số bán hàng"
            />
          </Form.Item>

          <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
              label="Ngân sách (VND)"
              name="budgetMin"
              rules={[
                {
                  required: true,
                  message: "Vui long nhap ngan sach toi thieu!",
                },
              ]}
              className="w-full"
            >
              <InputNumber
                className="!w-full !h-12"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\\$\\s?|(,*)/g, "")}
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="Ngan sach toi da (VND)"
              name="budgetMax"
              rules={[
                { required: true, message: "Vui long nhap ngan sach toi da!" },
              ]}
            >
              <InputNumber
                className="!w-full !h-12"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\\$\\s?|(,*)/g, "")}
                min={0}
              />
            </Form.Item>
          </div>

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
              placeholder="VD: Hàng tuần, Hàng tháng, Không lặp lại"
            />
          </Form.Item>

          <Form.Item label="Tệp đính kèm chiến dịch">
            <div className="space-y-2">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                onChange={handleAttachmentChange}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-indigo-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-indigo-300"
              />
              <p className="text-xs text-slate-500">
                Hỗ trợ PNG, JPG, PDF hoặc DOC, tối đa 10MB.
              </p>
              {attachmentFile && (
                <p className="text-sm font-medium text-slate-700">
                  Đã chọn: {attachmentFile.name}
                </p>
              )}
            </div>
          </Form.Item>

          <div className="flex flex-wrap justify-end gap-4">
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

  const vipStep =
    selectedPackage === "vip"
      ? {
          title: "Chọn Host Chính và Trợ LIVE",
          content: (
            <Form
              form={vipForm}
              layout="vertical"
              onFinish={handleVipFormFinish}
              initialValues={{ assistant: "Ngoc Anh" }}
              className="p-4"
            >
              <Form.Item
                label="Chọn Host Chính"
                name="kol"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một Host Chính!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  loading={isFetchingKols}
                  options={kolOptions}
                  placeholder="Chọn KOL phù hợp"
                  optionFilterProp="label"
                  showSearch
                  notFoundContent={
                    isFetchingKols
                      ? "Đang tải danh sách..."
                      : "Không tìm thấy Host Chính phù hợp."
                  }
                />
              </Form.Item>

              <Form.Item
                label="Trợ LIVE"
                name="assistant"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một Trợ LIVE!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  options={ASSISTANT_OPTIONS}
                  placeholder="Chọn Trợ LIVE hỗ trợ"
                />
              </Form.Item>

              <div className="flex flex-wrap justify-end gap-4 pt-4">
                <Button
                  className="!h-12"
                  onClick={() => setCurrent(campaignStepIndex)}
                >
                  Quay lại
                </Button>
                <Button
                  className="!h-12"
                  type="primary"
                  htmlType="submit"
                  disabled={!kolOptions.length}
                >
                  Tiếp tục
                </Button>
              </div>
            </Form>
          ),
        }
      : null;

  const confirmStep = {
    title: "Xác nhận",
    content: (
      <div className="space-y-8">
        {/* <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-white to-white p-6 shadow-lg shadow-emerald-100/70">
          <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-500">
            Buoc 4
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Kiem tra lan cuoi truoc khi gui
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Tong ket thong tin chien dich giong cach CourseLivestream hien thi
            chi tiet khoa hoc: ro rang, sang trong va de doi chieu.
          </p>
        </div> */}

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
              <Descriptions.Item label="Ngân sách tối thiểu">
                {campaignData.budgetMin?.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label="Ngân sách tối đa">
                {campaignData.budgetMax?.toLocaleString()} VND
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
              {attachmentFile && (
                <Descriptions.Item label="Tệp đính kèm">
                  {attachmentFile.name}
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
                  <Descriptions.Item label="Host Chính">
                    {vipExtraData.kolNames || vipExtraData.kol?.join(", ")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trợ LIVE">
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
              if (selectedPackage === "vip") {
                setCurrent(vipStepIndex);
              } else {
                setCurrent(campaignStepIndex);
              }
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
    ...(vipStep ? [vipStep] : []),
    confirmStep,
  ];

  useEffect(() => {
    if (current >= steps.length) {
      setCurrent(Math.max(steps.length - 1, 0));
    }
  }, [current, steps.length]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#eef2ff] text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_20%_20%,rgba(59,130,246,0.15),rgba(147,197,253,0)_60%),radial-gradient(80%_80%_at_80%_0%,rgba(244,114,182,0.18),rgba(244,114,182,0)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        {/* <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 shadow-sm">
              Booking Package
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Hay cung chung toi xay dung mot chien dich Livestream dinh cao
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Lay tinh than thiet ke cua trang CourseLivestream va mang vao quy trinh dat goi: giao dien trong tre, thong tin minh bach, trai nghiem cap nhat lien tuc.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleScrollToForm}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5"
              >
                Bat dau dat goi
              </button>
              <button
                type="button"
                onClick={handleScrollToForm}
                className="rounded-full border border-slate-300/80 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
              >
                Xem quy trinh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {HERO_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur"
              >
                <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-lg shadow-slate-200/80 backdrop-blur"
            >
              <p className="text-3xl font-semibold text-blue-600">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div> */}
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
  );
};

export default ServicePackageBookingFormPage;
