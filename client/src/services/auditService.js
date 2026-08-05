import api from './api';

export const auditService = {
  getAllLogs: async (params) => {
    const response = await api.get('/audit', { params });
    return response.data;
  },
  getByResource: async (resource, resourceId, params) => {
    const response = await api.get(`/audit/${resource}/${resourceId}`, { params });
    return response.data;
  }
};

export default auditService;
