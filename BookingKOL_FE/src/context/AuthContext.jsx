/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { clearAuth } from "../utils/auth";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}

function getJwtTimesMs(payload) {
  if (!payload || typeof payload !== "object")
    return { iatMs: null, expMs: null };
  const iat = Number(payload.iat);
  const exp = Number(payload.exp);
  return {
    iatMs: Number.isFinite(iat) ? iat * 1000 : null,
    expMs: Number.isFinite(exp) ? exp * 1000 : null,
  };
}

function loadAuthFromStorage() {
  const read = (store) => {
    const token = store.getItem("auth_token");
    const userStr = store.getItem("auth_user");
    if (!token) return null;
    try {
      return { token, user: userStr ? JSON.parse(userStr) : null };
    } catch {
      return { token, user: null };
    }
  };

  const checkExpired = (token) => {
    const { expMs } = getJwtTimesMs(decodeJwtPayload(token));
    return Boolean(expMs && Date.now() >= expMs);
  };

  // Primary source: sessionStorage
  const sessionData = read(sessionStorage);
  if (sessionData) {
    if (checkExpired(sessionData.token)) {
      try {
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
      } catch {
        // ignore storage errors
      }
      return { token: null, user: null, expired: true };
    }
    return sessionData;
  }

  // Migrate any legacy localStorage data into sessionStorage once, then clear localStorage
  const legacyLocal = read(localStorage);
  if (legacyLocal) {
    if (checkExpired(legacyLocal.token)) {
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      } catch {
        // ignore storage errors
      }
      return { token: null, user: null, expired: true };
    }

    try {
      sessionStorage.setItem("auth_token", legacyLocal.token);
      sessionStorage.setItem("auth_user", JSON.stringify(legacyLocal.user));
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {
      // ignore storage errors
    }
    return legacyLocal;
  }

  return { token: null, user: null };
}

const boot = loadAuthFromStorage();

const initialState = {
  user: boot.user,
  token: boot.token,
  roles: boot.user?.roles || [],
  remember: false, // always use sessionStorage
  loading: false,
  error: null,
  bootExpired: Boolean(boot?.expired),
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS": {
      const { user, token, roles = [], remember = false } = action.payload;
      return {
        ...state,
        user,
        token,
        roles,
        remember,
        loading: false,
        error: null,
        bootExpired: false,
      };
    }

    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload || "Đăng nhập thất bại",
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        roles: [],
        loading: false,
        error: null,
        remember: false,
        bootExpired: false,
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const expiryTimeoutRef = useRef(null);
  const bootToastShownRef = useRef(false);

  const clearStorage = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_user");
    } catch {
      // ignore
    }
  };

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  }, []);

  const logoutDueToExpiry = useCallback(() => {
    clearExpiryTimer();
    clearAuth();
    dispatch({ type: "LOGOUT" });
    toast.info("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
  }, [clearExpiryTimer, dispatch]);

  // If token existed in storage but already expired, notify once on boot
  useEffect(() => {
    if (!state.bootExpired || bootToastShownRef.current) return;
    bootToastShownRef.current = true;
    toast.info("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
  }, [state.bootExpired]);

  // Decode JWT exp/iat and auto-logout when token expires
  useEffect(() => {
    clearExpiryTimer();
    if (!state.token) return;

    const payload = decodeJwtPayload(state.token);
    const { expMs } = getJwtTimesMs(payload);

    // If token has no exp, skip auto-expiry handling
    if (!expMs) return;

    const remaining = expMs - Date.now();
    if (remaining <= 0) {
      logoutDueToExpiry();
      return;
    }

    const delay = Math.min(remaining, 2_147_483_647);
    expiryTimeoutRef.current = setTimeout(() => {
      logoutDueToExpiry();
    }, delay);

    return () => clearExpiryTimer();
  }, [state.token, clearExpiryTimer, logoutDueToExpiry]);

  // Sync auth state to storage
  useEffect(() => {
    const store = state.remember ? localStorage : sessionStorage;
    const other = state.remember ? sessionStorage : localStorage;

    try {
      other.removeItem("auth_token");
      other.removeItem("auth_user");

      if (state.token && state.user) {
        const { expMs } = getJwtTimesMs(decodeJwtPayload(state.token));
        if (expMs && Date.now() >= expMs) {
          logoutDueToExpiry();
          return;
        }

        store.setItem("auth_token", state.token);
        store.setItem("auth_user", JSON.stringify(state.user));
      } else {
        clearStorage();
      }
    } catch {
      // ignore storage errors
    }
  }, [state.token, state.user, state.remember, logoutDueToExpiry]);

  // Handle OAuth redirect tokens (runs on every page, not only /login)
  useEffect(() => {
    if (state.token) return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const rawUserData = params.get("user_data");
    if (!accessToken || !rawUserData) return;

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(decodeURIComponent(rawUserData));
    } catch {
      try {
        parsedUser = JSON.parse(rawUserData);
      } catch {
        parsedUser = null;
      }
    }

    const payload = decodeJwtPayload(accessToken);
    const sub = payload?.sub ?? null;
    const user = {
      id: parsedUser?.id ?? sub,
      email: parsedUser?.email ?? "",
      roles: avoidNullRoles(parsedUser?.roles),
    };

    try {
      sessionStorage.setItem("auth_token", accessToken);
      sessionStorage.setItem("auth_user", JSON.stringify(user));
    } catch {
      // ignore storage errors
    }

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user,
        token: accessToken,
        roles: user.roles,
        remember: false,
      },
    });

    const cleanedUrl = `${window.location.origin}${window.location.pathname}${
      window.location.hash || ""
    }`;
    window.history.replaceState({}, "", cleanedUrl);
  }, [dispatch, state.token]);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      logout: async (api) => {
        try {
          await api
            ?.post?.("/v1/auth/logout", null, { withCredentials: true })
            .catch(() => {});
        } finally {
          clearExpiryTimer();
          clearAuth();
          dispatch({ type: "LOGOUT" });
          if (api?.defaults?.headers?.common?.Authorization) {
            delete api.defaults.headers.common.Authorization;
          }
        }
      },
      setRemember: (remember) =>
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: state.user,
            token: state.token,
            roles: state.roles,
            remember,
          },
        }),
    }),
    [state, clearExpiryTimer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function avoidNullRoles(roles) {
  return Array.isArray(roles) ? roles : [];
}
