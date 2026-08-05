import api from './api';

export const userService = {
  getAllUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  changePassword: async (id, passwords) => {
    const response = await api.patch(`/users/${id}/password`, passwords);
    return response.data;
  },
  deactivateUser: async (id) => {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  },
  activateUser: async (id) => {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  }
};

export default userService;
