import { api } from './api';

export const authService = {
  // Sign up
  signup: async (email, password, displayName) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      display_name: displayName
    });
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Google OAuth
  googleAuth: async (credential) => {
    const response = await api.post('/auth/google', {
      credential
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Check auth status
  checkAuth: async () => {
    const response = await api.get('/auth/check');
    return response.data;
  }
};