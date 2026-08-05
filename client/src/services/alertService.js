import api from './api';

export const alertService = {
  getAllAlerts: async (params) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },
  getActiveAlerts: async (params) => {
    const response = await api.get('/alerts/active', { params });
    return response.data;
  },
  getAlertCounts: async () => {
    const response = await api.get('/alerts/counts');
    return response.data;
  },
  createAlert: async (alertData) => {
    const response = await api.post('/alerts', alertData);
    return response.data;
  },
  getAlertById: async (id) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },
  acknowledgeAlert: async (id) => {
    const response = await api.patch(`/alerts/${id}/acknowledge`);
    return response.data;
  },
  resolveAlert: async (id, resolveData) => {
    const response = await api.patch(`/alerts/${id}/resolve`, resolveData);
    return response.data;
  }
};

export default alertService;
