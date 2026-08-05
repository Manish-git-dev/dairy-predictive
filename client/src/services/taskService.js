import api from './api';

export const taskService = {
  getAllTasks: async (params) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  getMyTasks: async (params) => {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },
  checkSlaBreaches: async () => {
    const response = await api.get('/tasks/sla-check');
    return response.data;
  },
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  updateTaskStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },
  assignTask: async (id, assignedTo) => {
    const response = await api.patch(`/tasks/${id}/assign`, { assignedTo });
    return response.data;
  },
  addNote: async (id, text) => {
    const response = await api.post(`/tasks/${id}/notes`, { text });
    return response.data;
  },
  escalateTask: async (id, escalationData) => {
    const response = await api.patch(`/tasks/${id}/escalate`, escalationData);
    return response.data;
  }
};

export default taskService;
