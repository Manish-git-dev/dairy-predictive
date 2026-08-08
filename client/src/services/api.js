import axios from 'axios';
import storage from '../utils/storage';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isProductionBuild = import.meta.env.PROD;

// Local development defaults to the backend's actual port.
// Production must provide VITE_API_BASE_URL through the Vercel environment.
const apiBaseUrl = configuredApiBaseUrl || 'http://localhost:4000/api/v1';

if (isProductionBuild && !configuredApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required for production builds');
}

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      storage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
