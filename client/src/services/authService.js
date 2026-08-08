import api from './api';

const unwrap = (response) => response.data?.data ?? response.data;

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return unwrap(response);
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return unwrap(response);
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return unwrap(response);
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return unwrap(response);
  }
};

export default authService;
