import React, { useState } from 'react';
import { FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './ChangePassword.css';

const ChangePassword = () => {
  const { changePassword,  setError } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Обновление состояния при изменении полей формы
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Переключение видимости пароля
  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Очистка предыдущих сообщений
    setFormError('');
    setSuccessMessage('');
    setError(null);
    
    // Проверка заполнения полей
    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setFormError('Барлық өрістерді толтырыңыз');
      return;
    }
    
    // Проверка совпадения паролей
    if (formData.new_password !== formData.confirm_password) {
      setFormError('Жаңа құпия сөздер сәйкес келмейді');
      return;
    }
    
    // Проверка длины пароля
    if (formData.new_password.length < 6) {
      setFormError('Жаңа құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }
    
    try {
      setLoading(true);
      
      // Отправка запроса на изменение пароля
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      // Очистка формы после успешного изменения
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setSuccessMessage('Құпия сөз сәтті өзгертілді');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <h1 className="page-title">Құпия сөзді өзгерту</h1>
      </div>

      <div className="change-password-content">
        <div className="change-password-card">
          <div className="card-header">
            <FaKey className="header-icon" />
            <h2>Құпия сөзді жаңарту</h2>
          </div>

          {formError && (
            <div className="alert alert-error">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="form-group">
              <label htmlFor="current_password" className="form-label">Ағымдағы құпия сөз</label>
              <div className="password-input-container">
                <input
                  type={showPassword.current ? "text" : "password"}
                  id="current_password"
                  name="current_password"
                  className="form-control"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="Ағымдағы құпия сөзді енгізіңіз"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                  aria-label={showPassword.current ? "Құпия сөзді жасыру" : "Құпия сөзді көрсету"}
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new_password" className="form-label">Жаңа құпия сөз</label>
              <div className="password-input-container">
                <input
                  type={showPassword.new ? "text" : "password"}
                  id="new_password"
                  name="new_password"
                  className="form-control"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="Жаңа құпия сөзді енгізіңіз"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                  aria-label={showPassword.new ? "Құпия сөзді жасыру" : "Құпия сөзді көрсету"}
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password" className="form-label">Жаңа құпия сөзді растау</label>
              <div className="password-input-container">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  className="form-control"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Жаңа құпия сөзді қайталаңыз"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                  aria-label={showPassword.confirm ? "Құпия сөзді жасыру" : "Құпия сөзді көрсету"}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Жүктелуде...' : 'Құпия сөзді өзгерту'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;