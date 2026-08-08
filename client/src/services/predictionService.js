import api from './api';

const predictionService = {
  generate: async (options = {}) => {
    const response = await api.post('/predictions/generate', options);
    return response.data;
  },
  getPredictions: async (params = {}) => {
    const response = await api.get('/predictions', { params });
    return response.data;
  },
  getPrediction: async (id) => {
    const response = await api.get(`/predictions/${id}`);
    return response.data;
  }
};

export default predictionService;
