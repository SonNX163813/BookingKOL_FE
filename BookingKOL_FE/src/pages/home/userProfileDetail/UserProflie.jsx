import { useState } from "react";
import "./userProfile.css";
import avt from "../../../assets/prf.jpg";

export default function UserProfile() {
  const [editing, setEditing] = useState(false);

  // Demo state – sau này bind API/user context
  const [form, setForm] = useState({
    fullName: "",
    ngaySinh: "", // Ngày sinh (sẽ bị đẩy xuống cuối grid)
    gender: "",
    country: "",
    soDienThoai: "",

    email: "", // dùng làm Gmail (readonly trong form)
    bio: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onToggleEdit = () => setEditing((v) => !v);

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: call API cập nhật hồ sơ
    setEditing(false);
    alert("UI-only: Đã lưu hồ sơ!");
  };

  return (
    <div className="upf-wrap">
      {/* header gradient */}

      <div className="upf-card">
        {/* hàng trên: avatar + tên/email + nút */}
        <div className="upf-top">
          <div className="upf-avatar">
            <img src={avt} alt="Ảnh đại diện" className="avatar" />
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

        {/* form */}
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

            {/* 2) Gmail (thay cho Múi giờ, đưa lên vị trí của Ngày sinh) */}
            <div className="upf-field">
              <label>Gmail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled={true} // luôn không chỉnh được trong form
                readOnly
              />
            </div>

            {/* 3) Giới tính */}
            <div className="upf-field">
              <label>Giới tính</label>
              <select
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

            {/* 4) Quốc gia */}
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

            {/* 5) Số điện thoại */}
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

            {/* 6) Ngày sinh (đưa xuống vị trí cuối – chỗ cũ của Múi giờ) */}
            <div className="upf-field">
              <label>Ngày sinh</label>
              <input
                type="date"
                name="ngaySinh"
                placeholder="Chọn ngày sinh"
                value={form.ngaySinh}
                onChange={onChange}
                disabled={!editing}
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
