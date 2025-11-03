// src/pages/kol/KolSettings.jsx
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
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

import {
  updateMyKolProfile,
  getKolProfileByUserId,
  resetPasswordWithOtp,
  resolveAvatarUrl,
  changeKolAvatarNew, // ✅ /v1/kol/avatar/change/new-image
} from "../../services/kol/KolAPI";

const { Title, Text } = Typography;

export default function KolSettings() {
  const auth = useAuth?.() || {};
  const user = auth?.user || {};
  const userId = user?.id;

  const [loading, setLoading] = useState(false);

  // ====== Info (fullName / email / avatar) ======
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [formInfo] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarFileRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [uploadPct, setUploadPct] = useState(0);

  // ====== Password reset (OTP) ======
  const [editingPwd, setEditingPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [formPwd] = Form.useForm();

  // cleanup object URL khi unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const fetchMe = async () => {
    setLoading(true);
    try {
      let fullName = user?.fullName || user?.name || "";
      let email = user?.email || "";
      let avatarUrl = user?.avatarUrl || user?.avatar || "";

      if (userId) {
        const kol = await getKolProfileByUserId(userId);
        if (kol) {
          fullName = kol.fullName || fullName;
          // dùng resolver để hiện đúng ảnh dù avatarUrl là URL/usageId/fileId
          const resolved = resolveAvatarUrl(kol);
          avatarUrl = resolved || avatarUrl;
        }
      }

      formInfo.setFieldsValue({ fullName, email });
      setAvatarPreview(avatarUrl || "");

      // reset tạm
      avatarFileRef.current = null;
      setUploadPct(0);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
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

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (>5MB). Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    avatarFileRef.current = file;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setAvatarPreview(url);
  };

  const openPicker = () =>
    document.getElementById("kol-settings-avatar-input")?.click();

  const onSaveInfo = async () => {
    try {
      const values = await formInfo.validateFields(); // { fullName, email }
      const payload = { fullName: values.fullName?.trim() };

      setSavingInfo(true);

      // 1) Nếu có file avatar mới → gọi API đổi avatar
      if (avatarFileRef.current) {
        await changeKolAvatarNew(avatarFileRef.current, {
          onUploadProgress: (e) => {
            if (!e?.total) return;
            setUploadPct(Math.round((e.loaded * 100) / e.total));
          },
        });
      }

      // 2) Cập nhật các field text
      await updateMyKolProfile(payload);

      toast.success("Đã lưu thay đổi.");
      setEditingInfo(false);

      // dọn state
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      avatarFileRef.current = null;
      setUploadPct(0);

      await fetchMe();

      // cập nhật nhẹ local auth store
      auth?.dispatch?.({
        type: "UPDATE_PROFILE",
        payload: { fullName: payload.fullName },
      });
    } catch (e) {
      if (!e?.errorFields) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Lưu thay đổi thất bại.");
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const onCancelInfo = () => {
    setEditingInfo(false);
    fetchMe();
  };

  const onSavePassword = async () => {
    try {
      const { email, otp, newPassword, confirmPassword } =
        await formPwd.validateFields();
      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp.");
        return;
      }
      setChangingPwd(true);
      await resetPasswordWithOtp({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success("Đổi mật khẩu thành công.");
      setEditingPwd(false);
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
      className="px-4 md:px-6 py-6"
      style={{ maxWidth: 960, margin: "0 auto" }}
    >
      {/* === TÁCH CARD GIỐNG KolProfile: dùng Space vertical size=24 === */}
      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", display: "flex" }}
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
          headStyle={{ padding: "16px 24px" }}
          bodyStyle={{ padding: 24 }} // padding trong card để không bị “dính”
        >
          {/* Avatar giữa trên cùng */}
          <div className="w-full flex flex-col items-center mb-4">
            <Avatar
              src={avatarPreview}
              size={128}
              style={{ border: "1px solid #e5e7eb" }}
            />
            <input
              id="kol-settings-avatar-input"
              type="file"
              accept="image/*"
              hidden
              onChange={onPickAvatar}
            />
            {editingInfo ? (
              <div className="flex flex-col items-center">
                <Button
                  icon={<UploadOutlined />}
                  onClick={openPicker}
                  className="rounded-xl mt-3"
                >
                  Chọn ảnh từ máy
                </Button>
                {savingInfo && uploadPct > 0 && uploadPct < 100 && (
                  <div className="text-sm text-gray-500 mt-2">
                    Đang tải ảnh… {uploadPct}%
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary" className="mt-3">
                Ảnh đại diện
              </Text>
            )}
          </div>

          {/* Họ & Tên + Email: cân đối, padding trái/phải đều nhau */}
          <Form
            form={formInfo}
            layout="vertical"
            disabled={!editingInfo}
            className="w-full" // ❌ bỏ max-w-3xl, mx-auto, px-*
          >
            <Row gutter={24}>
              {" "}
              {/* ❌ bỏ justify / style marginLeft=0 */}
              <Col xs={24} md={12}>
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
              <Col xs={24} md={12}>
                <Form.Item label="Email" name="email">
                  <Input disabled className="!h-12" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* ===== Đổi mật khẩu (OTP) ===== */}
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
                        formPwd.setFieldsValue({
                          email: formInfo.getFieldValue("email"),
                        });
                      }}
                      className="rounded-xl !h-10"
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Space>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setEditingPwd(false);
                          formPwd.resetFields();
                        }}
                        className="rounded-xl !h-10"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={changingPwd}
                        onClick={onSavePassword}
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
          headStyle={{ padding: "16px 24px" }}
          bodyStyle={{ padding: 24 }} // đồng bộ padding với card trên
        >
          {!editingPwd ? (
            <div className="text-gray-500">**********</div>
          ) : (
            <Form
              form={formPwd}
              layout="vertical"
              className="w-full" // ❌ bỏ max-w-2xl, mx-auto, px-*
            >
              <Row gutter={24}>
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
                      className="!h-12"
                      placeholder="Nhập mã OTP đã nhận"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
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
      </Space>

      {/* Ngăn cách nhẹ cuối trang (tuỳ chọn) */}
      <Divider style={{ margin: 0 }} />
    </div>
  );
}
