/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
} from "react";
import { loadAuth } from "../utils/auth";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function loadAuthFromStorage() {
  const { token, user } = loadAuth(); // đọc từ local/session (cùng key "auth_token"/"auth_user")
  return { token, user };
}

const boot = loadAuthFromStorage();

const initialState = {
  user: boot.user,
  token: boot.token,
  roles: boot.user?.roles || [],
  remember: !!localStorage.getItem("auth_token"), // có token ở local => "remember"
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
      // ❗ KHÔNG xoá user/token ở đây, chỉ set error
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

  // helper xoá sạch cả hai nơi
  const clearStorage = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_user");
    } catch (e) {
      // ignore
    }
  };

  // Đồng bộ state <-> storage theo remember
  useEffect(() => {
    const store = state.remember ? localStorage : sessionStorage;
    const other = state.remember ? sessionStorage : localStorage;

    try {
      // dọn nơi còn lại
      other.removeItem("auth_token");
      other.removeItem("auth_user");

      if (state.token && state.user) {
        store.setItem("auth_token", state.token);
        store.setItem("auth_user", JSON.stringify(state.user));
      } else {
        // nếu chưa có token/user (chưa đăng nhập) thì xoá ở cả hai nơi
        clearStorage();
      }
    } catch (e) {
      // nếu lỗi (vd: storage đầy), xoá sạch cả hai nơi
    }
  }, [state.token, state.user, state.remember]);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      logout: () => {
        clearStorage();
        dispatch({ type: "LOGOUT" });
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
