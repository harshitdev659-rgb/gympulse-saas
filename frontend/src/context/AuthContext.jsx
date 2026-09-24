import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state directly from localStorage so on any device the session is immediate without flicker
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('gympulse_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [gym, setGym] = useState(() => {
    try {
      const savedGym = localStorage.getItem('gympulse_gym');
      return savedGym ? JSON.parse(savedGym) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    // If we already have a cached token and user, we can immediately render without blocking
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('gympulse_token') : null;
    return !!token && !user;
  });

  // Background session verification
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gympulse_token');
      if (token) {
        api.setToken(token);
        try {
          const data = await api.getMe();
          if (data && data.user) {
            setUser(data.user);
            setGym(data.gym || null);
            localStorage.setItem('gympulse_user', JSON.stringify(data.user));
            if (data.gym) {
              localStorage.setItem('gympulse_gym', JSON.stringify(data.gym));
            } else {
              localStorage.removeItem('gympulse_gym');
            }
          }
        } catch (error) {
          // CRITICAL: On network glitch, offline mode, or temporary server warmup,
          // DO NOT log out the user from this device! Keep the existing verified session.
          console.warn('Session verification notice (retaining persistent device session):', error);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Only clear session when server explicitly rejects authorization (401 on authenticated resource)
    const handleUnauthorized = () => {
      setUser(null);
      setGym(null);
      try {
        localStorage.removeItem('gympulse_token');
        localStorage.removeItem('gympulse_user');
        localStorage.removeItem('gympulse_gym');
      } catch (e) {}
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setToken(data.access_token);
    setUser(data.user);
    setGym(data.gym || null);
    try {
      localStorage.setItem('gympulse_user', JSON.stringify(data.user));
      if (data.gym) {
        localStorage.setItem('gympulse_gym', JSON.stringify(data.gym));
      } else {
        localStorage.removeItem('gympulse_gym');
      }
    } catch (e) {}
    return data;
  };

  const register = async (registerData) => {
    const data = await api.registerGym(registerData);
    api.setToken(data.access_token);
    setUser(data.user);
    setGym(data.gym || null);
    try {
      localStorage.setItem('gympulse_user', JSON.stringify(data.user));
      if (data.gym) {
        localStorage.setItem('gympulse_gym', JSON.stringify(data.gym));
      } else {
        localStorage.removeItem('gympulse_gym');
      }
    } catch (e) {}
    return data;
  };

  // Explicit user sign-out action (until user clicks this, they stay logged in on this device)
  const logout = () => {
    try {
      api.logout().catch(() => {});
    } catch (e) {}
    api.setToken(null);
    setUser(null);
    setGym(null);
    try {
      localStorage.removeItem('gympulse_token');
      localStorage.removeItem('gympulse_user');
      localStorage.removeItem('gympulse_gym');
    } catch (e) {}
  };

  const refreshGymProfile = async () => {
    try {
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setGym(data.gym || null);
        localStorage.setItem('gympulse_user', JSON.stringify(data.user));
        if (data.gym) {
          localStorage.setItem('gympulse_gym', JSON.stringify(data.gym));
        }
      }
      return data;
    } catch (e) {
      console.warn('Failed to refresh gym profile:', e);
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
