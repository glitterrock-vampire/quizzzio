// In-memory storage
let questions = [];
let idCounter = 1;

export const QuizQuestionModel = {
  // Find all with filters
  async find(filters = {}, options = {}) {
    let result = [...questions];
    
    // Apply filters
    if (filters.subject) {
      result = result.filter(q => q.subject === filters.subject);
    }
    if (filters.difficulty) {
      result = result.filter(q => q.difficulty === filters.difficulty);
    }
    
    // Apply sorting
    if (options.orderBy) {
      const field = options.orderBy.replace('-', '');
      const desc = options.orderBy.startsWith('-');
      result.sort((a, b) => {
        if (desc) return b[field] > a[field] ? 1 : -1;
        return a[field] > b[field] ? 1 : -1;
      });
    }
    
    // Apply limit
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  },
  
  // Find by ID
  async findById(id) {
    return questions.find(q => q.id === parseInt(id));
  },
  
  // Create single question
  async create(data) {
    const question = {
      id: idCounter++,
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    questions.push(question);
    return question;
  },
  
  // Bulk create
  async bulkCreate(data) {
    const newQuestions = data.map(q => ({
      id: idCounter++,
      ...q,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }));
    
    questions.push(...newQuestions);
    return newQuestions;
  },
  
  // Update question
  async update(id, data) {
    const index = questions.findIndex(q => q.id === parseInt(id));
    
    if (index === -1) return null;
    
    questions[index] = {
      ...questions[index],
      ...data,
      updated_date: new Date().toISOString()
    };
    
    return questions[index];
  },
  
  // Delete question
  async delete(id) {
    const index = questions.findIndex(q => q.id === parseInt(id));
    
    if (index === -1) return false;
    
    questions.splice(index, 1);
    return true;
  },
  
  // Get random questions
  async random(filters = {}, count = 10) {
    const filtered = await this.find(filters);
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
  
  // Get count
  async count(filters = {}) {
    const result = await this.find(filters);
    return result.length;
  }
};