import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/AuthService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on initial render and when path changes
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        setLoading(false);
        return;
      }

      // Check if we have a token before trying to load user data
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Add a small delay to ensure login process is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        const userData = await authService.getCurrentUser();
        if (isMounted) {
          setUser({ ...userData });
          setError(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        if (isMounted) {
          setError(error.message || 'Failed to load user data');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login(credentials);

      // Set user data immediately after successful login
      setUser({ ...userData });

      // Add a small delay to ensure token is properly stored
      await new Promise(resolve => setTimeout(resolve, 50));

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);

      // Use the user data from the registration response directly
      if (response.user) {
        setUser({ ...response.user });
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      authService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  };

  // Change password function
  const changePassword = async (passwords) => {
    try {
      setLoading(true);
      setError(null);
      await authService.changePassword(passwords);
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to change password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && authService.isAuthenticated();
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    try {
      console.log('🔄 Refreshing user data...');
      const userData = await authService.getCurrentUser();
      console.log('✅ User data refreshed:', userData);
      setUser({ ...userData }); // Create new object reference to force re-render
      console.log('✅ User context updated');
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    hasRole,
    login,
    register,
    logout,
    changePassword,
    refreshUser,
    setError
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
