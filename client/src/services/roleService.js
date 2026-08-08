import api from './api';

const roleService = {
  getAllRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
  getRoleById: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },
  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },
};

export default roleService;
