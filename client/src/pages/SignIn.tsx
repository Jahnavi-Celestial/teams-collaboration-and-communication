import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { useMutation } from "@apollo/client/react";
import { Login, Register, GoogleLoginMutation } from "../graphql/mutations";
import { useAuth, type CustomJwtPayload } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface FormData{
    name: string,
    email: string,
    password: string
}

export default function Sign() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", password: "" });

  const [loginAction] = useMutation(Login, {
    onCompleted: (data) => {
      if (data?.login) {
        loginUser(data.login, { email: formData.email });
        navigate("/dashboard");
      }
    },
    onError: (error) => {
      alert(error.message || "Login failed");
    },
  });

  const [registerAction] = useMutation(Register, {
    onCompleted: (data) => {
      if (data?.register) {
        alert("Registered successfully!");
        setIsLogin(true);
      }
    },
    onError: (error) => {
      alert(error.message || "Registration failed");
    },
  });

  const [googleLoginAction] = useMutation(GoogleLoginMutation, {
    onCompleted: (data) => {
      if (data?.googleLogin) {
        const decoded = jwtDecode<CustomJwtPayload>(data?.googleLogin);
        loginUser(data.googleLogin, { email: decoded.email || "" });
        navigate("/dashboard", { replace: true });
      }
    },
    onError: (error) => {
      alert(error.message || "Google login failed");
    },
  });

  const handleSubmit = ():void => {
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      alert("Please fill all required fields");
      return;
    }
    if (isLogin) {
      loginAction({
        variables: { email: formData.email, password: formData.password },
      });
    } else {
      registerAction({
        variables: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
      });
    }
  };

  return (
    <Dialog open fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "700", pb: 2, textAlign: "center" }}>
        {isLogin ? "Sign In" : "Create Account"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{display: "flex", flexDirection: "column", gap: 2}}>
          {!isLogin && (
            <TextField
              label="Name"
              size="small"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}
          <TextField
            label="Email Address"
            type="email"
            size="small"
            sx={{my: 2}}
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ mt: 2, mb: 1, cursor: "pointer", color: "#3d77cf", fontWeight: "500" }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Create an account" : "Already registered? Click here"}
        </Typography>

        <Divider sx={{ my: 2 }}>OR</Divider>

        <GoogleLogin
          onSuccess={(res) => {
            if (!res.credential) return;
            googleLoginAction({ variables: { idToken: res.credential } });
          }}
          onError={() => alert("Google Login Failed")}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          disableElevation
          onClick={handleSubmit}
          sx={{
            bgcolor: "#3d77cf",
            "&:hover": { bgcolor: "#3d77cf" },
            textTransform: "none",
            px: 3,
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
