import { api } from './api';

export const authService = {
  // Sign up with password
  signup: async (email, password, displayName, firstName = null, lastName = null) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName
    });
    return response.data;
  },

  // Login with password
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Google OAuth (correct field name)
  googleAuth: async (idToken) => {
    const response = await api.post('/auth/google', {
      id_token: idToken
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