import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaIdCard, FaCalendarAlt, FaEdit, FaTrash, FaQrcode, FaDownload, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import './DocumentView.css';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Используем import.meta.env для получения переменной среды
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Функция для получения токена
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Загрузка информации о документе
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(false);
      }
      catch (err) {
        console.error('Документды жүктеу кезінде қате орын алды:', err);
        setError('Документды жүктеу кезінде қате орын алды. Қайталап көріңіз.');
      }
    };

    fetchDocument();
  }, [id, BASE_URL, navigate]);

  // Получение QR-кода для документа
  const fetchQrCode = async (documentId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/documents/${documentId}/qrcode`, {
        headers: { 'x-auth-token': token }
      });
      setQrCode(response.data.qrCode);
    } catch (err) {
      console.error('QR кодын жүктеу кезінде қате орын алды:', err);
      setError('QR кодын жүктеу кезінде қате орын алды');
    }
  };

  // Проверка срока действия документа
  const getExpiryStatus = () => {
    if (!document || !document.expiry_date) return null;
    
    const today = new Date();
    const expiry = new Date(document.expiry_date);
    
    if (expiry < today) {
      return { status: 'expired', text: 'Мерзімі өткен' };
    }
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      return { status: 'expiring-soon', text: `${diffDays} күннен кейін мерзімі бітеді` };
    }
    
    return { status: 'valid', text: 'Жарамды' };
  };

  // Открытие модального окна для подтверждения удаления
  const openDeleteModal = () => {
    setIsModalOpen(true);
  };

  // Закрытие модального окна
  const closeDeleteModal = () => {
    setIsModalOpen(false);
  };

  // Удаление документа
  const handleDeleteDocument = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Авторизация қажет. Қайта кіруіңізді сұраймыз.');
        navigate('/login');
        return;
      }
      
      await axios.delete(`${BASE_URL}/api/documents/${id}`, {
        headers: { 
          'x-auth-token': token 
        }
      });
      
      navigate('/documents');
    } catch (err) {
      console.error('Құжатты жою кезінде қате орын алды:', err);
      setError('Құжатты жою кезінде қате орын алды. Қайталап көріңіз.');
      closeDeleteModal();
    }
  };

  const expiryStatus = document ? getExpiryStatus() : null;

  return (
    <div className="document-view-container">
      <div className="document-view-header">
        <Link to="/documents" className="back-link">
          <FaArrowLeft /> Барлық құжаттар
        </Link>
        
        {!loading && !error && document && (
          <div className="document-view-actions">
            <Link to={`/documents/edit/${id}`} className="btn btn-primary">
              <FaEdit /> Өңдеу
            </Link>
            <button className="btn btn-danger" onClick={openDeleteModal}>
              <FaTrash /> Жою
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="document-form-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message">Құжат жүктелуде...</div>
      ) : document ? (
        <div className="document-card">
          <div className="document-header">
            <div className="document-type-badge">{document.doc_type || 'Құжат'}</div>
            <h2 className="document-title">{document.doc_name}</h2>
            {expiryStatus && (
              <div className={`expiry-status ${expiryStatus.status}`}>
                {expiryStatus.text}
              </div>
            )}
          </div>
          
          <div className="document-details">
            <div className="detail-item">
              <div className="detail-label">Құжат нөмірі</div>
              <div className="detail-value">{document.doc_number}</div>
            </div>
            
            <div className="detail-item">
              <div className="detail-label">
                <FaCalendarAlt /> Берілген күні
              </div>
              <div className="detail-value">
                {document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'Көрсетілмеген'}
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-label">
                <FaCalendarAlt /> Жарамдылық мерзімі
              </div>
              <div className="detail-value">
                {document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : 'Көрсетілмеген'}
              </div>
            </div>
            
            {document.doc_data && (
              <div className="detail-item">
                <div className="detail-label">Қосымша ақпарат</div>
                <div className="detail-value">{document.doc_data}</div>
              </div>
            )}
          </div>
          
          {document.file_path && (
            <div className="document-file">
              <h3>Құжат файлы</h3>
              <a 
                href={`${BASE_URL}${document.file_path}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary file-btn"
              >
                <FaDownload /> Жүктеу
              </a>
            </div>
          )}
          
          <div className="document-qr">
            <h3>QR коды</h3>
            <button 
              className="btn btn-primary qr-btn"
              onClick={fetchQrCode}
              disabled={showQr}
            >
              <FaQrcode /> {showQr ? 'QR код көрсетілді' : 'QR кодын жасау'}
            </button>
            
            {showQr && qrCode && (
              <div className="qr-code-container">
                <img src={qrCode} alt="QR Код" className="qr-code-image" />
                <p className="qr-code-info">
                  Бұл QR кодын құжатты тексеру үшін сканерлеуге болады.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="not-found">
          <FaIdCard className="not-found-icon" />
          <h2>Құжат табылмады</h2>
          <p>Сұралған құжат табылмады немесе сізге қол жетімді емес.</p>
          <Link to="/documents" className="btn btn-primary">
            Барлық құжаттарға оралу
          </Link>
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
              <p>Сіз <strong>{document?.doc_name}</strong> құжатын жойғыңыз келе ме?</p>
              <p>Бұл әрекетті кері қайтаруға болмайды.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeDeleteModal}>
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

export default DocumentView;