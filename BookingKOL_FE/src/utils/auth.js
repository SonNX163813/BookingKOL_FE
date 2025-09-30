// src/utils/auth.js
// Helpers cho lưu/đọc/xoá auth vào đúng storage theo "remember"

export function saveAuth({ token, user, remember }) {
  const store = remember ? localStorage : sessionStorage;
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

export function isTokenExpired(jwt) {
  try {
    const [, payload] = jwt.split(".");
    const { exp } = JSON.parse(atob(payload));
    return exp ? Date.now() / 1000 >= exp : false;
  } catch {
    return false;
  }
}
