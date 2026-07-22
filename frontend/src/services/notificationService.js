import api from './api';

export const notificationService = {
  getAll(params) {
    return api.get('/notifications', { params });
  },

  getById(id) {
    return api.get(`/notifications/${id}`);
  },

  markAsRead(id) {
    return api.put(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return api.put('/notifications/read-all');
  },

  delete(id) {
    return api.delete(`/notifications/${id}`);
  },

  getUnreadCount() {
    return api.get('/notifications/unread-count');
  },
};
