import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useMemo } from 'react';

// Base URL should NOT include /api because most calls already use '/api/...'
const baseURL = (import.meta.env && import.meta.env.VITE_API_URL) || '';

export function useApiClient() {
  const { token, setToken, setUser } = useAuth();

  const instance = useMemo(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const api = axios.create({
      baseURL,
      headers
    });

    // Central 401 handling
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setToken('');
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return api;
  }, [token, setToken, setUser]);

  return instance;
}
