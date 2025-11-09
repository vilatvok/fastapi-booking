import api from "../utils/api";
import { useState, createContext, useContext } from "react";
import { useCurrentUser } from "./useCurrentUser";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { clearStorage, setAuthTokens } from "../utils/localstorage";


const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export default function AuthProvider({ children }) {
  const user = useCurrentUser();
  const [token, setToken] = useState(user);
  const navigate = useNavigate();

  const login = async (route, data) => {
    await api
      .post(route, data)
      .then((res) => {
        if (res.data.google_url) {
          const googleData = {
            email: res.data.email,
            google_id: res.data.google_id,
            avatar: res.data.avatar,
          }
          navigate("/auth/register", { state: { googleData } });
        } else if (res.status === 200) {
          const access_token = res.data.access_token;
          const decoded = jwtDecode(access_token);

          setAuthTokens(access_token, res.data.refresh_token);
          setToken(decoded);
          navigate("/");
        }
      })
  };

  const logout = () => {
    clearStorage();
    setToken(null);
    navigate("/auth/login");
  };

  const register = async (route, data) => {
    await api
      .post(route, data)
      .then((res) => res.status)
      .then((status) => { if ([200, 201].includes(status)) navigate("/auth/login");})
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
