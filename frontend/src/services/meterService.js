import api from './api';

export const meterService = {
  getAll(params) {
    return api.get('/meters', { params });
  },

  getById(id) {
    return api.get(`/meters/${id}`);
  },

  create(data) {
    return api.post('/meters', data);
  },

  update(id, data) {
    return api.put(`/meters/${id}`, data);
  },

  delete(id) {
    return api.delete(`/meters/${id}`);
  },

  getByUser(userId) {
    return api.get(`/meters/user/${userId}`);
  },
};
