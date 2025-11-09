import api from "../utils/api";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../data/constants";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearStorage, getItem, setItem } from "../utils/localstorage";

export default function ProtectedRoute() {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    isAuthenticated();
  }, []);

  const refreshToken = async () => {
    const token = getItem(REFRESH_TOKEN);
    await api
      .post("auth/token/refresh", {refresh_token: token})
      .then((res) => {
        if (res.status === 200) {
          setItem(ACCESS_TOKEN, res.data.access_token);
        } else {
          clearStorage();
        }
      })
      .catch((err) => clearStorage());
  };

  const isAuthenticated = async () => {
    if (!token) {
      return;
    }
    const time_exp = token.exp;
    const now = Date.now() / 1000;

    if (time_exp < now) {
      await refreshToken();
      return;
    }
    const username = token.username;
    await api
      .get(`users/${username}`)
      .then((res) => { if (res.status !== 200) navigate("/auth/login"); })
  };

  return token ? <Outlet /> : <Navigate to="/auth/login" />;
};
