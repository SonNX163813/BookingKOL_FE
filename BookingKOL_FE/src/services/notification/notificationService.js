import { get, post, remove } from "../../config/axios-config";

const STORAGE_KEY = "auth_user";

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readAccountFromStorage = () => {
  if (typeof window === "undefined") return null;
  return (
    safeParse(localStorage.getItem(STORAGE_KEY)) ||
    safeParse(sessionStorage.getItem(STORAGE_KEY)) ||
    null
  );
};

const extractUserId = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.userId) return payload.userId;
  if (payload.id) return payload.id;
  if (payload.user?.id) return payload.user.id;
  if (payload.user?.userId) return payload.user.userId;
  return null;
};

const extractRoles = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.roles)) return payload.roles;
  if (typeof payload.role === "string") return [payload.role];
  if (Array.isArray(payload.user?.roles)) return payload.user.roles;
  if (typeof payload.user?.role === "string") return [payload.user.role];
  return [];
};

const normalizeIdentity = () => {
  const account = readAccountFromStorage();
  const roles = extractRoles(account);
  const role = roles.length ? String(roles[0]).trim() : null;
  const userId = extractUserId(account);

  if (!role || !userId) return null;
  return { role, userId };
};

// Notification bell calls poll frequently; keep them silent to avoid noisy toasts
const notificationRequestConfig = {
  skipToast: true,
  skipSuccessToast: true,
  skipErrorToast: true,
  skipAuthErrorToast: true,
  silent: true,
};

export const fetchNotifications = async () => {
  const identity = normalizeIdentity();
  if (!identity) {
    throw new Error("Missing user identity in storage");
  }

  const { role, userId } = identity;
  const response = await get({
    url: `/v1/notification/${encodeURIComponent(role)}/${encodeURIComponent(
      userId
    )}`,
    config: notificationRequestConfig,
  });
  return response?.data ?? response ?? [];
};

export const markAllNotificationsAsRead = async () => {
  const identity = normalizeIdentity();
  if (!identity) {
    throw new Error("Missing user identity in storage");
  }

  const { role, userId } = identity;
  return post({
    url: `/v1/notification/${encodeURIComponent(role)}/${encodeURIComponent(
      userId
    )}/markAllAsReaded`,
    data: {},
    config: notificationRequestConfig,
  });
};

export const deleteAllNotifications = async () => {
  const identity = normalizeIdentity();
  if (!identity) {
    throw new Error("Missing user identity in storage");
  }

  const { role, userId } = identity;
  return remove({
    url: `/v1/notification/delete/${encodeURIComponent(
      role
    )}/${encodeURIComponent(userId)}`,
    config: notificationRequestConfig,
  });
};

export const getNotificationIdentity = normalizeIdentity;
