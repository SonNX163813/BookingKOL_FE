/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
} from "react";
import { loadAuth, clearAuth } from "../utils/auth";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function loadAuthFromStorage() {
  const { token, user } = loadAuth(); // read from local/session with keys auth_token/auth_user
  return { token, user };
}

const boot = loadAuthFromStorage();

const initialState = {
  user: boot.user,
  token: boot.token,
  roles: boot.user?.roles || [],
  remember: !!localStorage.getItem("auth_token"), // token in localStorage means "remember me"
  loading: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS": {
      const { user, token, roles = [], remember = true } = action.payload;
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

  // Sync state <-> storage depending on remember flag
  useEffect(() => {
    const store = state.remember ? sessionStorage : localStorage;
    const other = state.remember ? sessionStorage : localStorage;

    try {
      // wipe the other storage to avoid mismatch
      other.removeItem("auth_token");
      other.removeItem("auth_user");

      if (state.token && state.user) {
        store.setItem("auth_token", state.token);
        store.setItem("auth_user", JSON.stringify(state.user));
      } else {
        clearStorage();
      }
    } catch {
      // ignore storage quota errors
    }
  }, [state.token, state.user, state.remember]);

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
