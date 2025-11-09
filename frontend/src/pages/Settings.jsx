import api from "../utils/api";
import { useAuth } from "../hooks/AuthProvider";
import { clearStorage } from "../utils/localstorage";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  useColorScheme,
} from "@mui/material";


export function ToggleMode() {
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        borderRadius: 1,
        p: 3,
        minHeight: '56px',
      }}
    >
      <FormControl>
        <FormLabel id="demo-theme-toggle">Theme</FormLabel>
        <RadioGroup
          aria-labelledby="demo-theme-toggle"
          name="theme-toggle"
          row
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          <FormControlLabel value="system" control={<Radio />} label="System" />
          <FormControlLabel value="light" control={<Radio />} label="Light" />
          <FormControlLabel value="dark" control={<Radio />} label="Dark" />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}


export default function Settings() {
  const auth = useAuth();
  const navigate = useNavigate();

  const deleteUser = async () => {
    await api
      .delete("/users/me")
      .then((res) => {
        if (res.status === 204) {
          clearStorage();
          auth.logout();
        }
      })
  }

  return (
    <div className="m-5">
      <Button 
        onClick={() => deleteUser()}
        variant="contained"
        color="success"
      >
        Deactivate account
      </Button>
      <Button 
        onClick={() => navigate('/password')}
        variant="contained"
        color="success"
      >
        Change password
      </Button>
      <ToggleMode />
    </div>
  );
}
