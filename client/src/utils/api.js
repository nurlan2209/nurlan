import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Токенді жүктеу, егер ол бар болса
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['x-auth-token'] = token;
}

// Ошибка статускодтарын өңдеу
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 статус коды бар жағдайда токенді жою
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);