/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
} from "react";
import { clearAuth } from "../utils/auth";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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

  // Primary source: sessionStorage
  const sessionData = read(sessionStorage);
  if (sessionData) return sessionData;

  // Migrate any legacy localStorage data into sessionStorage once, then clear localStorage
  const legacyLocal = read(localStorage);
  if (legacyLocal) {
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
      };
    }

    case "LOGIN_FAILURE":
      // Do not clear token/user here, only set error
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
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

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

  // Sync auth state to sessionStorage (no localStorage persistence)
  useEffect(() => {
    try {
      // always use sessionStorage; clear leftover localStorage data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      if (state.token && state.user) {
        sessionStorage.setItem("auth_token", state.token);
        sessionStorage.setItem("auth_user", JSON.stringify(state.user));
      } else {
        clearStorage();
      }
    } catch {
      // ignore storage quota errors
    }
  }, [state.token, state.user]);

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

    const user = {
      id: parsedUser?.id ?? null,
      email: parsedUser?.email ?? "",
      roles: parsedUser?.roles ?? [],
    };

    try {
      // Google login always saves to session storage to avoid unwanted "remember"
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

    // Remove query params after processing
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
          // Call BE logout if available; ignore failures
          await api
            ?.post?.("/v1/auth/logout", null, { withCredentials: true })
            .catch(() => {});
        } finally {
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
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
