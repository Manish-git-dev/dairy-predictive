import api from './api';

export const riskService = {
  getRiskScores: async (params) => {
    const response = await api.get('/risk/scores', { params });
    return response.data;
  }
};

export default riskService;
