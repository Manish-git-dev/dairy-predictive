import api from './api';

export const workflowService = {
  getAllQueues: async (params) => {
    const response = await api.get('/workflows/queues', { params });
    return response.data;
  },
  getQueueByStage: async (stage, params) => {
    const response = await api.get(`/workflows/queues/${stage}`, { params });
    return response.data;
  },
  transitionStage: async (transitionData) => {
    const response = await api.post('/workflows/transition', transitionData);
    return response.data;
  }
};

export default workflowService;
