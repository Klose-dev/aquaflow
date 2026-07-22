import api from './api';

export const userService = {
  getAll(params) {
    return api.get('/users', { params });
  },

  getById(id) {
    return api.get(`/users/${id}`);
  },

  create(data) {
    return api.post('/users', data);
  },

  update(id, data) {
    return api.put(`/users/${id}`, data);
  },

  delete(id) {
    return api.delete(`/users/${id}`);
  },

  getRoles() {
    return api.get('/roles');
  },
};
