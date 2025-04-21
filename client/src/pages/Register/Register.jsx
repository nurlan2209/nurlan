import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../../utils/Notification'; // Импортируем компонент уведомлений
import './Register.css';

const Register = () => {
  const { register, isAuthenticated, error: authError, setError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    iin: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState({ message: '', field: null });

  // Хабарламалар үшін күй
  const [notification, setNotification] = useState({
    message: '',
    type: 'error',
    isVisible: false
  });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    
    setError(null);
    setFormError({ message: '', field: null });
  }, [isAuthenticated, navigate, setError]);

  // Қателерді өңдеу және хабарламаларды қосу
  useEffect(() => {
    if (authError) {
      if (typeof authError === 'object' && authError.message) {
        setFormError({
          message: authError.message,
          field: authError.field
        });

        // Хабарламаны көрсету
        setNotification({
          message: authError.message,
          type: 'error',
          isVisible: true
        });
      } else {
        setFormError({
          message: authError,
          field: null
        });

        // Хабарламаны көрсету
        setNotification({
          message: authError,
          type: 'error',
          isVisible: true
        });
      }
    }
  }, [authError]);

  // Хабарламаны жабу өңдегіші
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
    if (formError.field === e.target.name) {
      setFormError({ message: '', field: null });
    }
  };

  // Парольдің көрінуін ауыстыру
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Нысанды жіберер алдында тексеру
  const validateForm = () => {
    // Міндетті өрістерді толтыруды тексеру
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      setFormError({
        message: 'Барлық міндетті өрістерді толтырыңыз',
        field: null
      });
      return false;
    }
    
    // Электрондық поштаны тексеру
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError({
        message: 'Жарамды email енгізіңіз',
        field: 'email'
      });
      return false;
    }
    
    // Парольдерді тексеру
    if (formData.password !== formData.confirmPassword) {
      setFormError({
        message: 'Парольдер сәйкес келмейді',
        field: 'confirmPassword'
      });
      return false;
    }
    
    // Парольдің ұзындығын тексеру
    if (formData.password.length < 6) {
      setFormError({
        message: 'Пароль кемінде 6 таңбадан тұруы керек',
        field: 'password'
      });
      return false;
    }
    
    // ЖСН толтырылса тексеру
    if (formData.iin && formData.iin.length !== 12) {
      setFormError({
        message: 'ЖСН 12 сандан тұруы керек',
        field: 'iin'
      });
      return false;
    }

    // ЖСН-ні сандық мәнге тексеру
    if (formData.iin && !/^\d+$/.test(formData.iin)) {
      setFormError({
        message: 'ЖСН тек сандардан тұруы керек',
        field: 'iin'
      });
      return false;
    }
    
    return true;
  };

  // Нысанды жіберуді өңдеу
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setFormError({ message: '', field: null });
      
      // Жіберу үшін деректерді қалыптастыру
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        iin: formData.iin ? formData.iin.trim() : ''
      };
      
      console.log('Тіркеу деректерін жіберу:', userData);
      
      // Тіркелуге әрекет
      const result = await register(userData);
      
      // Тіркелудің сәттілігін тексеру
      if (result && result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Тіркеуді жіберу қатесі:', error);
      // Қате useEffect арқылы authError арқылы өңделеді
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Хабарламалар компоненті */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
        duration={5000}
        position="top-right"
      />

      <div className="register-form-container">
        <div className="register-header">
          <h2>Тіркелу</h2>
          <p>Digital ID Wallet платформасына тіркеліңіз</p>
        </div>

        {formError.message && !formError.field && (
          <div className="alert alert-error">
            {formError.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Пайдаланушы аты *</label>
            <input
              type="text"
              id="username"
              name="username"
              className={`form-control ${formError.field === 'username' ? 'is-invalid' : ''}`}
              value={formData.username}
              onChange={handleChange}
              placeholder="Пайдаланушы атыңызды енгізіңіз"
              disabled={loading}
              required
            />
            {formError.field === 'username' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
            <small className="form-text text-muted">Бірегей болуы керек</small>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${formError.field === 'email' ? 'is-invalid' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Email-ды енгізіңіз"
              disabled={loading}
              required
            />
            {formError.field === 'email' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
            <small className="form-text text-muted">Бірегей болуы керек</small>
          </div>

          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Аты-жөні *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              className={`form-control ${formError.field === 'full_name' ? 'is-invalid' : ''}`}
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Аты-жөніңізді енгізіңіз"
              disabled={loading}
              required
            />
            {formError.field === 'full_name' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="iin" className="form-label">ЖСН</label>
            <input
              type="text"
              id="iin"
              name="iin"
              className={`form-control ${formError.field === 'iin' ? 'is-invalid' : ''}`}
              value={formData.iin}
              onChange={handleChange}
              placeholder="12 сандық ЖСН-ды енгізіңіз"
              disabled={loading}
              maxLength={12}
              pattern="\d*"
            />
            {formError.field === 'iin' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
            <small className="form-text text-muted">Міндетті емес, бірақ бірегей болуы керек</small>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Парольді *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={`form-control ${formError.field === 'password' ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Парольді енгізіңіз"
                disabled={loading}
                required
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
            {formError.field === 'password' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
            <small className="form-text text-muted">Кемінде 6 таңба</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Парольді растау *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${formError.field === 'confirmPassword' ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Парольді қайталаңыз"
                disabled={loading}
                required
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
            {formError.field === 'confirmPassword' && (
              <div className="invalid-feedback">
                {formError.message}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary register-btn" disabled={loading}>
            {loading ? 'Жүктелуде...' : <><FaUserPlus /> Тіркелу</>}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Тіркелгіңіз бар ма? <Link to="/login">Кіру</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;