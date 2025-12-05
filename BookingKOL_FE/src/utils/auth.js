// src/utils/auth.js
// Helpers cho lưu/đọc/xoá auth vào đúng storage theo "remember"

export function saveAuth({ token, user, remember }) {
  const store = remember ? sessionStorage : localStorage;
  const other = remember ? sessionStorage : localStorage;

  store.setItem("auth_token", token);
  store.setItem("auth_user", JSON.stringify(user));

  // dọn kho còn lại để tránh lệch trạng thái
  other.removeItem("auth_token");
  other.removeItem("auth_user");
}

export function loadAuth() {
  // Ưu tiên localStorage (Remember me), nếu không có thì đọc sessionStorage
  const pick = (s) => {
    const token = s.getItem("auth_token");
    const userStr = s.getItem("auth_user");
    return token ? { token, user: userStr ? JSON.parse(userStr) : null } : null;
  };
  return (
    pick(localStorage) || pick(sessionStorage) || { token: null, user: null }
  );
}

export function clearAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
}

export function eraseAllCookies() {
  if (typeof document === "undefined") return;
  document.cookie.split(";").forEach((c) => {
    const eq = c.indexOf("=");
    const name = (eq > -1 ? c.slice(0, eq) : c).trim();
    if (!name) return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}
