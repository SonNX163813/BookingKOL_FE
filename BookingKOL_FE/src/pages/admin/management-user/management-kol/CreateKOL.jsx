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
  { label: "Host Chính", value: "KOL" },
  { label: "Trợ Live", value: "LIVE" },
];

const today = dayjs();
const MIN_AGE = 18;
const MAX_AGE = 60;

const MAX_NAME_LEN = 30;
const MAX_STR_LEN = 100;
const MAX_BIO_LEN = 500;
const MAX_PRICE_DIGITS = 13;
const MAX_PRICE_VALUE = 9999999999999; // 13 digits

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

const charCount = (v) => (typeof v === "string" ? v.length : 0);

const renderCharExtra = (value, max) => {
  const count = charCount(value ?? "");
  const isMax = count >= max;
  return (
    <Text type={isMax ? "danger" : "secondary"} className="text-xs">
      {isMax ? `Đã đạt tối đa ${max} ký tự` : `${count}/${max} ký tự`}
    </Text>
  );
};

const renderDigitExtra = (value, maxDigits) => {
  const raw =
    value === undefined || value === null || value === "" ? "" : String(value);
  const digits = raw.replace(/\D/g, "");
  const count = digits.length;
  const isMax = count >= maxDigits;
  return (
    <Text type={isMax ? "danger" : "secondary"} className="text-xs">
      {isMax
        ? `Đã đạt tối đa ${maxDigits} chữ số`
        : `${count}/${maxDigits} chữ số`}
    </Text>
  );
};

const formatVnd = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseVndToNumberOrEmpty = (val) => {
  if (val === undefined || val === null) return "";
  const digits = String(val).replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);
  return digits ? Number(digits) : "";
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

  // Watch values for "extra" hints dưới input
  const fullNameVal = Form.useWatch("fullName", form);
  const displayNameVal = Form.useWatch("displayName", form);
  const emailVal = Form.useWatch("email", form);
  const phoneVal = Form.useWatch("phone", form);
  const passwordVal = Form.useWatch("password", form);
  const countryVal = Form.useWatch("country", form);
  const cityVal = Form.useWatch("city", form);
  const addressVal = Form.useWatch("address", form);
  const experienceVal = Form.useWatch("experience", form);
  const bioVal = Form.useWatch("bio", form);
  const minBookingPriceVal = Form.useWatch("minBookingPrice", form);

  useEffect(() => {
    let revokeUrl;
    if (avatarPreview) revokeUrl = avatarPreview;
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
        .map((item) => ({ label: item.name, value: item.id })),
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
    return false; // chặn auto upload
  };

  const handleAvatarRemove = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarFileList([]);
    setAvatarPreview("");
  };

  const buildPayload = (values) => {
    const dob = values.dob ? values.dob.format("YYYY-MM-DD") : null;

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

  const blockNonDigitKeys = (e) => {
    // chặn ký tự đặc biệt/ chữ ở input số: e, E, +, -, .
    const blocked = ["e", "E", "+", "-", ".", ",", " "];
    if (blocked.includes(e.key)) e.preventDefault();
  };

  const handlePasteDigitsOnly = (e) => {
    const text = e.clipboardData?.getData("text") ?? "";
    if (!text) return;
    const digits = text.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);
    if (digits.length !== text.length) {
      // nếu có ký tự khác số → chặn paste và tự set giá trị đã lọc
      e.preventDefault();
      form.setFieldValue("minBookingPrice", digits ? Number(digits) : "");
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
          <Button
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
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
                    extra={renderCharExtra(fullNameVal, MAX_NAME_LEN)}
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên." },
                      {
                        max: MAX_NAME_LEN,
                        message: `Họ và tên tối đa ${MAX_NAME_LEN} ký tự.`,
                      },
                      {
                        validator: (_, value) => {
                          if (value && value.trim().length === 0) {
                            return Promise.reject(
                              new Error("Họ tên không hợp lệ.")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_NAME_LEN}
                      placeholder="Ví dụ: Nguyễn Văn A"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Tên hiển thị"
                    name="displayName"
                    extra={renderCharExtra(displayNameVal, MAX_NAME_LEN)}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên hiển thị.",
                      },
                      {
                        max: MAX_NAME_LEN,
                        message: `Tên hiển thị tối đa ${MAX_NAME_LEN} ký tự.`,
                      },
                      {
                        validator: (_, value) => {
                          if (value && value.trim().length === 0) {
                            return Promise.reject(
                              new Error("Tên hiển thị không hợp lệ.")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_NAME_LEN}
                      placeholder="Ví dụ: Anna Nguyen"
                    />
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
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[
                      { required: true, message: "Vui lòng chọn giới tính." },
                    ]}
                  >
                    <Select
                      options={genderOptions}
                      placeholder="Giới tính"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    extra={renderCharExtra(emailVal, MAX_STR_LEN)}
                    rules={[
                      { required: true, message: "Vui lòng nhập email." },
                      { type: "email", message: "Email không hợp lệ." },
                      {
                        max: MAX_STR_LEN,
                        message: `Email tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_STR_LEN}
                      placeholder="kol@example.com"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    extra={renderCharExtra(phoneVal, 20)}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại.",
                      },
                      { max: 20, message: "Số điện thoại tối đa 20 ký tự." },
                      {
                        pattern: /^[0-9+()\s-]{8,20}$/,
                        message: "Số điện thoại không hợp lệ.",
                      },
                    ]}
                  >
                    <Input
                      maxLength={20}
                      placeholder="0123456789"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    extra={renderCharExtra(passwordVal, MAX_STR_LEN)}
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu." },
                      { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
                      {
                        max: MAX_STR_LEN,
                        message: `Mật khẩu tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input.Password
                      maxLength={MAX_STR_LEN}
                      placeholder="********"
                      disabled={submitting}
                    />
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
                    <Select
                      placeholder="Chọn vai trò"
                      options={roleOptions}
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Quốc gia"
                    name="country"
                    extra={renderCharExtra(countryVal, MAX_STR_LEN)}
                    rules={[
                      {
                        max: MAX_STR_LEN,
                        message: `Quốc gia tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_STR_LEN}
                      placeholder="Ví dụ: Việt Nam"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Thành phố"
                    name="city"
                    extra={renderCharExtra(cityVal, MAX_STR_LEN)}
                    rules={[
                      {
                        max: MAX_STR_LEN,
                        message: `Thành phố tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_STR_LEN}
                      placeholder="Ví dụ: Hà Nội"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Địa chỉ"
                    name="address"
                    extra={renderCharExtra(addressVal, MAX_STR_LEN)}
                    rules={[
                      {
                        max: MAX_STR_LEN,
                        message: `Địa chỉ tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_STR_LEN}
                      placeholder="Số nhà, đường, quận..."
                      disabled={submitting}
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
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Giá booking tối thiểu (VNĐ)"
                    name="minBookingPrice"
                    extra={renderDigitExtra(
                      minBookingPriceVal,
                      MAX_PRICE_DIGITS
                    )}
                    rules={[
                      {
                        validator: (_, value) => {
                          if (
                            value === "" ||
                            value === undefined ||
                            value === null
                          )
                            return Promise.resolve();
                          const digits = String(value).replace(/\D/g, "");
                          if (digits.length > MAX_PRICE_DIGITS) {
                            return Promise.reject(
                              new Error(
                                `Giá tối đa ${MAX_PRICE_DIGITS} chữ số.`
                              )
                            );
                          }
                          const num = Number(digits);
                          if (!Number.isFinite(num))
                            return Promise.reject(
                              new Error("Giá không hợp lệ.")
                            );
                          if (num < 0)
                            return Promise.reject(
                              new Error(
                                "Giá tối thiểu phải lớn hơn hoặc bằng 0."
                              )
                            );
                          if (num > MAX_PRICE_VALUE) {
                            return Promise.reject(
                              new Error(
                                `Giá tối đa ${MAX_PRICE_VALUE.toLocaleString(
                                  "vi-VN"
                                )} VNĐ.`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={MAX_PRICE_VALUE}
                      precision={0}
                      stringMode={false}
                      controls={false}
                      formatter={(value) => formatVnd(value)}
                      parser={(value) => parseVndToNumberOrEmpty(value)}
                      onKeyDown={blockNonDigitKeys}
                      onPaste={handlePasteDigitsOnly}
                      placeholder="Ví dụ: 500.000"
                      disabled={submitting}
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
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Kinh nghiệm"
                    name="experience"
                    extra={renderCharExtra(experienceVal, MAX_STR_LEN)}
                    rules={[
                      {
                        max: MAX_STR_LEN,
                        message: `Kinh nghiệm tối đa ${MAX_STR_LEN} ký tự.`,
                      },
                    ]}
                  >
                    <Input
                      maxLength={MAX_STR_LEN}
                      placeholder="Ví dụ: 5 năm Livestream"
                      disabled={submitting}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Giới thiệu"
                name="bio"
                extra={renderCharExtra(bioVal, MAX_BIO_LEN)}
                rules={[
                  {
                    max: MAX_BIO_LEN,
                    message: `Giới thiệu tối đa ${MAX_BIO_LEN} ký tự.`,
                  },
                ]}
              >
                <TextArea
                  maxLength={MAX_BIO_LEN}
                  rows={4}
                  placeholder="Giới thiệu ngắn về KOL"
                  disabled={submitting}
                />
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
                  disabled={submitting}
                >
                  <div
                    className={`flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-6 bg-white transition-colors ${
                      submitting
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:border-[#fa7833]"
                    }`}
                    style={{ cursor: submitting ? "not-allowed" : "pointer" }}
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
                    disabled={submitting}
                  >
                    Xoá ảnh
                  </Button>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)} disabled={submitting}>
              Huỷ
            </Button>

            {/* ✅ Disable khi isLoading/submitting */}
            <Button
              type="primary"
              htmlType="submit"
              icon={!submitting ? <SaveOutlined /> : undefined}
              loading={submitting}
              disabled={submitting}
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
