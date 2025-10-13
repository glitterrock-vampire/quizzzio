import { api } from './api';

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.token) {
        this.setToken(response.token);
        console.log('Token stored in localStorage:', this.getToken());
      }
      return response.user;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  logout() {
    // Only redirect if not already on the login page
    if (window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get current user
  async getCurrentUser() {
    // Don't try to get user if we're on the login page
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      console.log('🚫 Skipping getCurrentUser - on login/register page');
      return null;
    }

    // Check if we have a token
    const token = this.getToken();
    if (!token) {
      console.log('🚫 No token found in localStorage');
      return null;
    }

    console.log('🔍 Found token, attempting to get current user with token:', token.substring(0, 20) + '...');
    try {
      console.log('📡 Making API call to /auth/user');
      const response = await api.get('/auth/user');
      console.log('✅ API call successful, user data:', response.user);
      return response.user;
    } catch (error) {
      // If not authenticated, clear token and return null
      if (error.status === 401) {
        console.log('🚫 Token invalid (401), clearing localStorage');
        localStorage.removeItem('token');
        return null;
      }
      // For other errors, still return null but don't clear token
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Change password
  async changePassword({ currentPassword, newPassword }) {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Set auth token
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  }
}

export const authService = new AuthService();
