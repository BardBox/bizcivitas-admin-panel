import { useState, useEffect } from "react";
import { useVisibility } from "../../context/VisibilityContext";
import { loginUser } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
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

export default function FranchiseSignIn() {
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

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setIsLoading(false);
      setLoading(false);
      toast.success("Franchise Partner Login successful!");

      setTimeout(() => {
        const userRole = localStorage.getItem("role");
        console.log("Redirecting franchise partner with role:", userRole);

        // Both master-franchise and area-franchise use the same unified dashboard
        if (userRole === "master-franchise") {
          navigate("/dashboard-franchise");
        } else if (userRole === "area-franchise") {
          navigate("/dashboard-area");
        } else if (userRole === "cgc") {
          navigate("/dashboard-cgc");
        } else if (userRole === "dcp") {
          navigate("/dashboard-dcp");
        } else {
          toast.error("Invalid franchise partner role");
          navigate("/login");
        }
      }, 500);

    } catch (error: any) {
      console.error("Franchise login error:", error);
      setIsLoading(false);
      setLoading(false);
      toast.error(`${error.response?.data?.message || "Login failed!"}`);
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
            Franchise Partner Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
            Login as Master Franchise, Area Franchise, CGC, or DCP
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
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign In as Franchise Partner"}
            </Button>
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                  Login as Admin / Core Member instead
                </Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
