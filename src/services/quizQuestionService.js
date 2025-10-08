const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const QuizQuestionService = {
  async list() {
    const response = await fetch(`${API_URL}/quiz-questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async filter(filters, orderBy = '', limit = 100) {
    const params = new URLSearchParams({
      ...filters,
      orderBy,
      limit: limit.toString()
    });
    const response = await fetch(`${API_URL}/quiz-questions?${params}`);
    if (!response.ok) throw new Error('Failed to filter questions');
    return response.json();
  },

  async create(data) {
    const response = await fetch(`${API_URL}/quiz-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },

  async bulkCreate(questions) {
    const response = await fetch(`${API_URL}/quiz-questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions)
    });
    if (!response.ok) throw new Error('Failed to bulk create questions');
    return response.json();
  },

  async update(id, data) {
    const response = await fetch(`${API_URL}/quiz-questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update question');
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_URL}/quiz-questions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete question');
    return response.json();
  }
};