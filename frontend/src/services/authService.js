// src/services/authService.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const register = (email, password) => {
  return axios.post(`${BASE_URL}/auth/register`, { email, password });
};

export const login = (email, password) => {
  return axios.post(`${BASE_URL}/auth/login`, { email, password });
};

// src/utils/auth.js
export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const clearToken = () => {
  localStorage.removeItem('token');
};

export const getUserEmailFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email;
  } catch {
    return null;
  }
};
