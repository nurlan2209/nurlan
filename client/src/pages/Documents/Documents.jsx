import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaPlus, FaEye, FaEdit, FaTrash, FaQrcode, FaSearch, 
         FaFilter, FaCalendarAlt, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showQR, setShowQR] = useState({ show: false, documentId: null });
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  // Новое состояние для модального окна просмотра
  const [viewModal, setViewModal] = useState({ show: false, document: null });
  
  // Используем import.meta.env для получения переменной среды
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Функция для получения токена
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Загрузка документов пользователя
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        if (!token) {
          setError('Авторизация қажет. Қайта кіруіңізді сұраймыз.');
          return;
        }
        
        const response = await axios.get(`${BASE_URL}/api/documents`, {
          headers: { 
            'x-auth-token': token
          }
        });
        
        setDocuments(response.data);
        setError('');
      } catch (err) {
        console.error('Құжаттарды жүктеу кезінде қате орын алды:', err);
        setError('Құжаттарды жүктеу кезінде қате орын алды. Қайталап көріңіз.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [BASE_URL]);

  // Функция для получения QR-кода
  const fetchQrCode = async (documentId) => {
    try {
      setQrLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Авторизация қажет. Қайта кіруіңізді сұраймыз.');
        return;
      }
      
      const response = await axios.get(`${BASE_URL}/api/documents/${documentId}/qrcode`, {
        headers: { 
          'x-auth-token': token
        }
      });
      
      setQrCode(response.data.qrCode);
    } catch (err) {
      console.error('QR кодын жүктеу кезінде қате орын алды:', err);
      setError('QR кодын жүктеу кезінде қате орын алды');
    } finally {
      setQrLoading(false);
    }
  };

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

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Көрсетілмеген';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Фильтрация документов
  const filteredDocuments = documents.filter(doc => {
    // Поиск по названию и номеру
    const matchesSearch = 
      (doc.doc_name && doc.doc_name.toLowerCase().includes(search.toLowerCase())) || 
      (doc.doc_number && doc.doc_number.toLowerCase().includes(search.toLowerCase()));
    
    // Фильтрация по типу документа
    if (filter === 'all') {
      return matchesSearch;
    } else if (filter === 'expired') {
      return matchesSearch && isExpired(doc.expiry_date);
    } else if (filter === 'expiring-soon') {
      return matchesSearch && isExpiringSoon(doc.expiry_date);
    } else if (filter === 'valid') {
      return matchesSearch && !isExpired(doc.expiry_date) && !isExpiringSoon(doc.expiry_date);
    }
    
    return matchesSearch;
  });

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

  // Показать QR код
  const handleShowQR = (docId) => {
    setShowQR({ show: true, documentId: docId });
    setQrCode(null); // Сбросить предыдущий QR-код
    fetchQrCode(docId); // Получить новый QR-код
  };

  // Закрыть QR код
  const closeQR = () => {
    setShowQR({ show: false, documentId: null });
    setQrCode(null);
  };

  // Новая функция: открыть модальное окно просмотра документа
  const openViewModal = (doc) => {
    setViewModal({ show: true, document: doc });
  };

  // Новая функция: закрыть модальное окно просмотра документа
  const closeViewModal = () => {
    setViewModal({ show: false, document: null });
  };

  // Удаление документа
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      const token = getAuthToken();
      
      await axios.delete(`${BASE_URL}/api/documents/${documentToDelete.id}`, {
        headers: { 
          'x-auth-token': token 
        }
      });
      
      // Обновление списка документов
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
      // Показать уведомление об успешном удалении
      setNotification({
        show: true,
        message: 'Құжат сәтті жойылды',
        type: 'success'
      });
      
      // Скрыть уведомление через 3 секунды
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
      closeDeleteModal();
    } catch (err) {
      console.error('Құжатты жою кезінде қате орын алды:', err);
      setNotification({
        show: true,
        message: 'Құжатты жою кезінде қате орын алды',
        type: 'error'
      });
      closeDeleteModal();
    }
  };

  // Определение статуса документа для отображения
  const getDocumentStatus = (doc) => {
    if (isExpired(doc.expiry_date)) {
      return { className: 'expired', text: 'Мерзімі өткен' };
    } else if (isExpiringSoon(doc.expiry_date)) {
      return { className: 'expiring-soon', text: 'Мерзімі жақында бітеді' };
    } else if (doc.expiry_date) {
      return { className: 'valid', text: 'Жарамды' };
    }
    return null;
  };

  console.log("Документы:", documents); // Отладочная информация

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1 className="page-title">Менің құжаттарым</h1>
        <Link to="/documents/add" className="add-document-btn">
          <FaPlus /> Жаңа құжат қосу
        </Link>
      </div>

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'error' ? 
            <FaExclamationTriangle className="notification-icon" /> : 
            <FaInfoCircle className="notification-icon" />
          }
          {notification.message}
        </div>
      )}

      {error && (
        <div className="notification error">
          <FaExclamationTriangle className="notification-icon" /> 
          {error}
        </div>
      )}

      <div className="documents-toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Құжатты іздеу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
        
        <div className="documents-filter">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Барлық құжаттар</option>
            <option value="valid">Жарамды</option>
            <option value="expiring-soon">Мерзімі жақында бітетін</option>
            <option value="expired">Мерзімі өткен</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Құжаттар жүктелуде...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <FaIdCard className="empty-icon" />
          <h3>Құжаттар табылмады</h3>
          <p>
            {search || filter !== 'all' 
              ? 'Сіздің сұранысыңызға сәйкес келетін құжаттар табылмады.' 
              : 'Сіздің цифрлық әмияныңызда әлі құжаттар жоқ.'}
          </p>
          {!search && filter === 'all' && (
            <Link to="/documents/add" className="add-document-btn">
              <FaPlus /> Алғашқы құжатты қосу
            </Link>
          )}
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map(doc => {
            const status = getDocumentStatus(doc);
            
            return (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <div className="document-icon">
                    <FaIdCard />
                  </div>
                  <div className="document-info">
                    <h3 className="document-title">{doc.doc_name}</h3>
                    <p className="document-number">{doc.doc_type || 'Құжат'} №{doc.doc_number}</p>
                  </div>
                </div>
                
                <div className="document-details">
                  {doc.issue_date && (
                    <div className="document-detail">
                      <span className="detail-label">Берілген күні:</span>
                      <span className="detail-value">{formatDate(doc.issue_date)}</span>
                    </div>
                  )}
                  
                  {doc.expiry_date && (
                    <div className="document-detail">
                      <span className="detail-label">Жарамдылық мерзімі:</span>
                      <span className="detail-value">{formatDate(doc.expiry_date)}</span>
                    </div>
                  )}
                  
                  {status && (
                    <div className={`expiry-status ${status.className}`}>
                      {status.text}
                    </div>
                  )}
                </div>
                
                <div className="document-actions">
                  {/* Кнопка для просмотра документа (изменено с Link на button) */}
                  <button 
                    className="document-action view" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewModal(doc);
                    }}
                    title="Көру"
                  >
                    <FaEye />
                  </button>
                  
                  {/* Ссылка на редактирование документа */}
                  <Link 
                    to={`/documents/edit/${doc.id}`}
                    className="document-action edit" 
                    title="Өңдеу"
                  >
                    <FaEdit />
                  </Link>
                  
                  {/* Кнопка удаления */}
                  <button 
                    className="document-action delete" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(doc);
                    }}
                    title="Жою"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

            {/* Модальное окно для подтверждения удаления */}
            {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Құжатты жою</h3>
            </div>
            <div className="modal-body">
              <p>Сіз <strong>{documentToDelete?.doc_name}</strong> құжатын жойғыңыз келе ме?</p>
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

      {/* Модальное окно для QR-кода */}
      {showQR.show && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>QR Код</h3>
              <button className="modal-close" onClick={closeQR}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="qr-code-container">
                {qrLoading ? (
                  <div>QR код жүктелуде...</div>
                ) : qrCode ? (
                  <img 
                    src={qrCode} 
                    alt="QR Код" 
                    className="qr-code-image"
                    style={{maxWidth: '200px', margin: '0 auto'}}
                  />
                ) : (
                  <div>QR кодты жүктеу кезінде қате орын алды</div>
                )}
                <p className="qr-code-info">
                  Бұл QR кодын құжатты тексеру үшін сканерлеуге болады.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeQR}>
                Жабу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Новое модальное окно для просмотра документа */}
      {viewModal.show && viewModal.document && (
        <div className="modal-overlay">
          <div className="modal-container document-view-modal">
            <div className="modal-header">
              <h3>Құжат мәліметтері</h3>
              <button className="modal-close" onClick={closeViewModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="document-view-content">
                <div className="document-view-header">
                  <div className="document-icon large">
                    <FaIdCard />
                  </div>
                  <div>
                    <h2 className="document-title">{viewModal.document.doc_name}</h2>
                    <p className="document-type-number">
                      {viewModal.document.doc_type || 'Құжат'} №{viewModal.document.doc_number}
                    </p>
                    
                    {/* Статус документа */}
                    {getDocumentStatus(viewModal.document) && (
                      <div className={`document-status-badge ${getDocumentStatus(viewModal.document).className}`}>
                        {getDocumentStatus(viewModal.document).text}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="document-view-details">
                  <div className="detail-row">
                    <div className="detail-label">Құжат түрі:</div>
                    <div className="detail-value">{viewModal.document.doc_type || 'Көрсетілмеген'}</div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-label">Құжат нөмірі:</div>
                    <div className="detail-value">{viewModal.document.doc_number}</div>
                  </div>
                  
                  {viewModal.document.issue_date && (
                    <div className="detail-row">
                      <div className="detail-label">Берілген күні:</div>
                      <div className="detail-value">{formatDate(viewModal.document.issue_date)}</div>
                    </div>
                  )}
                  
                  {viewModal.document.expiry_date && (
                    <div className="detail-row">
                      <div className="detail-label">Жарамдылық мерзімі:</div>
                      <div className="detail-value">{formatDate(viewModal.document.expiry_date)}</div>
                    </div>
                  )}
                  
                  {viewModal.document.issuing_authority && (
                    <div className="detail-row">
                      <div className="detail-label">Берген орган:</div>
                      <div className="detail-value">{viewModal.document.issuing_authority}</div>
                    </div>
                  )}
                  
                  {viewModal.document.additional_info && (
                    <div className="detail-row">
                      <div className="detail-label">Қосымша ақпарат:</div>
                      <div className="detail-value">{viewModal.document.additional_info}</div>
                    </div>
                  )}
                </div>
                
                {/* Если есть изображение документа */}
                {viewModal.document.document_image && (
                  <div className="document-image-container">
                    <h4>Құжат суреті</h4>
                    <img 
                      src={viewModal.document.document_image} 
                      alt="Құжат суреті" 
                      className="document-image"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeViewModal}>
                Жабу
              </button>
              <Link 
                to={`/documents/edit/${viewModal.document.id}`}
                className="btn btn-primary"
              >
                <FaEdit /> Өңдеу
              </Link>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  closeViewModal();
                  handleShowQR(viewModal.document.id);
                }}
              >
                <FaQrcode /> QR-код
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;

