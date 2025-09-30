import { useState } from "react";
import "./userProfile.css";
import avt from "../../../assets/prf.jpg";

/* ==== MUI DatePicker ==== */
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function UserProfile() {
  const [editing, setEditing] = useState(false);

  // Demo state – sau này bind API/user context
  const [form, setForm] = useState({
    fullName: "",
    brandName: "",
    ngaySinh: null, // dùng dayjs object để tương thích DatePicker
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
    // Khi submit, nếu cần gửi về BE dạng ISO:
    // const payload = {
    //   ...form,
    //   ngaySinh: form.ngaySinh ? form.ngaySinh.toDate().toISOString().slice(0, 10) : null, // "YYYY-MM-DD"
    // };
    setEditing(false);
    alert("UI-only: Đã lưu hồ sơ!");
  };

  return (
    <div className="upf-wrap">
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

            {/* 2) Tên brand */}
            <div className="upf-field">
              <label>Tên brand</label>
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

            {/* 7) Ngày sinh (MUI DatePicker, đồng bộ style với input thường) */}
            <div className="upf-field">
              <label>Ngày sinh</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={form.ngaySinh}
                  onChange={(newValue) =>
                    setForm((s) => ({ ...s, ngaySinh: newValue }))
                  }
                  format="DD/MM/YYYY"
                  // Gợi ý: khoá tương tác khi chưa bật "Sửa" nhưng vẫn nền trắng

                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      placeholder: "dd/mm/yyyy",
                      // ĐỒNG BỘ STYLE TẠI ĐÂY
                      sx: {
                        // Root ô nhập (OutlinedInput)
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff", // nền trắng như các input khác
                        },
                        // Viền mặc định / hover / focus
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--border, #e2e8f0)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                          {
                            borderColor: "#10b981",
                            boxShadow: "0 0 0 3px rgba(16,185,129,0.30)",
                          },
                        // Chữ bên trong ô
                        "& .MuiOutlinedInput-input": {
                          padding: "10px 14px",
                          fontSize: "14.5px",
                          fontFamily:
                            "Montserrat, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                          color: "var(--text, #0f172a)",
                        },
                        "& .MuiOutlinedInput-input::placeholder": {
                          color: "#94a3b8",
                          opacity: 1,
                        },
                        // Trạng thái disabled (trường hợp bạn vẫn dùng disabled)
                        "& .MuiOutlinedInput-root.Mui-disabled": {
                          backgroundColor: "#fff", // vẫn trắng
                        },
                        "& .MuiOutlinedInput-input.Mui-disabled": {
                          WebkitTextFillColor: "var(--muted, #ffffffff)",
                        },
                        // Icon lịch
                        "& .MuiSvgIcon-root": { opacity: 0.85 },
                      },
                      // Khi chưa bật "Sửa": chỉ đọc, nhìn vẫn trắng
                      inputProps: { readOnly: !editing },
                    },
                  }}
                />
              </LocalizationProvider>
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
