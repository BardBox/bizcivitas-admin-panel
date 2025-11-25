import axios from "axios";

// development
// const BACKEND_URL = "http://localhost";
// const API_BASE_URL = `${BACKEND_URL}:8080/api`;
//production
const BACKEND_URL = "https://backend.bizcivitas.com";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  timeoutErrorMessage: "Timeout",
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get the token from localStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;// Set the Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const axiosAuth = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  timeoutErrorMessage: "Timeout",
});

axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default axiosInstance;
