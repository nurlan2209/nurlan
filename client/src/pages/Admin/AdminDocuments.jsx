import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaEye, FaTrash, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import { api } from '../../utils/api';
import './Admin.css';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Загрузка документов
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/admin/documents');
        setDocuments(res.data);
        setError(null);
      } catch (err) {
        console.error('Құжаттарды жүктеу кезінде қате орын алды:', err);
        setError('Құжаттарды жүктеу кезінде қате орын алды. Қайталап көріңіз.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Получение уникальных типов документов для фильтрации
  const docTypes = ['all', ...new Set(documents.map(doc => doc.doc_type || 'Басқа'))];

  // Фильтрация документов
  const filteredDocuments = documents.filter(doc => {
    // Поиск по названию, номеру, имени пользователя
    const matchesSearch = 
      doc.doc_name.toLowerCase().includes(search.toLowerCase()) || 
      doc.doc_number.toLowerCase().includes(search.toLowerCase()) ||
      doc.username.toLowerCase().includes(search.toLowerCase()) ||
      doc.full_name.toLowerCase().includes(search.toLowerCase());
    
    // Фильтрация по типу
    if (filter === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && doc.doc_type === filter;
    }
  });

  // Проверка срока действия документа
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30; // Срок истекает в течение 30 дней
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    return expiry < today;
  };

  // Открытие модального окна для подтверждения удаления
  const openDeleteModal = (doc) => {
    setDocumentToDelete(doc);
    setIsModalOpen(true);
  };

  // Закрытие модального окна
  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setDocumentToDelete(null);
  };

  // Удаление документа
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await api.delete(`/api/documents/${documentToDelete.id}`);
      
      // Обновление списка документов
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
      closeDeleteModal();
    } catch (err) {
      console.error('Құжатты жою кезінде қате орын алды:', err);
      setError('Құжатты жою кезінде қате орын алды. Қайталап көріңіз.');
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-documents-container">
      <div className="admin-header">
        <h1 className="page-title">Құжаттарды басқару</h1>
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
              placeholder="Құжатты іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Барлық құжаттар</option>
              {docTypes.filter(type => type !== 'all').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">Құжаттар жүктелуде...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-message">
            {search || filter !== 'all'
              ? 'Сіздің сұранысыңызға сәйкес келетін құжаттар табылмады'
              : 'Құжаттар тізімі бос'}
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пайдаланушы</th>
                  <th>Құжат түрі</th>
                  <th>Құжат атауы</th>
                  <th>Нөмірі</th>
                  <th>Берілген күні</th>
                  <th>Жарамдылық мерзімі</th>
                  <th>Файл</th>
                  <th>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className={
                    isExpired(doc.expiry_date) 
                      ? 'expired-document' 
                      : isExpiringSoon(doc.expiry_date) 
                        ? 'expiring-document' 
                        : ''
                  }>
                    <td>{doc.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="username">{doc.username}</div>
                        <div className="full-name">{doc.full_name}</div>
                      </div>
                    </td>
                    <td>{doc.doc_type || 'Басқа'}</td>
                    <td>{doc.doc_name}</td>
                    <td>{doc.doc_number}</td>
                    <td>{doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '-'}</td>
                    <td className="expiry-cell">
                      {doc.expiry_date ? (
                        <>
                          {new Date(doc.expiry_date).toLocaleDateString()}
                          {isExpired(doc.expiry_date) && (
                            <span className="status-badge expired">Мерзімі өткен</span>
                          )}
                          {isExpiringSoon(doc.expiry_date) && (
                            <span className="status-badge expiring">Мерзімі бітеді</span>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td>
                      {doc.file_path ? (
                        <a 
                          href={`${api.defaults.baseURL}${doc.file_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link"
                          title="Файлды ашу"
                        >
                          <FaDownload />
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/documents/${doc.id}`} className="action-btn view-btn" title="Көру">
                          <FaEye />
                        </Link>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => openDeleteModal(doc)}
                          title="Жою"
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
              <h3>Құжатты жою</h3>
            </div>
            <div className="modal-body">
              <p>Сіз <strong>{documentToDelete?.doc_name}</strong> құжатын жойғыңыз келе ме?</p>
              <p>Пайдаланушы: <strong>{documentToDelete?.username}</strong> ({documentToDelete?.full_name})</p>
              <p className="modal-warning">Бұл әрекетті кері қайтаруға болмайды.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeDeleteModal}>
                Болдырмау
              </button>
              <button className="btn btn-danger" onClick={handleDeleteDocument}>
                Жою
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;