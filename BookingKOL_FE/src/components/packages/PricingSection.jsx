import React, { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getKolProfiles } from "../../services/kol/KolAPI";

const { Step } = Steps;

const ASSISTANT_OPTIONS = [
  { value: "Ngoc Anh", label: "Ngọc Anh" },
  { value: "Bao Tram", label: "Bảo Trâm" },
  { value: "Quang Minh", label: "Quang Minh" },
];

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
          onClick={onSelect} // Đảm bảo nút này cũng kích hoạt chọn gói
        >
          {isSelected ? "Đã chọn" : "Chọn gói"}
        </Button>
      </div>
    </div>
  );
};

// ==== Main Section ====
const PricingSection = () => {
  const [current, setCurrent] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form] = Form.useForm();
  const [vipForm] = Form.useForm();
  const [campaignData, setCampaignData] = useState({});
  const [vipExtraData, setVipExtraData] = useState({});
  const navigate = useNavigate();

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
    setCurrent(1);
  };

  const handleCampaignFormFinish = (values) => {
    const formatted = {
      ...values,
      startDate: values.startDate.format("YYYY-MM-DD"),
      endDate: values.endDate.format("YYYY-MM-DD"),
    };
    setCampaignData(formatted);

    if (selectedPackage === "vip") {
      setCurrent(2);
    } else {
      setCurrent(2);
    }
  };

  const handleVipFormFinish = (values) => {
    const selectedKol = kolOptions.find(
      (option) => option.value === values.kol
    );
    const assistantOption = ASSISTANT_OPTIONS.find(
      (option) => option.value === values.assistant
    );
    setVipExtraData({
      ...values,
      kolName: selectedKol?.label || "",
      assistantName: assistantOption?.label || "",
    });
    setCurrent(3);
  };

  const onSuccess = () => {
    form.resetFields();
    navigate("/");
  };

  const { isLoadingCreateBooking, handleCreateBooking } =
    useCreateBooking(onSuccess);

  const handleConfirm = () => {
    const data = {
      packageId:
        selectedPackage === "basic"
          ? "ee6c32f4-776e-45e5-b627-44f92cb0cf03"
          : "80b5e75d-d2bf-4501-881a-754ce8bf6c18",
      campaignName: campaignData.campaignName,
      objective: campaignData.objective,
      budgetMin: campaignData.budgetMin,
      budgetMax: campaignData.budgetMax,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      recurrencePattern: campaignData.recurrencePattern,
      // liveIds:
      //   selectedPackage === "vip" ? vipExtraData?.assistant ?? null : null,
      kolIds: selectedPackage === "vip" ? vipExtraData?.kol ?? null : null,
    };

    handleCreateBooking(data);
  };

  const baseSteps = [
    {
      title: "Chọn gói",
      content: (
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-10 px-4 py-10">
          <PricingCard
            title="GÓI THƯỜNG"
            features={[
              "Chiến Dịch KOL Cơ Bản",
              "Phân Tích & Lựa Chọn KOL",
              "Báo Cáo Hiệu Quả",
              "Cộng Tác Tự Booking KOL",
            ]}
            onSelect={() => handleSelectPackage("basic")}
            isSelected={selectedPackage === "basic"}
          />
          <PricingCard
            title="GÓI VIP"
            highlight
            features={[
              "Chiến Lược KOL Cao Cấp",
              "Tự Chọn KOL Cá Tính",
              "Trợ Lý Livestream Chuyên Nghiệp",
              "Ưu Đãi & Hỗ Trợ 24/7",
              "Báo Cáo Chuyên Sâu A-Z",
            ]}
            onSelect={() => handleSelectPackage("vip")}
            isSelected={selectedPackage === "vip"}
          />
        </div>
      ),
    },
    {
      title: "Nhập thông tin chiến dịch",
      content: (
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
            recurrencePattern: "Không lặp lại",
          }}
          onFinish={handleCampaignFormFinish}
          className="p-4"
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
              placeholder="VD: Chiến dịch mùa Tết 2024"
            />
          </Form.Item>
          <Form.Item
            label="Mục tiêu"
            name="objective"
            rules={[
              { required: true, message: "Vui lòng nhập mục tiêu chiến dịch!" },
            ]}
          >
            <Input
              className="!h-12"
              placeholder="VD: Tăng nhận diện thương hiệu, Thúc đẩy doanh số"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Ngân sách tối thiểu (VNĐ)"
              name="budgetMin"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập ngân sách tối thiểu!",
                },
              ]}
              className="w-full"
            >
              <InputNumber
                className="!w-full !h-12"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="Ngân sách tối đa (VNĐ)"
              name="budgetMax"
              rules={[
                { required: true, message: "Vui lòng nhập ngân sách tối đa!" },
              ]}
            >
              <InputNumber
                className="!w-full !h-12"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                min={0}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Form.Item label="Tần suất chiến dịch" name="recurrencePattern">
            <Input
              className="!h-12"
              placeholder="VD: Hàng tuần, Một lần duy nhất"
            />
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4">
            <Button className="!h-12" onClick={() => setCurrent(0)}>
              Quay lại
            </Button>
            <Button className="!h-12" type="primary" htmlType="submit">
              Tiếp tục
            </Button>
          </div>
        </Form>
      ),
    },
  ];

  const vipSteps =
    selectedPackage === "vip"
      ? [
          {
            title: "Chọn KOL & Trợ lý",
            content: (
              <Form
                form={vipForm}
                layout="vertical"
                onFinish={handleVipFormFinish}
                initialValues={{ assistant: "Ngoc Anh" }}
                className="p-4"
              >
                <Form.Item
                  label="Chọn KOL"
                  name="kol"
                  rules={[
                    { required: true, message: "Vui lòng chọn một KOL!" },
                  ]}
                >
                  <Select
                    className="!h-12"
                    loading={isFetchingKols}
                    options={kolOptions}
                    placeholder="Chọn KOL phù hợp"
                    optionFilterProp="label"
                    showSearch
                    notFoundContent={
                      isFetchingKols
                        ? "Đang tải danh sách KOL..."
                        : "Không có KOL khả dụng"
                    }
                  />
                </Form.Item>
                <Form.Item
                  label="Chọn trợ lý livestream"
                  name="assistant"
                  rules={[
                    { required: true, message: "Vui lòng chọn một trợ lý!" },
                  ]}
                >
                  <Select
                    className="!h-12"
                    options={ASSISTANT_OPTIONS}
                    placeholder="Chọn trợ lý livestream"
                  />
                </Form.Item>
                <div className="flex justify-end gap-4 pt-4">
                  <Button className="!h-12" onClick={() => setCurrent(1)}>
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
          },
        ]
      : [];

  const confirmStep = {
    title: "Xác nhận",
    content: (
      <div className="space-y-6 p-4">
        <Descriptions
          title="Thông tin chiến dịch"
          bordered
          column={1}
          labelStyle={{ fontWeight: "bold" }}
        >
          <Descriptions.Item label="Tên chiến dịch">
            {campaignData.campaignName}
          </Descriptions.Item>

          <Descriptions.Item label="Mục tiêu">
            {campaignData.objective}
          </Descriptions.Item>

          <Descriptions.Item label="Ngân sách tối thiểu">
            {campaignData.budgetMin?.toLocaleString()} VNĐ
          </Descriptions.Item>

          <Descriptions.Item label="Ngân sách tối đa">
            {campaignData.budgetMax?.toLocaleString()} VNĐ
          </Descriptions.Item>

          <Descriptions.Item label="Ngày bắt đầu">
            {campaignData.startDate}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày kết thúc">
            {campaignData.endDate}
          </Descriptions.Item>

          <Descriptions.Item label="Tần suất chiến dịch">
            {campaignData.recurrencePattern}
          </Descriptions.Item>
        </Descriptions>

        {selectedPackage === "vip" && Object.keys(vipExtraData).length > 0 && (
          <Descriptions
            title="Thông tin VIP thêm"
            bordered
            column={1}
            labelStyle={{ fontWeight: "bold" }}
          >
            <Descriptions.Item label="KOL">
              {vipExtraData.kolName || vipExtraData.kol}
            </Descriptions.Item>
            <Descriptions.Item label="Trợ lý Livestream">
              {vipExtraData.assistantName || vipExtraData.assistant}
            </Descriptions.Item>
          </Descriptions>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            className="!h-12"
            onClick={() => {
              if (selectedPackage === "vip") {
                setCurrent(2);
              } else {
                setCurrent(1);
              }
            }}
          >
            Quay lại
          </Button>
          <Button className="!h-12" type="primary" onClick={handleConfirm}>
            {isLoadingCreateBooking
              ? "... Đang tạo chiến dịch"
              : "Xác nhận & Tạo chiến dịch"}
          </Button>
        </div>
      </div>
    ),
  };

  const steps = [...baseSteps, ...vipSteps, confirmStep];

  return (
    <section className="min-h-screen flex flex-col items-center text-black pb-20 pt-8">
      <h1 className="text-5xl font-extrabold text-center mt-8 mb-6 drop-shadow-lg">
        Tạo Chiến Dịch KOL Của Bạn
      </h1>
      <p className="text-lg text-center text-black mb-10 max-w-2xl">
        Hãy cùng chúng tôi xây dựng một chiến dịch marketing hiệu quả và đột
        phá!
      </p>

      <Steps
        current={current}
        className="w-full max-w-5xl px-8 pb-10 py-10"
        items={steps.map((s, index) => ({
          key: index,
          title: s.title,
        }))}
      />
      <div className="h-5"></div>

      <div className="bg-white/5 w-full max-w-5xl p-8 rounded-2xl backdrop-blur-md border border-gray-200">
        {steps[current]?.content}
      </div>
    </section>
  );
};

export default PricingSection;
