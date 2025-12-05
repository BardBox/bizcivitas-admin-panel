import axios from "axios";

// development
const BACKEND_URL = "http://localhost";
const API_BASE_URL = `${BACKEND_URL}:8080/api/v1`;
// production
// const BACKEND_URL = "https://backend.bizcivitas.com";
// const API_BASE_URL = `${BACKEND_URL}/api/v1`;

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
      // Token is stored as a plain string, no need to JSON.parse()
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If unauthorized or forbidden, clear storage and redirect to login
      // But only if we are not already on the login page to avoid loops
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/franchise-login")) {
        // Optional: Check if it's just a token expiry vs a forbidden resource
        // For 403, we might not want to log them out if they are just accessing the wrong page
        // But the user asked for "if i am not logout it needs to redirect me to login page"

        if (error.response.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
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
