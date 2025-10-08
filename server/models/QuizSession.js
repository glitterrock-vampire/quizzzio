// In-memory storage
let sessions = [];
let idCounter = 1;

export const QuizSessionModel = {
  // Find all sessions
  async findAll() {
    return sessions.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  },
  
  // Find by ID
  async findById(id) {
    return sessions.find(s => s.id === parseInt(id));
  },
  
  // Find by user
  async findByUser(userId, limit = 10) {
    return sessions
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, limit);
  },
  
  // Create session
  async create(data) {
    const session = {
      id: idCounter++,
      ...data,
      created_date: new Date().toISOString()
    };
    
    sessions.push(session);
    return session;
  },
  
  // Get user statistics
  async getUserStats(userId) {
    const userSessions = sessions.filter(s => s.user_id === userId);
    
    if (userSessions.length === 0) {
      return {
        total_sessions: 0,
        total_score: 0,
        average_score: 0,
        total_questions: 0,
        correct_answers: 0,
        accuracy: 0
      };
    }
    
    const stats = userSessions.reduce((acc, s) => ({
      total_sessions: acc.total_sessions + 1,
      total_score: acc.total_score + s.score,
      total_questions: acc.total_questions + s.total_questions,
      correct_answers: acc.correct_answers + s.correct_answers
    }), {
      total_sessions: 0,
      total_score: 0,
      total_questions: 0,
      correct_answers: 0
    });
    
    return {
      ...stats,
      average_score: Math.round(stats.total_score / stats.total_sessions),
      accuracy: Math.round((stats.correct_answers / stats.total_questions) * 100)
    };
  },
  
  // Get leaderboard
  async getLeaderboard(limit = 10) {
    // Group by user and calculate total scores
    const userScores = {};
    
    sessions.forEach(s => {
      if (!userScores[s.user_id]) {
        userScores[s.user_id] = {
          user_id: s.user_id,
          total_score: 0,
          sessions_count: 0
        };
      }
      userScores[s.user_id].total_score += s.score;
      userScores[s.user_id].sessions_count += 1;
    });
    
    return Object.values(userScores)
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit);
  }
};