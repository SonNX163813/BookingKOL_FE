/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useReducer } from "react";
import { loadAuth } from "../utils/auth";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function loadAuthFromStorage() {
  const { token, user } = loadAuth(); // đọc từ local/session
  return { token, user };
}

const boot = loadAuthFromStorage();

const initialState = {
  user: boot.user,
  token: boot.token,
  roles: boot.user?.roles || [],
  remember: !!localStorage.getItem("auth_token"), // có token ở local => đang "remember"
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
      return {
        ...state,
        user: null,
        token: null,
        roles: [],
        loading: false,
        error: action.payload,
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

  // Đồng bộ state <-> storage theo remember
  useEffect(() => {
    const store = state.remember ? localStorage : sessionStorage;
    const other = state.remember ? sessionStorage : localStorage;

    other.removeItem("auth_token");
    other.removeItem("auth_user");

    if (state.token && state.user) {
      store.setItem("auth_token", state.token);
      store.setItem("auth_user", JSON.stringify(state.user));
    } else {
      store.removeItem("auth_token");
      store.removeItem("auth_user");
    }
  }, [state.token, state.user, state.remember]);

  const value = {
    ...state,
    dispatch,
    logout: () => dispatch({ type: "LOGOUT" }),
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
