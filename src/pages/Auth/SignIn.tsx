import { useState, useEffect } from "react";
import { useVisibility } from "../../context/VisibilityContext";
import { loginUser } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import { useLoadingContext } from "../../context/loading";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";

const defaultTheme = createTheme();

const schema = yup.object().shape({
  email: yup.string().email("Invalid email address").required("Email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
});

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const { setIsLoading } = useLoadingContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    setSidebarAndHeaderVisibility(false);
    return () => setSidebarAndHeaderVisibility(true);
  }, [setSidebarAndHeaderVisibility]);

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setLoading(true);

  
      try {
        const { user, accessToken } = await loginUser(data.email, data.password);
        console.log("User role:", user.role); // Add this debug line
        
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role); // Make sure this is set
    
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setIsLoading(false);
      setLoading(false);
      toast.success("Login successful!");

      setTimeout(() => {
        const userRole = localStorage.getItem("role"); // Get role from local storage
        
      
        if (userRole === "admin") {
          console.log("Redirecting based on role:", userRole);
          navigate("/dashboard");
        } else if (userRole == "core-member") {
          navigate("/dashboard-core");
        } else {
          navigate("/unauthorized");
        }
      }, 500);
      
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      setLoading(false);
      toast.error(`${error.response?.data?.message || "Login failed!"} | Session expired! Please log in again.`);

    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src="/biz-logo.png"
            alt="Logo"
            style={{
              height: "200px",
              width: "auto",
            }}
          />
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      label="Email Address"
                      autoComplete="email"
                      error={!!errors.email}
                      helperText={errors.email?.message || ""}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      error={!!errors.password}
                      helperText={errors.password?.message || ""}
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign In"}
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
