import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  Button,
  Container,
  Grid2 as Grid,
  TextField,
} from "@mui/material"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';


export default function AuthForm({
  fields,
  handleSubmit,
  methodType,
}) {

  const googleAuth = async () => {
    await api
      .get("/auth/google-auth/link")
      .then((res) => { window.location.href = res.data.url; })
  };

  return (
    <div className="m-5">
      <Container maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid key={field.id} size={12}>
                {field.type === "file" ? (
                  <Button
                    component="label"
                    variant="contained"
                    tabIndex={-1}
                    color="success"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Images
                    <input
                      hidden
                      id={field.id}
                      type="file"
                      onChange={field.onChange}
                      value={field.value}
                      required={field.required === false ? false : true}
                    />
                  </Button>
                ) : (
                  <TextField
                    fullWidth
                    id={field.id}
                    type={field.type}
                    label={field.label}
                    name={field.id}
                    value={field.value}
                    onChange={field.onChange}
                    variant="outlined"
                    disabled={field.disabled}
                    required={field.required === false ? false : true}
                  />
                )}
              </Grid>
            ))}
            <Grid size={12}>
              <div className="flex items-center justify-between">
                <Button type="submit" color="success" variant="contained">
                  {methodType === "register" ? "Register" : "Login"}
                </Button>
                {methodType === "login" && (
                  <Link
                    to="/password-reset"
                    className="ms-2 text-primary
                    focus:outline-none
                    dark:text-primary-400"
                  >
                    Forgot password?
                  </Link>
                )}
                <Button
                  color="success"
                  variant="contained"
                  onClick={googleAuth}
                >
                  Google
                </Button>
              </div>
            </Grid>
          </Grid>
        </form>
      </Container>
    </div>
  );
}
