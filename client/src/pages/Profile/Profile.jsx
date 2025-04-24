import React, { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaSave } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile,  setError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || ''
      });
    }
    
    // Очистить сообщения при монтировании
    setError(null);
    setFormError('');
    setSuccessMessage('');
  }, [user, setError]);

  // Обновление состояния при изменении полей формы
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Включение режима редактирования
  const handleEdit = () => {
    setIsEditing(true);
    setFormError('');
    setSuccessMessage('');
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка заполнения полей
    if (!formData.email || !formData.full_name) {
      setFormError('Барлық міндетті өрістерді толтырыңыз');
      return;
    }
    
    // Проверка электронной почты
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Жарамды email енгізіңіз');
      return;
    }
    
    try {
      setLoading(true);
      setFormError('');
      setSuccessMessage('');
      
      // Отправка запроса на обновление профиля
      await updateProfile(formData);
      
      setIsEditing(false);
      setSuccessMessage('Профиль сәтті жаңартылды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="page-title">Менің профилім</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-card-header">
            <FaUser className="profile-icon" />
            <h2>Жеке деректер</h2>
            {!isEditing && (
              <button onClick={handleEdit} className="btn btn-outline edit-profile-btn">
                <FaEdit /> Өңдеу
              </button>
            )}
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

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-info">
              <div className="info-group">
                <label>Пайдаланушы аты:</label>
                <span>{user?.username}</span>
              </div>

              <div className="info-group">
                <label>ЖСН:</label>
                <span>{user?.iin || 'Көрсетілмеген'}</span>
              </div>

              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Аты-жөні:</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading || !isEditing}
                    required
                  />
                ) : (
                  <span>{formData.full_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email:</label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading || !isEditing}
                    required
                  />
                ) : (
                  <span>{formData.email}</span>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="profile-actions">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Болдырмау
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Жүктелуде...' : <><FaSave /> Сақтау</>}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;