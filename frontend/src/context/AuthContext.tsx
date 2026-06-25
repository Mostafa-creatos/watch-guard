import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<User>('/users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to validate token:', err);
        // Clear invalid token
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', {
        username,
        password,
      });
      const data = response.data;
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/register', {
        username,
        email,
        password,
        fullName,
      });
      const data = response.data;
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (fullName: string) => {
    try {
      const response = await api.put<User>('/users/profile', { fullName });
      setUser(response.data);
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
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
