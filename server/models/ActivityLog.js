import { getPool } from '../config/database.js';

export const ActivityLog = {
  // Log a new activity
  async logActivity(userId, type, data = {}) {
    const dbPool = getPool();
    if (!dbPool) return null;
    
    try {
      const result = await dbPool.query(`
        INSERT INTO activity_logs 
        (user_id, activity_type, activity_data)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, type, JSON.stringify(data)]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  },

  // Get user activities with pagination and filtering
  async getUserActivities(userId, { 
    page = 1, 
    limit = 10, 
    types = [],
    startDate,
    endDate
  } = {}) {
    const dbPool = getPool();
    if (!dbPool) return { activities: [], total: 0 };
    
    try {
      let query = 'FROM activity_logs WHERE user_id = $1';
      const queryParams = [userId];
      let paramIndex = 2;
      
      // Filter by activity types
      if (types.length > 0) {
        query += ` AND activity_type = ANY($${paramIndex++}::text[])`;
        queryParams.push(types);
      }
      
      // Filter by date range
      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}::timestamp`;
        queryParams.push(new Date(startDate));
      }
      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}::timestamp`;
        queryParams.push(new Date(endDate));
      }
      
      // Get total count
      const countResult = await dbPool.query(
        `SELECT COUNT(*) ${query}`,
        queryParams
      );
      
      const total = parseInt(countResult.rows[0].count, 10);
      
      // Get paginated results
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      queryParams.push(limit, (page - 1) * limit);
      
      const result = await dbPool.query(
        `SELECT * ${query}`,
        queryParams
      );
      
      return {
        activities: result.rows.map(row => ({
          id: row.id,
          type: row.activity_type,
          data: row.activity_data,
          timestamp: row.created_at
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting user activities:', error);
      return { activities: [], total: 0 };
    }
  }
};

// Create activity_logs table
export async function initializeActivityLogsTable() {
  const dbPool = getPool();
  if (!dbPool) return;
  
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);
    
    console.log('✅ Activity logs table initialized');
  } catch (error) {
    console.error('❌ Error initializing activity logs table:', error);
  }
}

// Initialize table when module is imported
initializeActivityLogsTable();