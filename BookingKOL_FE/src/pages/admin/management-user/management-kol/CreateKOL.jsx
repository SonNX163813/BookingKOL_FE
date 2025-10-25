import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Upload,
  message,
  Typography,
} from "antd";
import { LeftOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { getAllCategory } from "../../../../services/CategoryServices";
import { adminCreateKol } from "../../../../services/admin/AdminAPI";

const { Title, Text } = Typography;
const { TextArea } = Input;

const genderOptions = [
  { label: "Nam", value: "MALE" },
  { label: "Nữ", value: "FEMALE" },
  { label: "Khác", value: "OTHER" },
];

const statusOptions = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Tạm khóa", value: "INACTIVE" },
];

const roleOptions = [
  { label: "KOL", value: "KOL" },
  { label: "Live", value: "LIVE" },
];

const today = dayjs();
const MIN_AGE = 18;
const MAX_AGE = 60;

const normalizeCategories = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
};

const toInt = (value, fallback = 0) => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const CreateKOL = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [allCategories, setAllCategories] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let revokeUrl;
    if (avatarPreview) {
      revokeUrl = avatarPreview;
    }
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [avatarPreview]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await getAllCategory();
        setAllCategories(normalizeCategories(res));
      } catch (error) {
        console.error(error);
        message.error("Không thể tải danh sách chuyên mục.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
    form.setFieldsValue({
      status: "ACTIVE",
      minBookingPrice: 0,
    });
  }, [form]);

  const categoryOptions = useMemo(
    () =>
      allCategories
        .filter((item) => item?.id && item?.name)
        .map((item) => ({
          label: item.name,
          value: item.id,
        })),
    [allCategories]
  );

  const disabledDob = (current) => {
    if (!current) return false;
    const tooYoung = today.subtract(MIN_AGE, "year");
    const tooOld = today.subtract(MAX_AGE, "year");
    return current.isAfter(tooYoung, "day") || current.isBefore(tooOld, "day");
  };

  const beforeUploadAvatar = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn tệp ảnh hợp lệ.");
      return Upload.LIST_IGNORE;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error("Ảnh đại diện tối đa 5MB.");
      return Upload.LIST_IGNORE;
    }

    const objectUrl = URL.createObjectURL(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(objectUrl);
    setAvatarFileList([
      {
        uid: file.uid || file.name,
        name: file.name,
        status: "done",
        url: objectUrl,
        originFileObj: file,
      },
    ]);
    return false;
  };

  const handleAvatarRemove = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarFileList([]);
    setAvatarPreview("");
  };

  const buildPayload = (values) => {
    const dob = values.dob ? values.dob.format("YYYY-MM-DD") : null;
    const languages = Array.isArray(values.languages)
      ? values.languages.join(", ")
      : values.languages || null;

    const raw = {
      fullName: values.fullName?.trim(),
      displayName: values.displayName?.trim(),
      dob,
      email: values.email?.trim(),
      phone: values.phone?.trim() || null,
      password: values.password,
      gender: values.gender || null,
      address: values.address?.trim() || null,
      avatarUrl: values.avatarUrl?.trim() || null,
      status: values.status || "ACTIVE",
      bio: values.bio?.trim() || null,
      experience: values.experience?.trim() || null,
      country: values.country?.trim() || null,
      city: values.city?.trim() || null,
      languages,
      rateCardNote: values.rateCardNote?.trim() || null,
      minBookingPrice: toInt(values.minBookingPrice, 0),
      role: values.role,
      categoryIds: values.categoryIds || [],
    };

    return Object.fromEntries(
      Object.entries(raw).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== "string" || value.trim() !== "")
      )
    );
  };

  const handleSubmit = async (values) => {
    if (!avatarFile) {
      message.error("Vui lòng chọn ảnh đại diện cho KOL.");
      return;
    }

    if (values.dob) {
      const age = today.diff(values.dob, "year");
      if (age < MIN_AGE) {
        message.error("KOL phải từ 18 tuổi trở lên.");
        return;
      }
      if (age > MAX_AGE) {
        message.error("KOL không được lớn hơn 60 tuổi.");
        return;
      }
    }

    const newKolDTO = buildPayload(values);
    setSubmitting(true);
    try {
      await adminCreateKol({ fileAvatar: avatarFile, newKolDTO });
      message.success("Tạo tài khoản KOL thành công.");
      navigate("/admin/management-kol");
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || "Không thể tạo tài khoản KOL."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-4">
        <Space direction="vertical" size={0}>
          <Title level={3} className="!mb-1">
            Tạo mới KOL
          </Title>
          <Text type="secondary">
            Điền thông tin bên dưới để tạo tài khoản KOL cho hệ thống.
          </Text>
        </Space>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Space>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            status: "ACTIVE",
            minBookingPrice: 0,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên." },
                      {
                        validator: (_, value) =>
                          value && value.trim().length === 0
                            ? Promise.reject(new Error("Họ tên không hợp lệ."))
                            : Promise.resolve(),
                      },
                    ]}
                  >
                    <Input placeholder="Ví dụ: Nguyễn Văn A" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tên hiển thị"
                    name="displayName"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên hiển thị.",
                      },
                      {
                        validator: (_, value) =>
                          value && value.trim().length === 0
                            ? Promise.reject(
                                new Error("Tên hiển thị không hợp lệ.")
                              )
                            : Promise.resolve(),
                      },
                    ]}
                  >
                    <Input placeholder="Ví dụ: Anna Nguyen" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Ngày sinh"
                    name="dob"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày sinh." },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      disabledDate={disabledDob}
                      placeholder="Chọn ngày sinh"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn giới tính.",
                      },
                    ]}
                  >
                    <Select options={genderOptions} placeholder="Giới tính" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email." },
                      { type: "email", message: "Email không hợp lệ." },
                    ]}
                  >
                    <Input placeholder="kol@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại.",
                      },
                      {
                        pattern: /^[0-9+()\s-]{8,20}$/,
                        message: "Số điện thoại không hợp lệ.",
                      },
                    ]}
                  >
                    <Input placeholder="0123456789" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu." },
                      {
                        min: 8,
                        message: "Mật khẩu phải có ít nhất 8 ký tự.",
                      },
                    ]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Vai trò hệ thống"
                    name="role"
                    rules={[
                      { required: true, message: "Vui lòng chọn vai trò." },
                    ]}
                  >
                    <Select placeholder="Chọn vai trò" options={roleOptions} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Quốc gia" name="country">
                    <Input placeholder="Ví dụ: Việt Nam" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Thành phố" name="city">
                    <Input placeholder="Ví dụ: Hà Nội" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Địa chỉ" name="address">
                    <Input placeholder="Số nhà, đường, quận..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Ngôn ngữ"
                    name="languages"
                    // tooltip="Chọn hoặc nhập các ngôn ngữ mà KOL sử dụng"
                  >
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Chọn ngôn ngữ"
                      options={[
                        { label: "Tiếng Việt (Vi)", value: "Vi" },
                        { label: "Tiếng Anh (En)", value: "En" },
                        { label: "Tiếng Nhật (Ja)", value: "Ja" },
                        { label: "Tiếng Hàn (Ko)", value: "Ko" },
                        { label: "Tiếng Trung (Zh)", value: "Zh" },
                        { label: "Tiếng Pháp (Fr)", value: "Fr" },
                        { label: "Tiếng Đức (De)", value: "De" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Chuyên mục"
                    name="categoryIds"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ít nhất một chuyên mục.",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn chuyên mục"
                      loading={loadingCategories}
                      options={categoryOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giá booking tối thiểu (VNĐ)"
                    name="minBookingPrice"
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        message: "Giá tối thiểu phải lớn hơn hoặc bằng 0.",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={50000}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                      }
                      parser={(value) =>
                        value ? value.replace(/\./g, "") : "0"
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Trạng thái" name="status">
                    <Select
                      placeholder="Chọn trạng thái"
                      options={statusOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Kinh nghiệm" name="experience">
                    <Input placeholder="Ví dụ: 5 năm Livestream" />
                  </Form.Item>
                </Col>
                {/* <Col span={12}>
                  <Form.Item label="Ghi chú bảng giá" name="rateCardNote">
                    <Input placeholder="Thông tin thêm về bảng giá" />
                  </Form.Item>
                </Col> */}
              </Row>

              <Row gutter={16}></Row>

              <Form.Item label="Giới thiệu" name="bio">
                <TextArea rows={4} placeholder="Giới thiệu ngắn về KOL" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title="Ảnh đại diện"
                bordered={false}
                className="bg-gray-50"
              >
                <Upload
                  accept="image/*"
                  maxCount={1}
                  showUploadList={false}
                  fileList={avatarFileList}
                  beforeUpload={beforeUploadAvatar}
                >
                  <div
                    className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-6 bg-white hover:border-[#fa7833] transition-colors"
                    style={{ cursor: "pointer" }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-40 h-40 object-cover rounded-full mb-3 shadow-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <PlusOutlined className="text-xl" />
                        <span>Tải ảnh đại diện</span>
                      </div>
                    )}
                    <Text type="secondary" className="text-center text-xs mt-2">
                      Định dạng hỗ trợ: JPG, PNG. Kích thước tối đa 5MB.
                    </Text>
                  </div>
                </Upload>

                {avatarPreview && (
                  <Button
                    block
                    danger
                    className="mt-3"
                    onClick={handleAvatarRemove}
                  >
                    Xoá ảnh
                  </Button>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)}>Huỷ</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={!submitting ? <SaveOutlined /> : undefined}
              loading={submitting}
            >
              Tạo KOL
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateKOL;
