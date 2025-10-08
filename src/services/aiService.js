const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AIService = {
  async generateQuestions(config) {
    const response = await fetch(`${API_URL}/ai/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to generate questions');
    const data = await response.json();
    return data.questions;
  }
};