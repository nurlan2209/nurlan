import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Пайдаланушы деректерін жүктеу
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['x-auth-token'] = token;
        const res = await api.get('/api/users/me');
        setUser(res.data);
      } catch (error) {
        console.error('Пайдаланушыны жүктеу кезінде қате орын алды:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Кіру функциясы
  const login = async (credentials) => {
    try {
      setError(null);
      const res = await api.post('/api/auth/login', credentials);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      api.defaults.headers.common['x-auth-token'] = token;
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.error || 'Кіру кезінде қате орын алды');
      setError(errorMessage);
      throw error;
    }
  };

  // Тіркелу функциясы - простая версия без предварительной проверки
// Регистрация пользователя
const register = async (userData) => {
  try {
    setError(null);
    console.log('Отправка данных регистрации:', userData);
    const res = await api.post('/api/auth/register', userData);
    const { token, user } = res.data;
    
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    api.defaults.headers.common['x-auth-token'] = token;
    
    return { success: true, user };
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    
    // Подготовка сообщения об ошибке
    let errorMessage = 'Ошибка при регистрации';
    let errorField = null;
    
    if (error.response) {
      console.log('Полный ответ об ошибке:', error.response);
      console.log('Данные ответа об ошибке:', error.response.data);
      
      // Получаем сообщение об ошибке из ответа
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }
      
      // Получаем информацию о поле, вызвавшем ошибку
      if (error.response.data.field) {
        errorField = error.response.data.field;
      }
      
      // Анализ сообщения об ошибке для определения поля
      if (!errorField) {
        const message = errorMessage.toLowerCase();
        if (message.includes('пользователь') || message.includes('username')) {
          errorField = 'username';
        } else if (message.includes('email')) {
          errorField = 'email';
        } else if (message.includes('жсн') || message.includes('iin')) {
          errorField = 'iin';
        }
      }
      
      console.log('Установка ошибки:', { message: errorMessage, field: errorField });
      setError({ message: errorMessage, field: errorField });
    }
    
    return { success: false, message: errorMessage, field: errorField };
  }
};

  // Шығу функциясы
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['x-auth-token'];
  };

  // Пайдаланушы профилін жаңарту
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const res = await api.put('/api/users/me', userData);
      setUser(res.data);
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.error || 'Профильді жаңарту кезінде қате орын алды');
      setError(errorMessage);
      throw error;
    }
  };

  // Құпия сөзді өзгерту
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const res = await api.put('/api/users/me/password', passwordData);
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.error || 'Құпия сөзді өзгерту кезінде қате орын алды');
      setError(errorMessage);
      throw error;
    }
  };

  // Аутентификация күйін тексеру
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Әкімші болып табылатын-табылмайтынын тексеру
  const isAdmin = () => {
    return user?.is_admin === 1;
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated,
    isAdmin,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};