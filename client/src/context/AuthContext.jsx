import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import storage from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storage.getUser());
  const [token, setToken] = useState(storage.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!storage.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storage.getToken();
      if (storedToken) {
        try {
          const fetchedUser = await authService.getCurrentUser();
          storage.setUser(fetchedUser);
          setUser(fetchedUser);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to restore session:', err);
          storage.clear();
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { user: loggedInUser, token: authToken } = await authService.login(email, password);
      storage.setToken(authToken);
      storage.setUser(loggedInUser);
      setUser(loggedInUser);
      setToken(authToken);
      setIsAuthenticated(true);
      return loggedInUser;
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout endpoint error:', err);
    } finally {
      storage.clear();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
