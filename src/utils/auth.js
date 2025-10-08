// Simple auth utilities for client-side token handling

export function getToken() {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch {
    // ignore storage errors
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


