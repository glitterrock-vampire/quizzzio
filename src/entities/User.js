import { UserService } from '../services/userService.js';

export const User = {
  async me() {
    try {
      return await UserService.me();
    } catch (error) {
      console.error('Error loading user:', error);
      // Return demo user for development
      return {
        id: '1',
        email: 'demo@quizmaster.com',
        full_name: 'Demo User',
        total_points: 0,
        current_streak: 0,
        best_streak: 0,
        quizzes_completed: 0,
        correct_answers: 0,
        total_answers: 0,
        achievements: []
      };
    }
  }
};
