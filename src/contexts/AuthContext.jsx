import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await UserService.me();
      setUser(userData);
    } catch (error) {
      console.error('Not authenticated');
      setUser(null);
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const login = async (credentials) => {
    const userData = await UserService.login(credentials);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await UserService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    refreshUser,
    login,
    logout
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}