import { useEffect, useReducer } from "react";
import { AuthContext } from "./AuthContext";

const getUserFromLocalStorage = () => {
  const storedUser = localStorage.getItem("user");
  try {
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("Lỗi parse JSON:", e);
    return null;
  }
};

const initial_state = {
  user: getUserFromLocalStorage(),
  loading: false,
  error: null,
};

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, user: null, loading: true, error: null };
    case "LOGIN_SUCCESS":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return { ...state, user: action.payload, loading: false, error: null };
    case "LOGIN_FAILURE":
      return { ...state, user: null, loading: false, error: action.payload };
    case "REGISTER_SUCCESS":
      return { ...state, user: null, loading: false, error: null };
    case "LOGOUT":
      localStorage.removeItem("user");
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(AuthReducer, initial_state);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("user");
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}
