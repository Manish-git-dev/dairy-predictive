import api from './api';

export const aiService = {
  explain: async (data) => {
    const response = await api.post('/ai/explain', data);
    return response.data;
  },
  recommend: async (data) => {
    const response = await api.post('/ai/recommend', data);
    return response.data;
  },
  getRuns: async (params) => {
    const response = await api.get('/ai/runs', { params });
    return response.data;
  },
  getRunById: async (id) => {
    const response = await api.get(`/ai/runs/${id}`);
    return response.data;
  }
};

export default aiService;
