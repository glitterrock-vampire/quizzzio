// In-memory storage with demo user
let users = [
    {
      id: '1',
      email: 'demo@quizmaster.com',
      password: 'demo123', // In production, this would be hashed
      full_name: 'Demo User',
      total_points: 0,
      current_streak: 0,
      best_streak: 0,
      quizzes_completed: 0,
      correct_answers: 0,
      total_answers: 0,
      achievements: [],
      created_date: new Date().toISOString()
    }
  ];
  let idCounter = 2;
  
  export const UserModel = {
    // Find all users
    async findAll() {
      // Don't return passwords
      return users.map(({ password, ...user }) => user);
    },
    
    // Find by ID
    async findById(id) {
      const user = users.find(u => u.id === id);
      if (!user) return null;
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    
    // Find by email
    async findByEmail(email) {
      return users.find(u => u.email === email);
    },
    
    // Create user
    async create(data) {
      const user = {
        id: String(idCounter++),
        ...data,
        created_date: new Date().toISOString()
      };
      
      users.push(user);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    
    // Update user
    async update(id, data) {
      const index = users.findIndex(u => u.id === id);
      
      if (index === -1) return null;
      
      // Don't allow password updates through this method
      const { password, ...updateData } = data;
      
      users[index] = {
        ...users[index],
        ...updateData,
        updated_date: new Date().toISOString()
      };
      
      // Don't return password
      const { password: pwd, ...userWithoutPassword } = users[index];
      return userWithoutPassword;
    },
    
    // Delete user
    async delete(id) {
      const index = users.findIndex(u => u.id === id);
      
      if (index === -1) return false;
      
      users.splice(index, 1);
      return true;
    },
    
    // Get top users by points
    async getTopUsers(limit = 10) {
      return users
        .filter(u => u.total_points > 0)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
        .map(({ password, ...user }) => user);
    }
  };