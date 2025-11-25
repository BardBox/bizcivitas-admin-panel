import axiosInstance, { axiosAuth } from "../../../axiosInstance";
import { signUpForm } from "../../../types/auth";

export const signUp = async (formData: signUpForm) => {
  // const { ...rest } = formData;
  // console.log(formData);
  const res = await axiosInstance.post('admins/register', formData);
  console.log(res);
  return res.data;
};

export const getOne = async () => {
  const res = await axiosInstance.get(`user/getOneUser`);
  return res.data;
};

export const updateOne = async (id: string, password: string) => {
  const res = await axiosInstance.put(`user/update/${id}`, { password });
  return res.data;
};

export const login = async (data: { email: string; password: string }) => {
  const response = await axiosAuth.post("http://localhost:8000/api/v1/users/login", data);
  console.log(response.data)
  return response.data;
};