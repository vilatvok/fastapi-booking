import LoginForm from "../components/LoginForm";
import { useAuth } from "../hooks/AuthProvider";


export function Login() {
  return <LoginForm route="/auth/login" />;
}

export function Logout() {
  const auth = useAuth();
  return auth.logout();
}
