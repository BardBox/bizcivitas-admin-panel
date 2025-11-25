import axios from 'axios';

// ✅ Create an Axios instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  // Remove default Content-Type to allow flexibility for multipart/form-data
  withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true', // Set based on env variable
});

// ✅ Attach Token to Every Request (Interceptor)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Log request for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data instanceof FormData ? Object.fromEntries(config.data) : config.data,
    });
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);






export default api;