import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useLoadingContext } from "../../context/loading";
import { signUp } from "./lib/SignUp"; // Replace with your actual API function path
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Validation schema only for the necessary fields: fname, lname, email, password
const schema = yup.object().shape({
  fname: yup.string().required("First name is required"),
  lname: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export default function SignUp() {
  const [isPassword, setIsPassword] = React.useState(false);
  const { setIsLoading } = useLoadingContext();
  const nav = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: {
    fname: string;
    lname: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true); // Start loading spinner
    try {
      const res = await signUp(data); 
      console.log(res.data);
      // const { accessToken, user } = res.data; // Extract necessary data from the response
      // Store token and user information in localStorage
      // localStorage.setItem("token", JSON.stringify(accessToken));
      // localStorage.setItem("user", JSON.stringify(user));

      // Navigate to the desired page after successful signup
      nav("/dashboard");
      toast.success("Sign-Up successfully!");
    } catch (error: any) {
      // Handle errors
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsLoading(false); // Stop loading spinner
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="fname"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="First Name"
            variant="outlined"
            fullWidth
            margin="normal"
            error={!!errors.fname}
            helperText={errors.fname?.message}
          />
        )}
      />
      <Controller
        name="lname"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="Last Name"
            variant="outlined"
            fullWidth
            margin="normal"
            error={!!errors.lname}
            helperText={errors.lname?.message}
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="Password"
            variant="outlined"
            type={isPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setIsPassword(!isPassword)}
                    edge="end"
                  >
                    {isPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        disabled={false} // Add a loading indicator here if necessary
        sx={{ mt: 2 }}
      >
        Sign Up
      </Button>
    </form>
  );
}
