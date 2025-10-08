const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const QuizSessionService = {
  async list() {
    const response = await fetch(`${API_URL}/quiz-sessions`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  async getUserSessions(userId, limit = 10) {
    const response = await fetch(`${API_URL}/quiz-sessions/user/${userId}?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch user sessions');
    return response.json();
  },

  async create(data) {
    const response = await fetch(`${API_URL}/quiz-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  }
};