// DEPRECATED: Use useApiClient() from src/api/client.js instead (Context-driven, unified 401 handling)
// This file kept only for backward compatibility during migration.
import axios from 'axios';

const baseURL = (import.meta.env && import.meta.env.VITE_API_URL) || '';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
