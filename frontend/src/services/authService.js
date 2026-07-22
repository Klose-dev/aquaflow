import api from './api';

export const authService = {
  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  register(data) {
    return api.post('/auth/register', data);
  },

  getMe() {
    return api.get('/auth/me');
  },

  updateProfile(data) {
    return api.put('/auth/profile', data);
  },
};
