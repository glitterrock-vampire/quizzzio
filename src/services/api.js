const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    let data;
    
    try {
      data = await response.json();
    } catch (error) {
      data = { message: 'Invalid JSON response' };
    }

    if (!response.ok) {
      // If unauthorized, clear token and reload
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      const error = new Error(data.message || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => 
    request(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, data = {}, options = {}) => 
    request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
  put: (endpoint, data = {}, options = {}) => 
    request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
  delete: (endpoint, options = {}) => 
    request(endpoint, { ...options, method: 'DELETE' }),
    
  // File upload helper
  upload: (endpoint, formData, options = {}) => {
    const headers = {
      ...options.headers,
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    });
  },
};
