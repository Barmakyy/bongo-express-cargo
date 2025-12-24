import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Your backend API base URL
});

// Request Interceptor: Injects the auth token into every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Smartly updates user context ONLY on specific routes.
api.interceptors.response.use(
  (response) => {
    // This is the fix: Only update the user context if the response is from an explicit profile update.
    if (response.config.url === '/auth/update-me' && response.data?.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      // This custom event tells the AuthContext to refresh its state.
      window.dispatchEvent(new Event('authChange'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;