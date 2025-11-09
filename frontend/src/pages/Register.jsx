import { useLocation } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";


export function UserRegister() {
  const location = useLocation();
  if (location.state) {
    return (
      <RegisterForm
        route="/auth/google-auth/register"
        googleData={location.state.googleData}
      />
    );
  } else {
    return <RegisterForm route="/auth/register" />;
  }
}


export function CompanyRegister() {
  return <RegisterForm route="/companies/register" />;
}
