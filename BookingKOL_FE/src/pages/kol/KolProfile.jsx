// src/pages/kol/KolProfile.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
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
} from "antd";
import {
  FileImageOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  StarOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getKolProfileById,
  getKolProfileByUserId,
  updateMyKolProfile,
  uploadKolMedias,
  addKolCategories,
  removeKolCategories,
  setCoverImage,
  deleteKolMedia,
} from "../../services/kol/KolAPI";
import { getAllCategory } from "../../services/CategoryServices";
import { useAuth } from "../../context/AuthContext";

const { TextArea } = Input;
const { Title, Text } = Typography;

/* ================== ROLE MAPPING (UI <-> BE) ================== */
const mapUiRoleToBackend = (ui) => {
  if (ui === "HOST" || ui === "CO_HOST") return "LIVE";
  return undefined;
};
const mapBackendToUi = (be) => {
  if (be === "LIVE") return "HOST";
  return undefined;
};
const roleLabel = (ui) =>
  ui === "HOST" ? "Host chính" : ui === "CO_HOST" ? "Trợ live" : "—";

/* ================== Helpers ================== */
const notOnlySpacesRule = (msg) => ({
  validator: (_, v) =>
    typeof v === "string" && v.trim().length === 0
      ? Promise.reject(new Error(msg))
      : Promise.resolve(),
});

const now = dayjs();
const MIN_YEAR = now.year() - 60;
const MAX_YEAR = now.year() - 18;
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));
const padded = (n) => String(n).padStart(2, "0");

// Tìm container scroll gần nhất (nếu app bọc bởi div overflow-auto)
const getScrollParent = (node) => {
  if (!node) return window;
  let el = node.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    if (
      /(auto|scroll|overlay)/.test(overflowY) ||
      /(auto|scroll|overlay)/.test(overflow)
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return window;
};

export default function KolProfile() {
  const { kolId } = useParams();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mediaEditing, setMediaEditing] = useState(false);

  const [kol, setKol] = useState(null);
  const [allCategories, setAllCategories] = useState([]);

  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);
  const [settingCoverId, setSettingCoverId] = useState(null);

  const [deleting, setDeleting] = useState({});

  const [form] = Form.useForm();
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);

  // --- Giữ vị trí cuộn quanh khu vực Media ---
  const mediaCardRef = useRef(null);
  const scrollElRef = useRef(null);
  const needRestoreRef = useRef(false);

  const measureScrollEl = () => {
    scrollElRef.current = getScrollParent(mediaCardRef.current);
  };

  const scrollToMedia = () => {
    const container = scrollElRef.current || window;
    const anchor = mediaCardRef.current;
    if (!anchor) return;

    if (container !== window) {
      const top =
        anchor.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        12;
      container.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
    } else {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
    }
  };

  useLayoutEffect(() => {
    if (needRestoreRef.current) {
      scrollToMedia();
      const t = setTimeout(scrollToMedia, 150);
      needRestoreRef.current = false;
      return () => clearTimeout(t);
    }
  }, [kol]);

  useEffect(() => {
    measureScrollEl();
    const onResize = () => measureScrollEl();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // === watch DOB sub-fields ===
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
    return dob?.isValid() ? dob.format("DD/MM/YYYY") : "";
  }, [dobDay, dobMonth, dobYear, kol?.dob]);

  const fetchKol = async () => {
    setLoading(true);
    try {
      let res = null;
      if (kolId) res = await getKolProfileById(kolId);
      else if (userId) res = await getKolProfileByUserId(userId);

      if (!res) {
        toast.info("Không tìm thấy hồ sơ KOL.");
        setKol(null);
      } else {
        setKol(res);
        const dob = res.dob ? dayjs(res.dob) : null;
        form.setFieldsValue({
          displayName: res.displayName || res.fullName || "",
          dobDay: dob?.date() ?? undefined,
          dobMonth: dob ? dob.month() + 1 : undefined,
          dobYear: dob?.year() ?? undefined,
          role: mapBackendToUi(res.role),
          experience: res.experience || "",
          city: res.city || "",
          country: res.country || "",
          bio: res.bio || "",
          categories: Array.isArray(res.categories)
            ? res.categories.map((c) => c.id)
            : [],
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải hồ sơ KOL.");
    } finally {
      setLoading(false);
      measureScrollEl();
    }
  };

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

  useEffect(() => {
    fetchKol();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolId, userId]);

  const categoryOptions = useMemo(
    () =>
      Array.isArray(allCategories)
        ? allCategories.map((c) => ({ value: c.id, label: c.name }))
        : [],
    [allCategories]
  );

  /* ========= ẨN usage AVATAR trong Media (siêu chịu lỗi) ========= */
  const norm = (v) => {
    if (typeof v === "string") return v.toUpperCase();
    if (v && typeof v.name === "string") return v.name.toUpperCase(); // trường hợp enum object {name:"AVATAR"}
    return "";
  };
  const isAvatarUsage = (u) => {
    // Bắt mọi khả năng: targetType/usageType/purpose/type/tag ở cả usage lẫn file
    const fields = [
      norm(u?.targetType),
      norm(u?.usageType),
      norm(u?.purpose),
      norm(u?.type),
      norm(u?.tag),
      norm(u?.file?.targetType),
      norm(u?.file?.usageType),
      norm(u?.file?.purpose),
      norm(u?.file?.type),
    ];
    if (u?.isAvatar === true || u?.file?.isAvatar === true) return true;
    return fields.some((s) => s.includes("AVATAR"));
  };

  // Lọc media hiển thị (NO AVATAR)
  const images = useMemo(() => {
    if (!Array.isArray(kol?.fileUsageDtos)) return [];
    return kol.fileUsageDtos
      .filter(
        (u) =>
          u?.isActive !== false &&
          !isAvatarUsage(u) && // loại avatar
          (u?.file?.fileType || "").toString().toUpperCase() === "IMAGE" &&
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
          !isAvatarUsage(u) && // loại avatar
          (u?.file?.fileType || "").toString().toUpperCase() === "VIDEO" &&
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

  const cancelEdit = () => {
    setEditing(false);
    if (!kol) return;
    const dob = kol.dob ? dayjs(kol.dob) : null;
    form.setFieldsValue({
      displayName: kol.displayName || kol.fullName || "",
      dobDay: dob?.date() ?? undefined,
      dobMonth: dob ? dob.month() + 1 : undefined,
      dobYear: dob?.year() ?? undefined,
      role: mapBackendToUi(kol.role),
      experience: kol.experience || "",
      city: kol.city || "",
      country: kol.country || "",
      bio: kol.bio || "",
      categories: Array.isArray(kol.categories)
        ? kol.categories.map((c) => c.id)
        : [],
    });
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();

      const { dobDay, dobMonth, dobYear } = values;
      let composedDob = null;
      if (dobDay && dobMonth && dobYear) {
        const date = dayjs(
          `${dobYear}-${padded(dobMonth)}-${padded(dobDay)}`,
          "YYYY-MM-DD",
          true
        );
        if (!date.isValid()) {
          toast.error("Ngày sinh không hợp lệ.");
          return;
        }
        if (dayjs().diff(date, "year") < 18) {
          toast.error("Bạn phải từ 18 tuổi trở lên.");
          return;
        }
        composedDob = date;
      }

      const payload = {
        displayName: values.displayName?.trim() || undefined,
        dob: composedDob ? composedDob.format("YYYY-MM-DD") : undefined,
        experience: values.experience?.trim() || undefined,
        city: values.city?.trim() || undefined,
        country: values.country?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
      };

      const beRole = mapUiRoleToBackend(values.role);
      if (beRole) payload.role = beRole;

      const initialIds = Array.isArray(kol?.categories)
        ? kol.categories.map((c) => c.id)
        : [];
      const newIds = Array.isArray(values.categories) ? values.categories : [];
      const toAdd = newIds.filter((id) => !initialIds.includes(id));
      const toRemove = initialIds.filter((id) => !newIds.includes(id));

      setSaving(true);

      await updateMyKolProfile(payload);
      await Promise.all([
        toAdd.length ? addKolCategories(toAdd) : Promise.resolve(),
        toRemove.length ? removeKolCategories(toRemove) : Promise.resolve(),
      ]);

      toast.success("Đã lưu thay đổi.");
      setEditing(false);
      await fetchKol();
    } catch (err) {
      if (!err?.errorFields) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Lưu thay đổi thất bại.");
      }
    } finally {
      setSaving(false);
    }
  };

  const markBeforeMediaMutate = () => {
    measureScrollEl();
    needRestoreRef.current = true;
  };

  // ===== Media actions =====
  const onDeleteMedia = async (usageId, fileId) => {
    markBeforeMediaMutate();
    setDeleting((p) => ({ ...p, [usageId]: true }));

    try {
      await deleteKolMedia(fileId);

      // Optimistic remove
      setKol((prev) =>
        prev
          ? {
              ...prev,
              fileUsageDtos: (prev.fileUsageDtos || []).filter(
                (u) => u?.file?.id !== fileId
              ),
            }
          : prev
      );

      needRestoreRef.current = true;
      await fetchKol();

      requestAnimationFrame(() => {
        scrollToMedia();
        setTimeout(scrollToMedia, 150);
      });
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Xoá media thất bại.");
      requestAnimationFrame(() => {
        scrollToMedia();
        setTimeout(scrollToMedia, 150);
      });
    } finally {
      setDeleting((p) => ({ ...p, [usageId]: false }));
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng ảnh.");
      return;
    }
    markBeforeMediaMutate();
    try {
      setUploadingImg(true);
      await uploadKolMedias(file, {
        fileType: "IMAGE",
        targetType: "PORTFOLIO",
      });
      await fetchKol();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Tải ảnh lên thất bại.");
      requestAnimationFrame(() => {
        scrollToMedia();
        setTimeout(scrollToMedia, 150);
      });
    } finally {
      setUploadingImg(false);
    }
  };

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn đúng định dạng video.");
      return;
    }
    markBeforeMediaMutate();
    try {
      setUploadingVid(true);
      await uploadKolMedias(file, {
        fileType: "VIDEO",
        targetType: "PORTFOLIO",
      });
      await fetchKol();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Tải video lên thất bại.");
      requestAnimationFrame(() => {
        scrollToMedia();
        setTimeout(scrollToMedia, 150);
      });
    } finally {
      setUploadingVid(false);
    }
  };

  const onChooseCover = async (fileId) => {
    markBeforeMediaMutate();
    try {
      setSettingCoverId(fileId);
      await setCoverImage(fileId);
      await fetchKol();
      toast.success("Đã đặt làm ảnh bìa.");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Đặt ảnh bìa thất bại.");
    } finally {
      setSettingCoverId(null);
    }
  };

  return (
    <div className="px-4 py-6" style={{ maxWidth: 1760, margin: "0 auto" }}>
      {/* Dùng Space để tạo khoảng cách đều giữa 3 Card */}
      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", display: "flex" }}
      >
        {/* ===== Thông tin cơ bản ===== */}
        <Card
          loading={loading}
          title={
            <Title level={4} className="!mb-0 font-bold">
              <div className="flex justify-between items-center py-2">
                <span>Thông tin cơ bản</span>
                <div className="flex items-center gap-2">
                  {!editing ? (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                      className="rounded-xl !h-10"
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Space>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={cancelEdit}
                        className="rounded-xl !h-10"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={onSave}
                        className="rounded-xl !h-10"
                      >
                        Lưu thay đổi
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </Title>
          }
          className="shadow-sm rounded-2xl"
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={16} xl={18}>
              <Form form={form} layout="vertical" disabled={!editing}>
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
                    {editing ? (
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
                                        new Error(
                                          "Bạn phải từ 18 tuổi trở lên."
                                        )
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
                    ) : (
                      <Form.Item label="Ngày sinh">
                        <Input className="!h-12" value={dobDisplay} disabled />
                      </Form.Item>
                    )}
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
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Chuyên mục"
                      name="categories"
                      rules={[
                        {
                          validator: (_, v) =>
                            Array.isArray(v) && v.length > 0
                              ? Promise.resolve()
                              : Promise.reject(
                                  new Error("Chọn ít nhất 1 chuyên mục")
                                ),
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
                  </Col>
                </Row>
              </Form>
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
                  Vị trí: {roleLabel(mapBackendToUi(kol?.role))}
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

        {/* ===== Giới thiệu ===== */}
        <Card
          title={
            <Title level={4} className="!mb-0">
              Giới thiệu
            </Title>
          }
          className="shadow-sm rounded-2xl"
          loading={loading}
          bodyStyle={{ padding: 20 }}
        >
          <Form form={form} layout="vertical" disabled={!editing}>
            <Form.Item
              label="Nội dung"
              name="bio"
              rules={[{ max: 1000, message: "Tối đa 1000 ký tự" }]}
            >
              <TextArea
                autoSize={{ minRows: 8 }}
                style={{
                  backgroundColor: editing ? "#fff" : "#fafafa",
                  fontSize: 15,
                }}
                placeholder="Mô tả bản thân, thế mạnh…"
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Form>
        </Card>

        {/* ===== Media ===== */}
        <div ref={mediaCardRef}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <Title level={4} className="!mb-0">
                  Media
                </Title>
                <Space>
                  {!mediaEditing ? (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setMediaEditing(true)}
                    >
                      Chỉnh sửa media
                    </Button>
                  ) : (
                    <Button
                      icon={<CheckOutlined />}
                      onClick={() => setMediaEditing(false)}
                    >
                      Xong
                    </Button>
                  )}
                  {mediaEditing && (
                    <>
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
                        loading={uploadingImg}
                      >
                        Thêm ảnh
                      </Button>
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => vidInputRef.current?.click()}
                        loading={uploadingVid}
                      >
                        Thêm video
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            }
            className="shadow-sm rounded-2xl"
            loading={loading}
            bodyStyle={{ padding: 20 }}
          >
            {/* ẢNH */}
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
                        src={`${img.file.fileUrl}${
                          img.file.fileUrl.includes("?") ? "&" : "?"
                        }v=${kol?.updatedAt || Date.now()}`}
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

                      {mediaEditing && (
                        <div className="!absolute !top-1 !right-1 z-20">
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
                      )}

                      {mediaEditing && !isCover && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                          <Button
                            type="primary"
                            disabled={!img.fileId}
                            icon={<StarOutlined />}
                            loading={settingCoverId === img.fileId}
                            onClick={() => onChooseCover(img.fileId)}
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

            {/* VIDEO */}
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

                    {mediaEditing && (
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
                    )}
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
        </div>
      </Space>

      {/* ==== Footer actions: chỉ lưu thông tin cá nhân ==== */}
      <Divider style={{ margin: "12px 0 0" }} />
      <div className="flex items-center justify-end">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={onSave}
          disabled={!editing}
          className="rounded-xl !h-10"
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
