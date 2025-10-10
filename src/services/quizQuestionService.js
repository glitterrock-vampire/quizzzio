const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const QuizQuestionService = {
  async list() {
    try {
      const response = await fetch(`${API_URL}/quiz-questions`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    } catch (error) {
      console.error('QuizQuestionService.list error:', error);
      return [];
    }
  },

  async filter(filters, orderBy = '', limit = 100) {
    try {
      console.log('QuizQuestionService.filter called with:', filters, 'limit:', limit);
      const params = new URLSearchParams({
        ...filters,
        orderBy,
        limit: limit.toString()
      });
      
      console.log('Making API call to:', `${API_URL}/quiz-questions?${params}`);
      const response = await fetch(`${API_URL}/quiz-questions?${params}`);
      
      if (!response.ok) {
        console.error('API call failed:', response.status, response.statusText);
        throw new Error('Failed to filter questions');
      }
      
      const questions = await response.json();
      console.log('Received questions:', questions.length, 'questions');
      
      return questions;
    } catch (error) {
      console.error('QuizQuestionService.filter error:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/quiz-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    } catch (error) {
      console.error('QuizQuestionService.create error:', error);
      throw error;
    }
  },

  async bulkCreate(questions) {
    try {
      const response = await fetch(`${API_URL}/quiz-questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questions)
      });
      if (!response.ok) throw new Error('Failed to bulk create questions');
      return response.json();
    } catch (error) {
      console.error('QuizQuestionService.bulkCreate error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/quiz-questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    } catch (error) {
      console.error('QuizQuestionService.update error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/quiz-questions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete question');
      return response.json();
    } catch (error) {
      console.error('QuizQuestionService.delete error:', error);
      throw error;
    }
  }
};
