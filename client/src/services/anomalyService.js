import api from './api';

export const anomalyService = {
  detectAnomalies: async (params = {}) => {
    const response = await api.post('/anomalies/detect', params);
    return response.data;
  },
  getAllAnomalies: async (params = {}) => {
    const response = await api.get('/anomalies', { params });
    return response.data;
  },
  getRiskScores: async () => {
    const response = await api.get('/anomalies/risk-scores');
    return response.data;
  },
  getAnomalyById: async (id) => {
    const response = await api.get(`/anomalies/${id}`);
    return response.data;
  },
  updateStatus: async (id, status, resolution = '') => {
    const response = await api.patch(`/anomalies/${id}/status`, { status, resolution });
    return response.data;
  },
  explainAnomaly: async (id) => {
    const response = await api.get(`/anomalies/${id}/explain`);
    return response.data;
  }
};

export default anomalyService;
