import { useState } from "react";
import { useAuth } from "../hooks/AuthProvider";
import AuthForm from "./AuthForm";


export default function LoginForm({ route }) {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const methodType = 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form_data = new FormData();
      form_data.append("username", username);
      form_data.append("password", password);
      auth.login(route, form_data);
    } catch (error) {
      console.log(error.response);
    }
  };

  const username_field = {
    id: "username",
    label: "Username",
    type: "text",
    placeholder: "Username",
    onChange: (e) => setUsername(e.target.value),
  };

  const password_field =  {
    id: "password",
    label: "Password",
    type: "password",
    placeholder: "********",
    onChange: (e) => setPassword(e.target.value),
  };

  const fields = [username_field, password_field];
  const data = {
    fields,
    handleSubmit,
    methodType,
  }
  return <AuthForm {...data} />;
}
