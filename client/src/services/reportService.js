import api from './api';

export const reportService = {
  getTypes: async () => {
    const response = await api.get('/reports/types');
    return response.data;
  },
  generate: async (reportData) => {
    const response = await api.post('/reports/generate', reportData);
    return response.data;
  },
  downloadCsv: async (reportData) => {
    const response = await api.post('/reports/generate', { ...reportData, format: 'csv' }, { responseType: 'blob' });
    return response;
  },
  getHistory: async (params = {}) => {
    const response = await api.get('/reports/history', { params });
    return response.data;
  }
};

export default reportService;
