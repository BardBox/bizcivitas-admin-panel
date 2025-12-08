import axios from 'axios';

// ✅ Create an Axios instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  // Remove default Content-Type to allow flexibility for multipart/form-data
  withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true', // Set based on env variable
});

// ✅ Helper to get token from cookies
const getTokenFromCookies = (): string | null => {
  const name = 'accessToken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
};

// ✅ Attach Token to Every Request (Interceptor)
api.interceptors.request.use(
  (config) => {
    // Try to get token from cookies first, then fall back to localStorage
    const token = getTokenFromCookies() || localStorage.getItem('token');

    // Enhanced debugging
    console.log('🔍 Token Debug:', {
      cookieToken: getTokenFromCookies() ? '✅ Found in cookies' : '❌ Not in cookies',
      localStorageToken: localStorage.getItem('token') ? '✅ Found in localStorage' : '❌ Not in localStorage',
      finalToken: token ? `✅ Using token: ${token.substring(0, 20)}...` : '❌ NO TOKEN FOUND',
      allCookies: document.cookie,
      allLocalStorage: Object.keys(localStorage)
    });

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('⚠️ WARNING: No authentication token found! Request will likely fail with 401/403');
    }

    // Log request for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!config.headers['Authorization'],
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