import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaIdCard, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import './PublicDocumentView.css';

const PublicDocumentView = () => {
  const { token } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Используем import.meta.env для получения переменной среды
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          setError('Қате URL. Құжат табылмады.');
          return;
        }
        
        const response = await axios.get(`${BASE_URL}/api/documents/public/${token}`);
        setDocument(response.data);
        setError('');
      } catch (err) {
        console.error('Құжатты жүктеу кезінде қате орын алды:', err);
        setError('Құжатты жүктеу кезінде қате орын алды немесе құжат табылмады.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [BASE_URL, token]);

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

  return (
    <div className="public-document-container">
      {loading ? (
        <div className="loading-spinner">Құжат жүктелуде...</div>
      ) : error ? (
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Қате орын алды</h3>
          <p>{error}</p>
        </div>
      ) : document ? (
        <div className="public-document-card">
          <div className="public-document-header">
            <div className="verification-badge">
              <span className="verification-text">Расталған құжат</span>
            </div>
            <h2 className="public-document-title">Құжат мәліметтері</h2>
          </div>
          
          {/* Фото владельца */}
          {document.owner_photo && (
            <div className="owner-photo-section">
              <div className="owner-photo-wrapper">
                <img 
                  src={document.owner_photo} 
                  alt="Иесінің фотосы" 
                  className="owner-photo"
                />
              </div>
              <h3 className="owner-name">{document.owner_name || 'Құжат иесі'}</h3>
            </div>
          )}
          
          <div className="public-document-content">
            <div className="document-view-header">
              <div className="document-icon large">
                <FaIdCard />
              </div>
              <div>
                <h3 className="document-title">{document.doc_name}</h3>
                <p className="document-type-number">
                  {document.doc_type || 'Құжат'} №{document.doc_number}
                </p>
                
                {/* Статус документа */}
                {getDocumentStatus(document) && (
                  <div className={`document-status-badge ${getDocumentStatus(document).className}`}>
                    {getDocumentStatus(document).text}
                  </div>
                )}
              </div>
            </div>
            
            <div className="document-view-details">
              <div className="detail-row">
                <div className="detail-label">Құжат түрі:</div>
                <div className="detail-value">{document.doc_type || 'Көрсетілмеген'}</div>
              </div>
              
              <div className="detail-row">
                <div className="detail-label">Құжат нөмірі:</div>
                <div className="detail-value">{document.doc_number}</div>
              </div>
              
              {document.issue_date && (
                <div className="detail-row">
                  <div className="detail-label">Берілген күні:</div>
                  <div className="detail-value">{formatDate(document.issue_date)}</div>
                </div>
              )}
              
              {document.expiry_date && (
                <div className="detail-row">
                  <div className="detail-label">Жарамдылық мерзімі:</div>
                  <div className="detail-value">{formatDate(document.expiry_date)}</div>
                </div>
              )}
              
              {document.issuing_authority && (
                <div className="detail-row">
                  <div className="detail-label">Берген орган:</div>
                  <div className="detail-value">{document.issuing_authority}</div>
                </div>
              )}
            </div>
            
            {/* Если есть изображение документа */}
            {document.document_image && (
              <div className="document-image-container">
                <h4>Құжат суреті</h4>
                <img 
                  src={document.document_image} 
                  alt="Құжат суреті" 
                  className="document-image"
                />
              </div>
            )}
            
            <div className="verification-info">
              <p>Бұл құжат электрондық түрде расталған және жарамды.</p>
              <p className="verification-date">Тексерілген күні: {formatDate(new Date())}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Құжат табылмады</h3>
          <p>Сұралған құжат табылмады немесе қол жетімді емес.</p>
        </div>
      )}
    </div>
  );
};

export default PublicDocumentView;
