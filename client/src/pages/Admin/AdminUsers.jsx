import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserEdit, FaTrash, FaUserPlus, FaSearch } from 'react-icons/fa';
import { api } from '../../utils/api';
import './Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userFormData, setUserFormData] = useState({
    id: null,
    username: '',
    email: '',
    full_name: '',
    iin: '',
    password: '',
    is_admin: false
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/admin/users');
        setUsers(res.data);
        setError(null);
      } catch (err) {
        console.error('Пайдаланушыларды жүктеу кезінде қате орын алды:', err);
        setError('Пайдаланушыларды жүктеу кезінде қате орын алды. Қайталап көріңіз.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Фильтрация пользователей по поиску
  const filteredUsers = users.filter(
    user =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (user.iin && user.iin.includes(search))
  );

  // Открытие модального окна для подтверждения удаления
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  // Закрытие модального окна
  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setUserToDelete(null);
  };

  // Удаление пользователя
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/api/admin/users/${userToDelete.id}`);
      
      // Обновление списка пользователей
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      closeDeleteModal();
    } catch (err) {
      console.error('Пайдаланушыны жою кезінде қате орын алды:', err);
      setError('Пайдаланушыны жою кезінде қате орын алды. Қайталап көріңіз.');
      closeDeleteModal();
    }
  };

  // Открытие формы добавления/редактирования пользователя
  const openUserForm = (user = null) => {
    if (user) {
      // Режим редактирования
      setUserFormData({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        iin: user.iin || '',
        password: '',
        is_admin: user.is_admin === 1
      });
    } else {
      // Режим добавления
      setUserFormData({
        id: null,
        username: '',
        email: '',
        full_name: '',
        iin: '',
        password: '',
        is_admin: false
      });
    }
    
    setFormErrors({});
    setFormSuccess('');
    setShowUserForm(true);
  };

  // Закрытие формы пользователя
  const closeUserForm = () => {
    setShowUserForm(false);
    setUserFormData({
      id: null,
      username: '',
      email: '',
      full_name: '',
      iin: '',
      password: '',
      is_admin: false
    });
    setFormErrors({});
    setFormSuccess('');
  };

  // Обновление состояния формы
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Очистка ошибки поля при изменении
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!userFormData.username.trim()) {
      errors.username = 'Пайдаланушы атын енгізіңіз';
    }
    
    if (!userFormData.email.trim()) {
      errors.email = 'Email енгізіңіз';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userFormData.email)) {
        errors.email = 'Жарамды email енгізіңіз';
      }
    }
    
    if (!userFormData.full_name.trim()) {
      errors.full_name = 'Аты-жөнін енгізіңіз';
    }
    
    if (userFormData.iin && userFormData.iin.length !== 12) {
      errors.iin = 'ЖСН 12 сандардан тұруы керек';
    }
    
    if (!userFormData.id && !userFormData.password.trim()) {
      errors.password = 'Құпия сөзді енгізіңіз';
    } else if (userFormData.password && userFormData.password.length < 6) {
      errors.password = 'Құпия сөз кемінде 6 таңбадан тұруы керек';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Сохранение пользователя
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setFormSuccess('');
      
      const userData = {
        username: userFormData.username,
        email: userFormData.email,
        full_name: userFormData.full_name,
        iin: userFormData.iin,
        is_admin: userFormData.is_admin
      };
      
      // Добавляем пароль только если он был введен
      if (userFormData.password) {
        userData.password = userFormData.password;
      }
      
      let response;
      
      if (userFormData.id) {
        // Обновление существующего пользователя
        response = await api.put(`/api/admin/users/${userFormData.id}`, userData);
        
        // Обновление списка пользователей
        setUsers(users.map(user => (user.id === userFormData.id ? response.data : user)));
        
        setFormSuccess('Пайдаланушы сәтті жаңартылды');
      } else {
        // Создание нового пользователя
        response = await api.post('/api/admin/users', userData);
        
        // Добавление нового пользователя в список
        setUsers([...users, response.data]);
        
        setFormSuccess('Пайдаланушы сәтті қосылды');
        
        // Очистка формы после успешного добавления
        setUserFormData({
          id: null,
          username: '',
          email: '',
          full_name: '',
          iin: '',
          password: '',
          is_admin: false
        });
      }
    } catch (err) {
      console.error('Пайдаланушыны сақтау кезінде қате орын алды:', err);
      setFormErrors({ 
        general: err.response?.data?.message || 'Пайдаланушыны сақтау кезінде қате орын алды'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h1 className="page-title">Пайдаланушыларды басқару</h1>
        <button className="btn btn-primary" onClick={() => openUserForm()}>
          <FaUserPlus /> Жаңа пайдаланушы қосу
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="admin-content">
        <div className="admin-toolbar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Пайдаланушыны іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading && !showUserForm ? (
          <div className="loading-message">Пайдаланушылар жүктелуде...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-message">
            {search
              ? 'Сіздің сұранысыңызға сәйкес келетін пайдаланушылар табылмады'
              : 'Пайдаланушылар тізімі бос'}
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пайдаланушы аты</th>
                  <th>Email</th>
                  <th>Аты-жөні</th>
                  <th>ЖСН</th>
                  <th>Рөлі</th>
                  <th>Тіркелген күні</th>
                  <th>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.full_name}</td>
                    <td>{user.iin || '-'}</td>
                    <td>
                      <span className={`role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                        {user.is_admin ? 'Әкімші' : 'Пайдаланушы'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openUserForm(user)}
                          title="Өңдеу"
                        >
                          <FaUserEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => openDeleteModal(user)}
                          title="Жою"
                          disabled={user.is_admin === 1}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно для подтверждения удаления */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Пайдаланушыны жою</h3>
            </div>
            <div className="modal-body">
              <p>Сіз <strong>{userToDelete?.username}</strong> пайдаланушысын жойғыңыз келе ме?</p>
              <p>Бұл пайдаланушыға тиесілі барлық құжаттар да жойылады.</p>
              <p className="modal-warning">Бұл әрекетті кері қайтаруға болмайды.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeDeleteModal}>
                Болдырмау
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUser}>
                Жою
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Форма добавления/редактирования пользователя */}
      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal-container user-form-modal">
            <div className="modal-header">
              <h3>{userFormData.id ? 'Пайдаланушыны өңдеу' : 'Жаңа пайдаланушы қосу'}</h3>
            </div>
            <div className="modal-body">
              {formErrors.general && (
                <div className="alert alert-error">
                  {formErrors.general}
                </div>
              )}
              
              {formSuccess && (
                <div className="alert alert-success">
                  {formSuccess}
                </div>
              )}
              
              <form onSubmit={handleSaveUser} className="user-form">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Пайдаланушы аты *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                    value={userFormData.username}
                    onChange={handleFormChange}
                    disabled={loading}
                    required
                  />
                  {formErrors.username && <div className="invalid-feedback">{formErrors.username}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    value={userFormData.email}
                    onChange={handleFormChange}
                    disabled={loading}
                    required
                  />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="full_name" className="form-label">Аты-жөні *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className={`form-control ${formErrors.full_name ? 'is-invalid' : ''}`}
                    value={userFormData.full_name}
                    onChange={handleFormChange}
                    disabled={loading}
                    required
                  />
                  {formErrors.full_name && <div className="invalid-feedback">{formErrors.full_name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="iin" className="form-label">ЖСН</label>
                  <input
                    type="text"
                    id="iin"
                    name="iin"
                    className={`form-control ${formErrors.iin ? 'is-invalid' : ''}`}
                    value={userFormData.iin}
                    onChange={handleFormChange}
                    disabled={loading}
                    maxLength={12}
                  />
                  {formErrors.iin && <div className="invalid-feedback">{formErrors.iin}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    {userFormData.id ? 'Жаңа құпия сөз (өзгертпеу үшін бос қалдырыңыз)' : 'Құпия сөз *'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                    value={userFormData.password}
                    onChange={handleFormChange}
                    disabled={loading}
                    required={!userFormData.id}
                  />
                  {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                </div>
                
                <div className="form-group">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="is_admin"
                      name="is_admin"
                      checked={userFormData.is_admin}
                      onChange={handleFormChange}
                      disabled={loading}
                    />
                    <label htmlFor="is_admin" className="form-label">Әкімші құқықтарын беру</label>
                  </div>
                </div>
                
                <div className="user-form-actions">
                  <button type="button" className="btn btn-outline" onClick={closeUserForm} disabled={loading}>
                    Болдырмау
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сақталуда...' : 'Сақтау'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;