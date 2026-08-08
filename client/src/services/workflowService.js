import api from './api';

export const workflowService = {
  list: async (params) => {
    const response = await api.get('/workflows', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/workflows/users');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/workflows', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/workflows/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/workflows/${id}`);
    return response.data;
  },
  transition: async (id, status) => {
    const response = await api.patch(`/workflows/${id}/status`, { status });
    return response.data;
  },
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
