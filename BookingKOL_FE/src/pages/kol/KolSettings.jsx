import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Typography,
  Space,
  Button,
  Avatar,
  Divider,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  LockOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

import {
  updateMyKolProfile,
  getKolProfileByUserId,
  uploadKolMedias,
} from "../../services/kol/KolAPI";
import { post } from "../../config/axios-config"; // /password/reset

const { Title, Text } = Typography;

/* ---------- Utils: nén/resize ảnh để giảm nguy cơ 413 ---------- */
async function downscaleImage(
  file,
  { maxW = 800, maxH = 800, quality = 0.85 } = {}
) {
  const src = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(src);
      res(i);
    };
    i.onerror = (err) => {
      URL.revokeObjectURL(src);
      rej(err);
    };
    i.src = src;
  });
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

/* ---------- Utils: chuẩn hoá response upload (lấy URL/ID) ---------- */
function extractUploadedRef(uploaded) {
  const d = uploaded?.data ?? uploaded;
  const first =
    (Array.isArray(d) && d[0]) || d?.files?.[0] || d?.file || d?.data?.[0] || d;

  const url =
    first?.url ||
    first?.publicUrl ||
    first?.location ||
    first?.path ||
    first?.file?.url;

  const id = first?.id || first?.fileId || first?.fid || first?.file?.id;

  return { url, id, raw: first };
}

/* ---------- Utils: resolve avatarUrl (id -> file.fileUrl) ---------- */
const resolveAvatarUrl = (kol) => {
  const raw = kol?.avatarUrl;
  const usages = Array.isArray(kol?.fileUsageDtos) ? kol.fileUsageDtos : [];

  if (raw && /^https?:\/\//i.test(raw)) return raw; // 1) đã là URL

  const byUsageId = raw ? usages.find((u) => u?.id === raw) : null;
  if (byUsageId?.file?.fileUrl) return byUsageId.file.fileUrl; // 2) fileUsageId

  const byFileId = raw ? usages.find((u) => u?.file?.id === raw) : null;
  if (byFileId?.file?.fileUrl) return byFileId.file.fileUrl; // 3) fileId

  const avatarUsage = usages.find(
    (u) => u?.targetType === "AVATAR" && u?.isActive && u?.file?.fileUrl
  );
  if (avatarUsage?.file?.fileUrl) return avatarUsage.file.fileUrl; // 4) AVATAR

  const cover = usages.find(
    (u) => u?.isCover && u?.isActive && u?.file?.fileUrl
  );
  if (cover?.file?.fileUrl) return cover.file.fileUrl; // 5) cover

  const firstImage = usages.find(
    (u) => u?.file?.fileType === "IMAGE" && u?.file?.fileUrl
  );
  if (firstImage?.file?.fileUrl) return firstImage.file.fileUrl; // 6) ảnh đầu

  return "";
};

export default function KolSettings() {
  const auth = useAuth?.() || {};
  const user = auth?.user || {};
  const userId = user?.id;

  const [loading, setLoading] = useState(false);

  // ====== Info (fullName / email / avatarUrl) ======
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [formInfo] = Form.useForm();

  const [avatarPreview, setAvatarPreview] = useState(""); // url http/https hoặc blob:
  const [avatarObjectUrl, setAvatarObjectUrl] = useState("");
  const avatarFileRef = useRef(
    /** @type {React.MutableRefObject<File|null>} */ null
  );

  // ====== Password reset (OTP 1 endpoint) ======
  const [editingPwd, setEditingPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [formPwd] = Form.useForm();
  const otpInputRef = useRef(null);

  const revokeObjectUrl = () => {
    if (avatarObjectUrl && avatarObjectUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarObjectUrl);
      } catch (err) {
        // ignore
      }
    }
    setAvatarObjectUrl("");
  };

  const fetchMe = async () => {
    setLoading(true);
    try {
      let avatarUrl = user?.avatarUrl || user?.avatar || "";
      let fullName = user?.fullName || user?.name || "";
      const email = user?.email || "";

      if (userId) {
        const kol = await getKolProfileByUserId(userId);
        const resolved = resolveAvatarUrl(kol);
        avatarUrl = resolved || kol?.avatarUrl || avatarUrl;
        if (kol?.fullName) fullName = kol.fullName;
      }

      formInfo.setFieldsValue({ fullName, email });
      revokeObjectUrl();
      setAvatarPreview(avatarUrl || "");
      avatarFileRef.current = null;

      auth?.dispatch?.({
        type: "UPDATE_PROFILE",
        payload: { fullName, avatar: avatarUrl },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return () => revokeObjectUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OTP countdown
  useEffect(() => {
    if (otpSeconds <= 0) return;
    const t = setInterval(() => {
      setOtpSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [otpSeconds]);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng ảnh.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (>20MB). Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    revokeObjectUrl();
    avatarFileRef.current = file;
    const objUrl = URL.createObjectURL(file);
    setAvatarObjectUrl(objUrl);
    setAvatarPreview(objUrl);
  };

  const openPicker = () =>
    document.getElementById("kol-settings-avatar-input")?.click();

  const onAvatarError = () => {
    setAvatarPreview(""); // để Avatar fallback sang initials
    return false; // yêu cầu của antd để dùng children làm fallback
  };

  const initials = () =>
    (formInfo.getFieldValue("fullName") || "K O L")
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const onSaveInfo = async () => {
    try {
      const values = await formInfo.validateFields(); // { fullName, email }
      const payload = { fullName: values.fullName?.trim() };

      setSavingInfo(true);

      // Nếu có file mới → upload multipart trước (có nén), lấy URL/ID
      if (avatarFileRef.current) {
        let fileToUpload = avatarFileRef.current;

        if (fileToUpload.size > 1024 * 1024) {
          try {
            fileToUpload = await downscaleImage(fileToUpload, {
              maxW: 800,
              maxH: 800,
              quality: 0.85,
            });
          } catch (err) {
            console.warn("Downscale ảnh thất bại, vẫn dùng file gốc.", err);
          }
        }

        const uploaded = await uploadKolMedias(fileToUpload, {
          fileType: "IMAGE",
          targetType: "AVATAR",
        });

        const { url, id } = extractUploadedRef(uploaded);
        if (url) {
          payload.avatarUrl = url; // tốt nhất: dùng URL
        } else if (id) {
          payload.avatarUrl = id; // BE chấp nhận id thì dùng id
        } else {
          throw new Error(
            "Upload OK nhưng không tìm thấy URL/ID trong response."
          );
        }
      }

      // PUT JSON nhỏ gọn /kol/profile/update
      await updateMyKolProfile(payload);

      toast.success("Đã lưu thay đổi.");
      setEditingInfo(false);
      await fetchMe();
    } catch (e) {
      if (!e?.errorFields) {
        const httpStatus = e?.response?.status;
        if (httpStatus === 413) {
          toast.error(
            "Upload bị 413 (quá lớn). Đã bật nén ảnh; nếu vẫn lỗi, hãy chọn ảnh nhỏ hơn."
          );
        } else if (httpStatus === 415) {
          toast.error(
            "BE không chấp nhận kiểu dữ liệu. Kiểm tra cấu hình upload hoặc header."
          );
        } else {
          console.error(e);
          toast.error(e?.response?.data?.message || "Lưu thay đổi thất bại.");
        }
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const onCancelInfo = () => {
    setEditingInfo(false);
    fetchMe();
  };

  // ====== CHỈ DÙNG /password/reset CHO CẢ HAI BƯỚC ======
  // Bấm "Gửi OTP": gửi kèm newPassword & confirmPassword để BE không bị null
  const sendPasswordOtp = async () => {
    try {
      const email = formInfo.getFieldValue("email");
      await formPwd.validateFields(["newPassword", "confirmPassword"]);
      const newPassword = formPwd.getFieldValue("newPassword");
      const confirmPassword = formPwd.getFieldValue("confirmPassword");
      if (!email) return toast.error("Thiếu email.");
      if (newPassword !== confirmPassword)
        return toast.error("Mật khẩu xác nhận không khớp.");

      setSendingOtp(true);

      await post({
        url: "v1/password/reset",
        data: {
          email,
          newPassword,
          confirmPassword,
          requestOtp: true, // gợi ý (BE có thể bỏ qua)
          phase: "SEND_OTP", // gợi ý (BE có thể bỏ qua)
          otp: "", // tránh BE trim/equals trên chuỗi null
        },
      });

      setOtpSent(true);
      setOtpSeconds(120);
      toast.success("Đã gửi OTP. Vui lòng kiểm tra email.");
      setTimeout(() => otpInputRef.current?.focus?.(), 0);
    } catch (e) {
      if (!e?.errorFields) {
        console.error(e);
        toast.error(
          e?.response?.data?.message || "Gửi OTP thất bại. Thử lại sau."
        );
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit đổi mật khẩu: cần { email, otp, newPassword, confirmPassword }
  const onSavePassword = async () => {
    try {
      const email = formInfo.getFieldValue("email");
      const { otp, newPassword, confirmPassword } =
        await formPwd.validateFields();
      if (!otpSent) return toast.error("Vui lòng bấm 'Gửi OTP' trước.");
      if (!email) return toast.error("Thiếu email.");
      if (newPassword !== confirmPassword)
        return toast.error("Mật khẩu xác nhận không khớp.");

      setChangingPwd(true);
      await post({
        url: "v1/password/reset",
        data: { email, otp, newPassword, confirmPassword },
      });
      toast.success("Đổi mật khẩu thành công.");
      setEditingPwd(false);
      setOtpSent(false);
      setOtpSeconds(0);
      formPwd.resetFields();
    } catch (e) {
      if (!e?.errorFields) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Đổi mật khẩu thất bại.");
      }
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div
      className="px-4 py-6 space-y-6"
      style={{ maxWidth: 960, margin: "0 auto" }}
    >
      {/* ===== Thông tin tài khoản ===== */}
      <Card
        loading={loading}
        title={
          <Title level={4} className="!mb-0 font-bold">
            <div className="flex justify-between items-center py-2">
              <span>Cài đặt tài khoản</span>
              <div className="flex items-center gap-2">
                {!editingInfo ? (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setEditingInfo(true)}
                    className="rounded-xl !h-10"
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Space>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={onCancelInfo}
                      className="rounded-xl !h-10"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingInfo}
                      onClick={onSaveInfo}
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
        bodyStyle={{ padding: 24, paddingBottom: 16 }}
      >
        {/* Avatar */}
        <div className="w-full flex flex-col items-center mb-4">
          <Avatar
            src={avatarPreview || undefined}
            size={128}
            onError={onAvatarError}
            style={{ border: "1px solid #e5e7eb" }}
          >
            {(formInfo.getFieldValue("fullName") || "K O L")
              .split(/\s+/)
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Avatar>
        </div>
        <div className="w-full flex justify-center">
          <input
            id="kol-settings-avatar-input"
            type="file"
            accept="image/*"
            hidden
            onChange={onPickAvatar}
          />
          {editingInfo ? (
            <Button
              icon={<UploadOutlined />}
              onClick={openPicker}
              className="rounded-xl mt-3"
            >
              Chọn ảnh từ máy
            </Button>
          ) : (
            <Text type="secondary" className="mt-3">
              Ảnh đại diện
            </Text>
          )}
        </div>

        {/* Họ & tên + Email (chia đều 50/50) */}
        <Form
          form={formInfo}
          layout="vertical"
          disabled={!editingInfo}
          className="w-full"
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12} flex="1 1 0%">
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[
                  { required: true, message: "Vui lòng nhập họ và tên" },
                  { min: 2, max: 60, message: "Độ dài 2–60 ký tự" },
                ]}
              >
                <Input placeholder="Họ và tên" className="!h-12" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} flex="1 1 0%">
              <Form.Item label="Email" name="email">
                <Input disabled className="!h-12" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ===== Đổi mật khẩu (Gửi OTP trước, rồi submit) ===== */}
      <Card
        title={
          <Title level={4} className="!mb-0 font-bold">
            <div className="flex justify-between items-center py-2">
              <span>Đổi mật khẩu</span>
              <div className="flex items-center gap-2">
                {!editingPwd ? (
                  <Button
                    icon={<LockOutlined />}
                    onClick={() => {
                      setEditingPwd(true);
                      setOtpSent(false);
                      setOtpSeconds(0);
                      formPwd.resetFields();
                      formPwd.setFieldsValue({
                        email: formInfo.getFieldValue("email"),
                      });
                    }}
                    className="rounded-xl !h-10"
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Space wrap>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setEditingPwd(false);
                        setOtpSent(false);
                        setOtpSeconds(0);
                        formPwd.resetFields();
                      }}
                      className="rounded-xl !h-10"
                    >
                      Hủy
                    </Button>
                    <Button
                      icon={<SendOutlined />}
                      type="default"
                      loading={sendingOtp}
                      disabled={sendingOtp || otpSeconds > 0}
                      onClick={sendPasswordOtp}
                      className="rounded-xl !h-10"
                    >
                      {otpSeconds > 0
                        ? `Gửi lại OTP (${otpSeconds}s)`
                        : "Gửi OTP"}
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={changingPwd}
                      onClick={onSavePassword}
                      className="rounded-xl !h-10"
                      disabled={!otpSent}
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
        bodyStyle={{ padding: 24, paddingBottom: 16 }}
      >
        {!editingPwd ? (
          <div className="text-gray-500">**********</div>
        ) : (
          <Form form={formPwd} layout="vertical" className="max-w-2xl">
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: "Nhập email" }]}
                >
                  <Input className="!h-12" disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Mã OTP"
                  name="otp"
                  rules={[{ required: true, message: "Nhập mã OTP" }]}
                >
                  <Input
                    ref={otpInputRef}
                    className="!h-12"
                    placeholder="Nhập mã OTP đã nhận"
                    disabled={!otpSent}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Nhập mật khẩu mới" },
                    { min: 8, message: "Tối thiểu 8 ký tự" },
                  ]}
                >
                  <Input.Password
                    className="!h-12"
                    placeholder="Mật khẩu mới"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Nhập lại mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, v) {
                        if (!v || getFieldValue("newPassword") === v)
                          return Promise.resolve();
                        return Promise.reject(
                          new Error("Không khớp mật khẩu.")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    className="!h-12"
                    placeholder="Nhập lại mật khẩu"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      <Divider style={{ margin: 0 }} />
    </div>
  );
}
