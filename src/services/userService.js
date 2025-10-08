const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const UserService = {
  async list() {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async me() {
    const response = await fetch(`${API_URL}/users/me`);
    if (!response.ok) throw new Error('Failed to fetch current user');
    return response.json();
  },

  async update(id, data) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  }
};