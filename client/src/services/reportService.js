import api from './api';

export const reportService = {
  getTypes: async () => {
    const response = await api.get('/reports/types');
    return response.data;
  },
  generate: async (reportData) => {
    const response = await api.post('/reports/generate', reportData);
    return response.data;
  }
};

export default reportService;
