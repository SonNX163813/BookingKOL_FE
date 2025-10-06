import { useState, useEffect } from "react";
import "./userProfile.css";
import avt from "../../../assets/prf.jpg";
import dayjs from "dayjs";
import { DatePicker as AntDatePicker } from "antd";

export default function UserProfile() {
  const [editing, setEditing] = useState(false);

  // Ảnh đại diện (preview)
  const [avatarUrl, setAvatarUrl] = useState(avt);
  useEffect(() => {
    // cleanup objectURL khi unmount (nếu có)
    return () => {
      if (avatarUrl && avatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  // Demo state – sau này bind API/user context
  const [form, setForm] = useState({
    fullName: "",
    brandName: "",
    ngaySinh: "", // input[type="date"] — "YYYY-MM-DD"
    gender: "",
    country: "",
    soDienThoai: "",
    email: "",
    bio: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onToggleEdit = () => setEditing((v) => !v);

  const onSubmit = (e) => {
    e.preventDefault();
    // const payload = { ...form, ngaySinh: form.ngaySinh || null };
    // await fetch(...)
    setEditing(false);
    alert("UI-only: Đã lưu hồ sơ!");
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  // Chọn ảnh đại diện
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    // thu hồi URL cũ nếu là blob
    if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(nextUrl);
    // TODO: nếu cần upload lên BE, bạn có thể lưu file vào state khác hoặc call API ở đây
  };

  return (
    <div className="upf-wrap">
      <div className="upf-card">
        {/* Hàng trên: avatar + tên/email + nút */}
        <div className="upf-top">
          <div className="upf-avatar">
            <img src={avatarUrl} alt="Ảnh đại diện" className="avatar" />

            {editing && (
              <>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  hidden
                />
                <label
                  className="upf-avatar-overlay"
                  htmlFor="avatarUpload"
                  title="Tải ảnh đại diện"
                  role="button"
                  aria-label="Tải ảnh đại diện"
                >
                  {/* Icon upload (SVG inline) */}
                  <svg
                    className="upf-upload-icon"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 16V8m0 0l-3 3m3-3l3 3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 16.5v1a3.5 3.5 0 01-3.5 3.5h-9A3.5 3.5 0 014 17.5v-1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="upf-upload-text">Upload</span>
                </label>
              </>
            )}
          </div>

          <div className="upf-identity">
            <h2 className="upf-name">{form.fullName || "Họ và tên"}</h2>
            <p className="upf-mail">{form.email}</p>
          </div>

          <div className="upf-actions">
            <button
              type="button"
              className={`upf-btn ${
                editing ? "upf-btn--gray" : "upf-btn--primary"
              }`}
              onClick={onToggleEdit}
              aria-pressed={editing}
            >
              {editing ? "Hủy" : "Sửa"}
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="upf-form" onSubmit={onSubmit}>
          <div className="upf-grid">
            {/* 1) Họ và tên */}
            <div className="upf-field">
              <label>Họ và tên</label>
              <input
                name="fullName"
                placeholder="Nhập họ và tên"
                value={form.fullName}
                onChange={onChange}
                disabled={!editing}
              />
            </div>
            {/* 2) Tên brand */}
            <div className="upf-field">
              <label>Tên công ty</label>
              <input
                name="brandName"
                placeholder=""
                value={form.brandName}
                onChange={onChange}
                disabled={!editing}
              />
            </div>
            {/* 3) Gmail */}
            <div className="upf-field">
              <label>Gmail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                readOnly
              />
            </div>
            {/* 4) Giới tính */}
            <div className="upf-field">
              <label>Giới tính</label>
              <div className="upf-input-wrap">
                <select
                  className="upf-select"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  disabled={!editing}
                >
                  <option value="">Chọn…</option>
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            {/* 5) Quốc gia */}
            <div className="upf-field">
              <label>Quốc gia</label>
              <input
                name="country"
                placeholder="Nhập quốc gia"
                value={form.country}
                onChange={onChange}
                disabled={!editing}
              />
            </div>
            {/* 6) Số điện thoại */}
            <div className="upf-field">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="soDienThoai"
                placeholder="Nhập số điện thoại"
                value={form.soDienThoai}
                onChange={onChange}
                disabled={!editing}
              />
            </div>
            {/* 7) Ngày sinh */}
            <div className="upf-field">
              <label>Ngày sinh</label>
              <AntDatePicker
                className="upf-antd-date"
                format="DD/MM/YYYY"
                placeholder="dd/mm/yyyy"
                value={
                  form.ngaySinh ? dayjs(form.ngaySinh, "YYYY-MM-DD") : null
                }
                disabled={!editing}
                disabledDate={(current) =>
                  (current && current > dayjs()) ||
                  (current && current < dayjs("1900-01-01"))
                }
                onChange={(d) =>
                  setForm((s) => ({
                    ...s,
                    ngaySinh: d ? d.toDate().toISOString().slice(0, 10) : "",
                  }))
                }
                allowClear
              />
            </div>
          </div>

          {/* Phần cuối: Giới thiệu */}
          <div className="upf-section">
            <h3>Giới thiệu</h3>
            <textarea
              name="bio"
              rows={4}
              placeholder="Giới thiệu ngắn về bản thân…"
              value={form.bio}
              onChange={onChange}
              disabled={!editing}
            />
          </div>

          {editing && (
            <div className="upf-actions-save">
              <button className="upf-btn upf-btn--primary" type="submit">
                Lưu thay đổi
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
