import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gympulse_token');
      if (token) {
        api.setToken(token);
        try {
          const data = await api.getMe();
          setUser(data.user);
          setGym(data.gym);
        } catch (error) {
          console.error('Failed to restore session:', error);
          api.setToken(null);
          setUser(null);
          setGym(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setGym(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setToken(data.access_token);
    setUser(data.user);
    setGym(data.gym);
    return data;
  };

  const register = async (registerData) => {
    const data = await api.registerGym(registerData);
    api.setToken(data.access_token);
    setUser(data.user);
    setGym(data.gym);
    return data;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setGym(null);
  };

  const refreshGymProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setGym(data.gym);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      gym,
      loading,
      login,
      register,
      logout,
      refreshGymProfile,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
