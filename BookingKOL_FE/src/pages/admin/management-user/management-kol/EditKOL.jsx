// src/pages/kol/EditKOL.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Tag,
  Select,
  Image,
  Typography,
  Space,
  Button,
  Divider,
  Popconfirm,
  InputNumber,
  message,
} from "antd";
import {
  FileImageOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  StarOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";

import { getKolProfileById } from "../../../../services/kol/KolAPI"; // GET detail (client)
import { getAllCategory } from "../../../../services/CategoryServices";

import {
  adminUpdateKolProfile, // PUT /v1/admin/kol/update/{kolId}
  adminAddKolCategory, // POST /v1/admin/kol/category/add/{kolId}?categoryId=...
  adminRemoveKolCategory, // DELETE /v1/admin/kol/category/remove/{kolId}?categoryId=...
  adminUploadKolMedias, // POST /v1/admin/kol/medias/upload/{kolId}
  adminDeleteKolMedia, // PATCH /v1/admin/kol/medias/delete/{fileId}
  adminSetCoverImage, // PUT /v1/admin/kol/cover-image/{kolId}?fileId=...
} from "../../../../services/admin/AdminAPI";

const { TextArea } = Input;
const { Title, Text } = Typography;

/* ========== Role mapping (UI <-> BE) ========== */
// BE chỉ nhận enum LIVE, nên luôn map HOST/CO_HOST -> LIVE khi gửi
const toBERole = (ui) =>
  ui === "HOST" || ui === "CO_HOST" ? "LIVE" : undefined;
// Khi load từ BE (LIVE) thì hiển thị là HOST để người dùng hiểu (không phân biệt CO_HOST được)
const toUIRole = (be) => (be === "LIVE" ? "HOST" : undefined);
const roleLabel = (ui) =>
  ui === "HOST" ? "Host chính" : ui === "CO_HOST" ? "Trợ live" : "—";

/* ========== Helpers ========== */
const notOnlySpacesRule = (msg) => ({
  validator: (_, v) =>
    typeof v === "string" && v.trim().length === 0
      ? Promise.reject(new Error(msg))
      : Promise.resolve(),
});
const now = dayjs();
const MIN_YEAR = now.year() - 60;
const MAX_YEAR = now.year() - 18;
const padded = (n) => String(n).padStart(2, "0");

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));

export default function EditKOL() {
  const { kolId } = useParams();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kol, setKol] = useState(null);
  const [allCategories, setAllCategories] = useState([]);

  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);
  const [settingCoverId, setSettingCoverId] = useState(null);
  const [deleting, setDeleting] = useState({}); // {[usageId]: boolean}

  // track dirty state (enable Save only when changed)
  const initialValuesRef = useRef({});
  const [dirty, setDirty] = useState(false);

  // DOB watch
  const dobMonth = Form.useWatch("dobMonth", form);
  const dobYear = Form.useWatch("dobYear", form);
  const dobDay = Form.useWatch("dobDay", form);

  const dayCount = useMemo(() => {
    if (!dobMonth || !dobYear) return 31;
    const first = dayjs(
      `${dobYear}-${padded(dobMonth)}-01`,
      "YYYY-MM-DD",
      true
    );
    return first.isValid() ? first.daysInMonth() : 31;
  }, [dobMonth, dobYear]);

  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--)
      arr.push({ value: y, label: `${y}` });
    return arr;
  }, []);

  const dayOptions = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}`,
      })),
    [dayCount]
  );

  const dobDisplay = useMemo(() => {
    if (dobDay && dobMonth && dobYear) {
      const d = dayjs(
        `${dobYear}-${padded(dobMonth)}-${padded(dobDay)}`,
        "YYYY-MM-DD",
        true
      );
      if (d.isValid()) return d.format("DD/MM/YYYY");
    }
    const dob = kol?.dob ? dayjs(kol.dob) : null;
    return dob?.isValid() ? dob.format("DD/MM/YYYY") : "—";
  }, [dobDay, dobMonth, dobYear, kol?.dob]);

  const normalizeValues = (vals) => ({
    displayName: (vals.displayName ?? "").trim(),
    dobDay: vals.dobDay ?? undefined,
    dobMonth: vals.dobMonth ?? undefined,
    dobYear: vals.dobYear ?? undefined,
    role: vals.role ?? undefined,
    experience: (vals.experience ?? "").trim(),
    city: (vals.city ?? "").trim(),
    country: (vals.country ?? "").trim(),
    bio: (vals.bio ?? "").trim(),
    categories: Array.isArray(vals.categories)
      ? [...vals.categories].sort()
      : [],
    minBookingPrice:
      typeof vals.minBookingPrice === "number"
        ? vals.minBookingPrice
        : undefined,
  });
  const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ========== Fetch data ========== */
  const fetchCategories = async () => {
    try {
      const res = await getAllCategory();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res?.data?.content)
        ? res.data.content
        : [];
      setAllCategories(list.filter(Boolean));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKol = async () => {
    setLoading(true);
    try {
      const res = await getKolProfileById(kolId); // <-- LẤY DETAIL như KolProfile
      setKol(res || null);

      const dob = res?.dob ? dayjs(res.dob) : null;
      const initFormVals = {
        displayName: res?.displayName || res?.fullName || "",
        dobDay: dob?.date() ?? undefined,
        dobMonth: dob ? dob.month() + 1 : undefined,
        dobYear: dob?.year() ?? undefined,
        role: toUIRole(res?.role),
        experience: res?.experience || "",
        city: res?.city || "",
        country: res?.country || "",
        bio: res?.bio || "",
        categories: Array.isArray(res?.categories)
          ? res.categories.map((c) => c.id)
          : [],
        minBookingPrice:
          typeof res?.minBookingPrice === "number"
            ? res.minBookingPrice
            : undefined,
      };
      form.setFieldsValue(initFormVals);

      // snapshot initial for dirty check
      initialValuesRef.current = normalizeValues(initFormVals);
      setDirty(false);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải hồ sơ KOL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchKol();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolId]);

  const categoryOptions = useMemo(
    () =>
      Array.isArray(allCategories)
        ? allCategories.map((c) => ({ value: c.id, label: c.name }))
        : [],
    [allCategories]
  );

  /* ========== Media derived ========== */
  const images = useMemo(() => {
    if (!Array.isArray(kol?.fileUsageDtos)) return [];
    return kol.fileUsageDtos
      .filter(
        (u) =>
          u?.isActive !== false &&
          u?.file?.fileType?.toUpperCase() === "IMAGE" &&
          u?.file?.status !== "DELETED" &&
          !!u?.file?.fileUrl
      )
      .map((u) => ({
        usageId: u.id,
        fileId: u?.file?.id || null,
        isCoverServer: !!u.isCover,
        file: { fileName: u?.file?.fileName, fileUrl: u?.file?.fileUrl },
      }));
  }, [kol]);

  const videos = useMemo(() => {
    if (!Array.isArray(kol?.fileUsageDtos)) return [];
    return kol.fileUsageDtos
      .filter(
        (u) =>
          u?.isActive !== false &&
          u?.file?.fileType?.toUpperCase() === "VIDEO" &&
          u?.file?.status !== "DELETED" &&
          !!u?.file?.fileUrl
      )
      .map((u) => ({
        usageId: u.id,
        fileId: u?.file?.id || null,
        file: { fileName: u?.file?.fileName, fileUrl: u?.file?.fileUrl },
      }));
  }, [kol]);

  const currentCoverFileId = useMemo(() => {
    const u = (kol?.fileUsageDtos || []).find((x) => x?.isCover && x?.file?.id);
    return u?.file?.id || null;
  }, [kol]);

  /* ========== Save (Update via ADMIN API) ========== */
  const onValuesChange = () => {
    const cur = normalizeValues(form.getFieldsValue());
    setDirty(!isEqual(cur, initialValuesRef.current));
  };

  const onSaveAll = async () => {
    try {
      const values = await form.validateFields();

      // compose DOB
      const { dobDay, dobMonth, dobYear } = values;
      let composedDob = undefined;
      if (dobDay && dobMonth && dobYear) {
        const date = dayjs(
          `${dobYear}-${padded(dobMonth)}-${padded(dobDay)}`,
          "YYYY-MM-DD",
          true
        );
        if (!date.isValid()) return message.error("Ngày sinh không hợp lệ.");
        if (dayjs().diff(date, "year") < 18)
          return message.error("Bạn phải từ 18 tuổi trở lên.");
        composedDob = date.format("YYYY-MM-DD");
      }

      const payload = {
        displayName: values.displayName?.trim() || undefined,
        dob: composedDob,
        role: toBERole(values.role), // => "LIVE" (BE enum hợp lệ)
        experience: values.experience?.trim() || undefined,
        city: values.city?.trim() || undefined,
        country: values.country?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        minBookingPrice:
          typeof values.minBookingPrice === "number"
            ? values.minBookingPrice
            : undefined,
        // ❌ Không gửi isAvailable nữa (đã bỏ nút)
      };

      // diff categories
      const initialIds = Array.isArray(kol?.categories)
        ? kol.categories.map((c) => c.id)
        : [];
      const newIds = Array.isArray(values.categories) ? values.categories : [];
      const toAdd = newIds.filter((id) => !initialIds.includes(id));
      const toRemove = initialIds.filter((id) => !newIds.includes(id));

      setSaving(true);

      // 1) cập nhật profile (ADMIN)
      await adminUpdateKolProfile(kolId, payload);

      // 2) cập nhật categories (ADMIN)
      await Promise.all([
        ...toAdd.map((id) => adminAddKolCategory(kolId, id)),
        ...toRemove.map((id) => adminRemoveKolCategory(kolId, id)),
      ]);

      message.success("Đã lưu thay đổi.");
      await fetchKol(); // reload lại để đồng bộ UI & reset dirty
    } catch (err) {
      if (err?.errorFields) return; // lỗi validate form
      console.error(err);
      message.error(err?.response?.data?.message || "Lưu thay đổi thất bại.");
    } finally {
      setSaving(false);
    }
  };

  /* ========== Media actions (ADMIN) ========== */
  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return message.error("Vui lòng chọn đúng định dạng ảnh.");
    try {
      await adminUploadKolMedias(kolId, file, {
        fileType: "IMAGE",
        targetType: "PORTFOLIO",
      });
      message.success("Đã tải ảnh lên.");
      await fetchKol();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Tải ảnh lên thất bại.");
    }
  };

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/"))
      return message.error("Vui lòng chọn đúng định dạng video.");
    try {
      await adminUploadKolMedias(kolId, file, {
        fileType: "VIDEO",
        targetType: "PORTFOLIO",
      });
      message.success("Đã tải video lên.");
      await fetchKol();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Tải video lên thất bại.");
    }
  };

  const onDeleteMedia = async (usageId, fileId) => {
    setDeleting((p) => ({ ...p, [usageId]: true }));
    try {
      await adminDeleteKolMedia(fileId);
      message.success("Đã xoá media.");
      await fetchKol();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xoá media thất bại.");
    } finally {
      setDeleting((p) => ({ ...p, [usageId]: false }));
    }
  };

  const onChooseCover = async (fileId) => {
    try {
      setSettingCoverId(fileId);
      await adminSetCoverImage(kolId, fileId);
      message.success("Đã đặt làm ảnh bìa.");
      await fetchKol();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Đặt ảnh bìa thất bại.");
    } finally {
      setSettingCoverId(null);
    }
  };

  /* ========== UI ========== */
  return (
    <div className="px-4 py-6" style={{ maxWidth: 1760, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-0">
            Chỉnh sửa KOL
          </Title>
          <Text type="secondary">ID: {kolId || "—"}</Text>
        </div>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSaveAll}
            loading={saving}
            disabled={!dirty}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>

      {/* ONE FORM bọc toàn bộ các field để đồng bộ dữ liệu */}
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <Space direction="vertical" size={24} className="w-full">
          {/* ===== Thông tin cơ bản ===== */}
          <Card
            loading={loading}
            title={
              <Title level={4} className="!mb-0">
                Thông tin cơ bản
              </Title>
            }
            className="shadow-sm rounded-2xl"
            bodyStyle={{ padding: 24 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={16} xl={18}>
                <Form.Item
                  label="Tên hiển thị"
                  name="displayName"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên hiển thị" },
                    { min: 2, max: 60, message: "Độ dài 2–60 ký tự" },
                    notOnlySpacesRule("Tên không được chỉ gồm khoảng trắng"),
                  ]}
                >
                  <Input className="!h-12" placeholder="Tên hiển thị" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item
                          label="Ngày"
                          name="dobDay"
                          rules={[{ required: true, message: "Chọn ngày" }]}
                        >
                          <Select
                            size="large"
                            className="!h-12"
                            options={dayOptions}
                            placeholder="Ngày"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label="Tháng"
                          name="dobMonth"
                          rules={[{ required: true, message: "Chọn tháng" }]}
                        >
                          <Select
                            size="large"
                            className="!h-12"
                            options={monthOptions}
                            placeholder="Tháng"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label="Năm"
                          name="dobYear"
                          rules={[
                            { required: true, message: "Chọn năm" },
                            {
                              validator: () => {
                                const d = form.getFieldValue("dobDay");
                                const m = form.getFieldValue("dobMonth");
                                const y = form.getFieldValue("dobYear");
                                if (!d || !m || !y) return Promise.resolve();
                                const date = dayjs(
                                  `${y}-${padded(m)}-${padded(d)}`,
                                  "YYYY-MM-DD",
                                  true
                                );
                                if (!date.isValid())
                                  return Promise.reject(
                                    new Error("Ngày sinh không hợp lệ.")
                                  );
                                const age = dayjs().diff(date, "year");
                                return age >= 18
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error("Bạn phải từ 18 tuổi trở lên.")
                                    );
                              },
                            },
                          ]}
                        >
                          <Select
                            size="large"
                            className="!h-12"
                            options={yearOptions}
                            placeholder="Năm"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Vị trí"
                      name="role"
                      rules={[
                        { required: true, message: "Vui lòng chọn vị trí" },
                        {
                          validator: (_, v) =>
                            v === "HOST" || v === "CO_HOST"
                              ? Promise.resolve()
                              : Promise.reject(
                                  new Error("Vị trí không hợp lệ.")
                                ),
                        },
                      ]}
                    >
                      <Select
                        className="!h-12"
                        size="large"
                        options={[
                          { value: "HOST", label: "Host chính" },
                          { value: "CO_HOST", label: "Trợ live" },
                        ]}
                        allowClear
                        placeholder="Chọn vị trí"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Kinh nghiệm"
                      name="experience"
                      rules={[
                        { max: 100, message: "Tối đa 100 ký tự" },
                        notOnlySpacesRule(
                          "Kinh nghiệm không được rỗng toàn khoảng trắng"
                        ),
                      ]}
                    >
                      <Input
                        className="!h-12"
                        placeholder="VD: 3 năm livestream..."
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Thành phố"
                      name="city"
                      rules={[
                        { max: 50, message: "Tối đa 50 ký tự" },
                        notOnlySpacesRule("Thành phố không hợp lệ"),
                      ]}
                    >
                      <Input className="!h-12" placeholder="VD: Đà Nẵng" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Quốc gia"
                      name="country"
                      rules={[
                        { max: 50, message: "Tối đa 50 ký tự" },
                        notOnlySpacesRule("Quốc gia không hợp lệ"),
                      ]}
                    >
                      <Input className="!h-12" placeholder="VD: Việt Nam" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Giới thiệu"
                  name="bio"
                  rules={[{ max: 1000, message: "Tối đa 1000 ký tự" }]}
                >
                  <TextArea
                    autoSize={{ minRows: 6 }}
                    style={{ backgroundColor: "#fff", fontSize: 15 }}
                    placeholder="Mô tả bản thân, thế mạnh…"
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8} xl={6}>
                <div className="border rounded-xl p-3 bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Text strong>Thông tin hồ sơ</Text>
                    <Tag color={kol?.isAvailable ? "green" : "default"}>
                      {kol?.isAvailable ? "Sẵn sàng" : "Bận"}
                    </Tag>
                  </div>
                  <Text type="secondary" className="block mb-1">
                    ID: {kol?.id || "—"}
                  </Text>
                  <Text type="secondary" className="block">
                    Vị trí: {roleLabel(toUIRole(kol?.role))}
                  </Text>
                  <Text type="secondary" className="block">
                    Danh mục:{" "}
                    {Array.isArray(kol?.categories) && kol.categories.length
                      ? kol.categories.map((c) => c.name).join(" • ")
                      : "—"}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ===== Giá & Trạng thái ===== */}
          <Card
            loading={loading}
            title={
              <Title level={4} className="!mb-0">
                Giá & Trạng thái
              </Title>
            }
            className="shadow-sm rounded-2xl"
            bodyStyle={{ padding: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Giá booking tối thiểu"
                  name="minBookingPrice"
                  rules={[
                    { required: true, message: "Vui lòng nhập giá tối thiểu" },
                    {
                      validator: (_, v) =>
                        typeof v === "number" && v > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error("Giá phải lớn hơn 0")),
                    },
                  ]}
                >
                  <InputNumber
                    className="!w-full !h-12"
                    min={0}
                    step={10000}
                    placeholder="VD: 500000"
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(v) => v?.replace(/,/g, "")}
                  />
                </Form.Item>
              </Col>
              {/* ĐÃ GỠ SWITCH SẴN SÀNG NHẬN BOOKING */}
            </Row>
          </Card>

          {/* ===== Chuyên mục ===== */}
          <Card
            loading={loading}
            title={
              <Title level={4} className="!mb-0">
                Chuyên mục
              </Title>
            }
            className="shadow-sm rounded-2xl"
            bodyStyle={{ padding: 24 }}
          >
            <Form.Item
              label="Chọn chuyên mục"
              name="categories"
              rules={[
                {
                  validator: (_, v) =>
                    Array.isArray(v) && v.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error("Chọn ít nhất 1 chuyên mục")),
                },
              ]}
            >
              <Select
                mode="multiple"
                className="!min-h-12"
                size="large"
                placeholder="Chọn chuyên mục"
                options={categoryOptions}
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </Form.Item>
          </Card>

          {/* ===== Media ===== */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <Title level={4} className="!mb-0">
                  Media
                </Title>
                <Space>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPickImage}
                  />
                  <input
                    ref={vidInputRef}
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={onPickVideo}
                  />
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => imgInputRef.current?.click()}
                  >
                    Thêm ảnh
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => vidInputRef.current?.click()}
                  >
                    Thêm video
                  </Button>
                </Space>
              </div>
            }
            className="shadow-sm rounded-2xl"
            loading={loading}
            bodyStyle={{ padding: 24 }}
          >
            {/* Ảnh */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Text strong>Ảnh</Text>
                <Tag color={images.length ? "green" : "default"}>
                  {images.length ? `${images.length} tệp` : "Trống"}
                </Tag>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((img) => {
                  const isCover = img.fileId === currentCoverFileId;
                  return (
                    <div
                      key={img.usageId}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white"
                      style={{ height: 140 }}
                    >
                      <Image
                        src={img.file.fileUrl}
                        alt={img.file.fileName}
                        preview={false}
                        fallback={<FileImageOutlined />}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {isCover && (
                        <Tag
                          className="!absolute !top-1 !left-1 !rounded-full !px-2 !py-0"
                          color="blue"
                        >
                          Ảnh bìa
                        </Tag>
                      )}

                      <div className="!absolute !top-1 !right-1 z-20 flex gap-1">
                        <Popconfirm
                          title="Xoá media này?"
                          okText="Xoá"
                          cancelText="Huỷ"
                          onConfirm={() =>
                            onDeleteMedia(img.usageId, img.fileId)
                          }
                        >
                          <Button
                            type="text"
                            shape="circle"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            loading={!!deleting[img.usageId]}
                            className="!bg-white/90 hover:!bg-white"
                          />
                        </Popconfirm>
                      </div>

                      {!isCover && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                          <Button
                            type="primary"
                            icon={<StarOutlined />}
                            onClick={() => onChooseCover(img.fileId)}
                            loading={settingCoverId === img.fileId}
                            className="pointer-events-auto"
                          >
                            Chọn làm ảnh bìa
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!images.length && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {/* Video */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text strong>Video</Text>
                <Tag color={videos.length ? "purple" : "default"}>
                  {videos.length ? `${videos.length} tệp` : "Trống"}
                </Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {videos.map((v) => (
                  <div
                    key={v.usageId}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden bg-black"
                    style={{ height: 160 }}
                  >
                    <video
                      src={v.file.fileUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      controls
                    />
                    <div className="!absolute !top-1 !right-1 z-20">
                      <Popconfirm
                        title="Xoá media này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => onDeleteMedia(v.usageId, v.fileId)}
                      >
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          loading={!!deleting[v.usageId]}
                          className="!bg-white/90 hover:!bg-white"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
                {!videos.length && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                    Chưa có video
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Space>
      </Form>

      {/* Footer */}
      <Divider style={{ margin: "24px 0 0" }} />
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={onSaveAll}
          disabled={!dirty}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
