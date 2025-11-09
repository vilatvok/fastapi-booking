import { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthProvider";
import AuthForm from "./AuthForm";


export default function RegisterForm({ route, googleData }) {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [googleId, setGoogleId] = useState("");

  const methodType = 'register';

  useEffect(() => {
    if (googleData) {
      setEmail(googleData.email);
      setGoogleId(googleData.google_id);
      setAvatar(googleData.avatar);
    }
  }, [googleData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form_data = new FormData();
      form_data.append("username", username);
      form_data.append("email", email);
      console.log(avatar)
      if (avatar) form_data.append("avatar", avatar);
      if (googleId) {
        form_data.append('social_id', googleId);
      } else {
        form_data.append('password', password);
      }
      auth.register(route, form_data);
    } catch (error) {
      console.log(error.response);
    }
  };

  const usernameField = {
    id: "username",
    label: "Username",
    type: "text",
    placeholder: "Username",
    onChange: (e) => setUsername(e.target.value),
  }

  let fields = [usernameField];

  let emailField = {
    id: "email",
    label: "Email",
    type: "email",
    placeholder: "Email",
  };

  if (route === "/auth/register") {
    emailField = {...emailField, onChange: (e) => setEmail(e.target.value)}

    const passwordField = {
      id: "password",
      label: "Password",
      type: "password",
      placeholder: "********",
      onChange: (e) => setPassword(e.target.value),
    }
    fields = [...fields, passwordField];

  } else if (route === "/auth/google-auth/register") {
    emailField = {...emailField, value: email, disabled: true}
  };

  const avatarField =  {
    id: "avatar",
    label: "Avatar",
    type: "file",
    onChange: (e) => setAvatar(e.target.files[0]),
    required: false,
  }

  fields = [...fields, emailField, avatarField];

  const data = {
    fields,
    handleSubmit,
    methodType,
  }
  return <AuthForm {...data} />;
}
