// src/pages/admin/course/EditDetailCourse.jsx
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
  Button,
  Divider,
  Popconfirm,
  message,
} from "antd";
import {
  adminCourseUpdate,
  adminCourseMediasUpload,
  adminRemoveCourseMedias,
  adminCourseSetCoverImage,
} from "../../../services/admin/AdminAPI";
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeleteOutlined,
  StarOutlined,
  UploadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { ChevronLeft } from "lucide-react";
import { useGetDetailCourse } from "../../../hook/admin/course/useGetDetailCourse";

const { TextArea } = Input;
const { Title, Text } = Typography;

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ===== helpers cho ô Giá gốc =====
const toDigits = (s) => (s ?? "").toString().replace(/\D/g, ""); // giữ lại 0-9
const addDots = (digits) =>
  digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";

export default function EditDetailCourse() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    isLoadingGetDetailCourse,
    ResponseGetDetailCourse,
    refetchDetailCourse,
  } = useGetDetailCourse(id);

  const data = ResponseGetDetailCourse?.data;

  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [settingCoverUsageId, setSettingCoverUsageId] = useState(null);
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);

  // ===== initial values & dirty check =====
  const initialValuesRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    const iv = {
      name: data?.name || "",
      // Hiển thị giá gốc có dấu chấm
      price:
        typeof data?.price === "number"
          ? addDots(String(Math.floor(data.price)))
          : data?.price != null
          ? addDots(toDigits(String(data.price)))
          : undefined,
      discount:
        typeof data?.discount === "number"
          ? data.discount
          : data?.discount ?? undefined,
      isAvailable: !!data?.isAvailable,
      description: data?.description || "",
    };
    initialValuesRef.current = iv;
    form.setFieldsValue(iv);
    setIsDirty(false);
  }, [data, form]);

  const handleValuesChange = () => {
    const cur = form.getFieldsValue(true);
    setIsDirty(!deepEqual(cur, initialValuesRef.current || {}));
  };

  // ===== Watch fields to compute final price (read-only) =====
  const priceWatch = Form.useWatch("price", form);
  const discountWatch = Form.useWatch("discount", form);
  const finalPriceDisplay = useMemo(() => {
    const p = Number(toDigits(priceWatch)); // đọc số từ chuỗi có dấu chấm
    const d = Number(discountWatch);
    if (!Number.isFinite(p) || p <= 0) return "";
    const rate = Number.isFinite(d) ? Math.min(Math.max(d, 0), 100) : 0;
    const val = Math.round(p * (1 - rate / 100));
    return val.toLocaleString("vi-VN");
  }, [priceWatch, discountWatch]);

  // ===== Media derive (Ảnh / Video) =====
  const images = useMemo(() => {
    const list = Array.isArray(data?.fileUsageDtos) ? data.fileUsageDtos : [];
    return list
      .filter(
        (u) =>
          u?.isActive !== false &&
          u?.file?.fileType?.toUpperCase() === "IMAGE" &&
          u?.file?.status !== "DELETED" &&
          !!u?.file?.fileUrl
      )
      .map((u) => ({
        usageId: u.id, // quan trọng: usageId
        fileId: u?.file?.id || null,
        isCover: !!u?.isCover,
        file: {
          fileName: u?.file?.fileName,
          fileUrl: u?.file?.fileUrl,
        },
      }));
  }, [data]);

  const videos = useMemo(() => {
    const list = Array.isArray(data?.fileUsageDtos) ? data.fileUsageDtos : [];
    return list
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
        file: {
          fileName: u?.file?.fileName,
          fileUrl: u?.file?.fileUrl,
        },
      }));
  }, [data]);

  const currentCoverUsageId = useMemo(() => {
    const u = (data?.fileUsageDtos || []).find((x) => x?.isCover);
    return u?.id || null; // so theo usageId
  }, [data]);

  // ===== Hiển thị thông tin ở sidebar =====
  const basePriceNum =
    typeof data?.price === "number"
      ? data.price
      : data?.price != null
      ? Number(data.price)
      : NaN;
  const discountNum =
    typeof data?.discount === "number"
      ? data.discount
      : data?.discount != null
      ? Number(data.discount)
      : NaN;
  const afterDiscountNum =
    Number.isFinite(basePriceNum) && Number.isFinite(discountNum)
      ? Math.round(
          basePriceNum * (1 - Math.min(Math.max(discountNum, 0), 100) / 100)
        )
      : null;

  const priceVND =
    Number.isFinite(basePriceNum) && basePriceNum >= 0
      ? basePriceNum.toLocaleString("vi-VN")
      : "—";
  const afterVND =
    Number.isFinite(afterDiscountNum) && afterDiscountNum >= 0
      ? afterDiscountNum.toLocaleString("vi-VN")
      : "—";

  // ===== Actions =====
  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await adminCourseUpdate(id, {
        name: values.name?.trim(),
        price:
          values.price == null || String(values.price).trim() === ""
            ? null
            : Number(toDigits(values.price)), // parse "1.500.000" -> 1500000
        discount:
          values.discount === undefined || values.discount === null
            ? null
            : Number(values.discount),
        isAvailable: !!values.isAvailable,
        description: values.description?.trim(),
      });
      message.success("Đã lưu thay đổi khoá học.");
      await refetchDetailCourse();
    } catch (e) {
      if (!e?.errorFields) {
        console.error(e);
        message.error(e?.response?.data?.message || "Lưu thay đổi thất bại.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return message.error("Vui lòng chọn đúng định dạng ảnh.");
    try {
      setUploadingImg(true);
      await adminCourseMediasUpload(id, file, { fileType: "IMAGE" });
      message.success("Đã tải ảnh lên.");
      await refetchDetailCourse();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Tải ảnh thất bại.");
    } finally {
      setUploadingImg(false);
    }
  };

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/"))
      return message.error("Vui lòng chọn đúng định dạng video.");
    try {
      setUploadingVid(true);
      await adminCourseMediasUpload(id, file, { fileType: "VIDEO" });
      message.success("Đã tải video lên.");
      await refetchDetailCourse();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Tải video thất bại.");
    } finally {
      setUploadingVid(false);
    }
  };

  const onDeleteMedia = async (usageId) => {
    setDeleting((p) => ({ ...p, [usageId]: true }));
    try {
      await adminRemoveCourseMedias(id, [usageId]); // PUT + query fileUsageIds
      message.success("Đã xoá media.");
      await refetchDetailCourse();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xoá media thất bại.");
    } finally {
      setDeleting((p) => ({ ...p, [usageId]: false }));
    }
  };

  const onSetCover = async (fileId) => {
    try {
      setSettingCoverUsageId(fileId); // chỉ để hiển thị loading, có thể tách state riêng nếu muốn
      await adminCourseSetCoverImage(id, fileId); // gửi đúng fileId
      message.success("Đã đặt ảnh bìa.");
      await refetchDetailCourse();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Đặt ảnh bìa thất bại.");
    } finally {
      setSettingCoverUsageId(null);
    }
  };

  const handleBack = () => {
    navigate("/admin/management-course"); // reload list
  };

  return (
    <div className="px-4 py-6 space-y-6 flex flex-col gap-5">
      {/* ===== Thông tin cơ bản ===== */}
      <Card
        loading={isLoadingGetDetailCourse}
        title={
          <Title level={4} className="font-bold !mb-0">
            <div className="flex justify-between items-center py-2">
              <span>Chỉnh sửa khoá học</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBack}
                  className="rounded-xl !h-10 !flex !items-center"
                >
                  <ChevronLeft size={18} /> Quay lại
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  className="rounded-xl !h-10"
                  disabled={!isDirty || saving}
                  loading={saving}
                  onClick={onSave}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </Title>
        }
        className="shadow-sm rounded-2xl"
        bodyStyle={{ paddingBottom: 16 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16} xl={18}>
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
            >
              <Form.Item
                label="Tên khóa học"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khóa học" },
                  { min: 2, max: 120, message: "Độ dài 2–120 ký tự" },
                ]}
              >
                <Input className="!h-12" placeholder="Tên khóa học" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  {/* GIÁ GỐC: Input thường + formatter + validator */}
                  <Form.Item
                    label="Giá gốc (VNĐ)"
                    name="price"
                    validateTrigger="onChange"
                    getValueFromEvent={(e) => {
                      const raw = e?.target?.value ?? "";
                      if (/[^0-9.]/.test(raw)) {
                        message.warning(
                          "Chỉ được nhập số (0–9). Ký tự khác sẽ bị bỏ."
                        );
                      }
                      const digits = toDigits(raw).slice(0, 9); // tối đa 9 chữ số
                      return addDots(digits); // hiển thị 1.234.567
                    }}
                    rules={[
                      {
                        validator: (_, v) => {
                          const digits = toDigits(v);
                          if (!digits) {
                            return Promise.reject(
                              new Error("Vui lòng nhập giá gốc")
                            );
                          }
                          const n = Number(digits);
                          if (!Number.isFinite(n)) {
                            return Promise.reject(
                              new Error("Giá gốc không hợp lệ")
                            );
                          }
                          if (n <= 10000) {
                            return Promise.reject(
                              new Error("Giá gốc phải > 10.000đ")
                            );
                          }
                          if (n >= 1000000000 || digits.length > 9) {
                            return Promise.reject(
                              new Error("Giá gốc phải < 1.000.000.000đ")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input className="!h-12" placeholder="VD: 1.500.000" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Giảm giá (%)"
                    name="discount"
                    validateTrigger="onChange"
                    getValueFromEvent={(e) => {
                      const raw = e?.target?.value ?? "";
                      // Cảnh báo nếu có ký tự không phải số
                      if (/[^0-9]/.test(raw)) {
                        message.warning(
                          "Chỉ được nhập số (0–100). Ký tự khác sẽ bị bỏ."
                        );
                      }
                      // Lọc giữ số, giới hạn 3 chữ số, và chặn > 100
                      const digits = (raw || "").replace(/\D/g, "").slice(0, 3);
                      if (digits === "") return ""; // cho phép để trống
                      const n = Math.min(Number(digits), 100);
                      return String(n);
                    }}
                    rules={[
                      {
                        validator: (_, v) => {
                          // Cho phép bỏ trống
                          if (
                            v === undefined ||
                            v === null ||
                            String(v).trim() === ""
                          ) {
                            return Promise.resolve();
                          }
                          // Phải là số nguyên 0..100
                          if (!/^\d+$/.test(String(v))) {
                            return Promise.reject(
                              new Error("Chỉ được nhập số 0–100")
                            );
                          }
                          const n = Number(v);
                          if (!Number.isInteger(n)) {
                            return Promise.reject(
                              new Error("Phải là số nguyên")
                            );
                          }
                          if (n < 0 || n > 100) {
                            return Promise.reject(
                              new Error("Giảm giá phải từ 0 đến 100")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      className="!h-12"
                      placeholder="VD: 10"
                      inputMode="numeric"
                      maxLength={3}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Read-only: Giá sau giảm (VNĐ) */}
              <Form.Item label="Giá sau giảm (VNĐ)">
                <Input
                  className="!h-12"
                  value={finalPriceDisplay}
                  disabled
                  readOnly
                />
              </Form.Item>

              <Form.Item label="Trạng thái" name="isAvailable">
                <Select
                  className="!h-12"
                  options={[
                    { value: true, label: "Có sẵn" },
                    { value: false, label: "Không hoạt động" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} md={8} xl={6}>
            <div className="border rounded-xl p-3 bg-gray-50 border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <Text strong>Thông tin khoá học</Text>
                <Tag color={data?.isAvailable ? "green" : "red"}>
                  {data?.isAvailable ? "Có sẵn" : "Không hoạt động"}
                </Tag>
              </div>
              <Text type="secondary" className="block mb-1">
                ID: {data?.id || "—"}
              </Text>
              <Text type="secondary" className="block">
                Media: {(data?.fileUsageDtos || []).length || 0} tệp
              </Text>
              <div className="mt-3 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500">Giá gốc</div>
                  <div className="font-semibold">{priceVND}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">% Giảm</div>
                  <div className="font-semibold">
                    {Number.isFinite(discountNum) ? `${discountNum}%` : "—"}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500">Sau giảm</div>
                  <div className="font-semibold">{afterVND}</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ===== Mô tả ===== */}
      <Card
        loading={isLoadingGetDetailCourse}
        title={
          <Title level={4} className="!mb-0">
            Mô tả khóa học
          </Title>
        }
        className="shadow-sm rounded-2xl"
        bodyStyle={{ padding: 20 }}
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item
            label="Nội dung"
            name="description"
            rules={[{ max: 3000, message: "Tối đa 3000 ký tự" }]}
          >
            <TextArea
              autoSize={{ minRows: 8 }}
              style={{ backgroundColor: "#fff", fontSize: 15 }}
              placeholder="Mô tả nội dung khoá học..."
              showCount
              maxLength={3000}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* ===== Media ===== */}
      <Card
        loading={isLoadingGetDetailCourse}
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">
              Media
            </Title>
            <div className="flex items-center gap-2">
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
                icon={<UploadOutlined />}
                onClick={() => imgInputRef.current?.click()}
                loading={uploadingImg}
              >
                Thêm ảnh
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => vidInputRef.current?.click()}
                loading={uploadingVid}
              >
                Thêm video
              </Button>
            </div>
          </div>
        }
        className="shadow-sm rounded-2xl"
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
              const isCover =
                img.usageId === currentCoverUsageId || img.isCover;
              return (
                <div
                  key={img.usageId}
                  className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white"
                  style={{ height: 140 }}
                >
                  <Image
                    src={img.file.fileUrl}
                    alt={img.file.fileName}
                    preview={{ mask: "Xem ảnh" }}
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

                  {/* Actions */}
                  <div className="!absolute !top-1 !right-1 z-20 flex gap-1">
                    {!isCover && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<StarOutlined />}
                        className="!bg-white !text-blue-600 hover:!bg-white"
                        onClick={() => onSetCover(img.fileId)}
                        loading={settingCoverUsageId === img.usageId}
                      />
                    )}
                    <Popconfirm
                      title="Xoá ảnh này?"
                      okText="Xoá"
                      cancelText="Huỷ"
                      onConfirm={() => onDeleteMedia(img.usageId)}
                    >
                      <Button
                        size="small"
                        danger
                        type="primary"
                        icon={<DeleteOutlined />}
                        loading={!!deleting[img.usageId]}
                      />
                    </Popconfirm>
                  </div>
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
                className="relative border border-gray-200 rounded-lg overflow-hidden bg-black"
                style={{ height: 160 }}
              >
                <video
                  src={v.file.fileUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  controls
                />
                <div className="!absolute !top-1 !right-1 z-20">
                  <Popconfirm
                    title="Xoá video này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => onDeleteMedia(v.usageId)}
                  >
                    <Button
                      size="small"
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={!!deleting[v.usageId]}
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
    </div>
  );
}
