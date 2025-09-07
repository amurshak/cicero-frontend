import React, { createContext, useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { authService } from '../services/auth';
import { identifyUser, resetUser } from '../services/posthog';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const posthog = usePostHog();

  useEffect(() => {
    checkAuth();
  }, []);

  // Identify or reset user in PostHog when user state changes
  useEffect(() => {
    if (user) {
      // Identify user in PostHog
      identifyUser(posthog, user.id, {
        email: user.email,
        display_name: user.display_name,
        subscription_tier: user.subscription_tier || 'free',
        oauth_provider: user.oauth_provider,
        created_at: user.created_at,
      });
    } else {
      // Reset PostHog when user logs out
      resetUser(posthog);
    }
  }, [user, posthog]);

  const checkAuth = async () => {
    try {
      // Use /auth/check endpoint which doesn't require authentication
      const response = await authService.checkAuth();
      if (response.authenticated && response.user) {
        setUser(response.user);
      } else {
        // Clear any stale tokens
        localStorage.removeItem('authToken');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      
      if (response.success && response.user) {
        // Store JWT token for API calls
        if (response.access_token) {
          localStorage.setItem('authToken', response.access_token);
        }
        setUser(response.user);
        return { success: true };
      } else {
        const errorMsg = response.message || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const signup = async (email, password, displayName, firstName = null, lastName = null) => {
    try {
      setError(null);
      const response = await authService.signup(email, password, displayName, firstName, lastName);
      
      if (response.success && response.user) {
        // Store JWT token for API calls
        if (response.access_token) {
          localStorage.setItem('authToken', response.access_token);
        }
        setUser(response.user);
        return { success: true };
      } else {
        const errorMsg = response.message || 'Signup failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      setError(null);
      const response = await authService.googleAuth(idToken);
      
      if (response.success && response.user) {
        // Store JWT token for API calls
        if (response.access_token) {
          localStorage.setItem('authToken', response.access_token);
        }
        setUser(response.user);
        return { success: true };
      } else {
        const errorMsg = response.message || 'Google login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      
      // Clear WebSocket session on logout to start fresh
      const { websocketService } = await import('../services/websocket');
      websocketService.endSession();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}