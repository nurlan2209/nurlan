import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../../utils/Notification';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated, error: authError, setError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Хабарландыру күйі
  const [notification, setNotification] = useState({
    message: '',
    type: 'error',
    isVisible: false
  });

  useEffect(() => {
    // Пайдаланушы авторизацияланған болса, панельге бағыттау
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    
    // Компонент орнатылған кезде қателерді тазалау
    setError(null);
  }, [isAuthenticated, navigate, setError]);

  // Кіру қателерін өңдеу
  useEffect(() => {
    if (authError) {
      const errorMessage = typeof authError === 'object' 
        ? (authError.message || 'Кіру кезінде қате') 
        : authError;

      setFormError(errorMessage);

      // Хабарландыруды көрсету
      setNotification({
        message: errorMessage,
        type: 'error',
        isVisible: true
      });
    }
  }, [authError]);

  // Хабарландыруды жабу өңдеуші
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Нысан өрістерін өзгерту кезінде күйді жаңарту
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Енгізу кезінде қателерді тазалау
    if (formError) {
      setFormError('');
    }
  };

  // Парольдің көрінуін ауыстыру
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Нысанды жіберуді өңдеу
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Өрістердің толтырылуын тексеру
    if (!formData.username || !formData.password) {
      const errorMessage = 'Барлық өрістерді толтырыңыз';
      
      setFormError(errorMessage);
      setNotification({
        message: errorMessage,
        type: 'error',
        isVisible: true
      });
      return;
    }
    
    try {
      setLoading(true);
      setFormError('');
      
      // Кіруге әрекет
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      // Қателерді өңдеу authError арқылы жүргізіледі
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Хабарландыру компоненті */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
        duration={5000}
        position="top-right"
      />

      <div className="login-form-container">
        <div className="login-header">
          <h2>Жүйеге кіру</h2>
          <p>Digital ID Wallet платформасына қош келдіңіз</p>
        </div>

        {formError && (
          <div className="alert alert-error">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              placeholder="Пайдаланушы атын енгізіңіз"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="Парольді енгізіңіз"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Парольді жасыру" : "Парольді көрсету"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Жүктелуде...' : <><FaSignInAlt /> Кіру</>}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Тіркелгіңіз жоқ па? <Link to="/register">Тіркелу</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;