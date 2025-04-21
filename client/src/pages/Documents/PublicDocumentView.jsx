import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaIdCard, FaExclamationTriangle, FaCheck, FaCalendarAlt, FaShieldAlt, FaDownload } from 'react-icons/fa';
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
  const getDocumentStatus = () => {
    if (!document || !document.expiry_date) return null;
    
    const today = new Date();
    const expiry = new Date(document.expiry_date);
    
    if (expiry < today) {
      return { status: 'expired', text: 'Мерзімі өткен', icon: <FaExclamationTriangle /> };
    }
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      return { status: 'expiring-soon', text: `${diffDays} күннен кейін мерзімі бітеді`, icon: <FaExclamationTriangle /> };
    }
    
    return { status: 'valid', text: 'Жарамды', icon: <FaCheck /> };
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

  const documentStatus = document ? getDocumentStatus() : null;

  return (
    <div className="public-document-container">
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Құжат жүктелуде...</p>
        </div>
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
              <FaShieldAlt className="verification-icon" />
              <span className="verification-text">Расталған құжат</span>
            </div>
            <h2 className="public-document-title">Құжат мәліметтері</h2>
          </div>
          
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
                {documentStatus && (
                  <div className={`document-status-badge ${documentStatus.status}`}>
                    {documentStatus.icon} {documentStatus.text}
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
              
              {document.owner_name && (
                <div className="detail-row">
                  <div className="detail-label">Иесі:</div>
                  <div className="detail-value">{document.owner_name}</div>
                </div>
              )}
            </div>
            
            {document.file_path && (
              <div className="document-file-section">
                <h4>Құжат файлы</h4>
                <a 
                  href={`${BASE_URL}${document.file_path}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="document-file-link"
                >
                  <FaDownload /> Жүктеу
                </a>
              </div>
            )}

            <div className="verification-info">
              <div className="verification-seal">
                <FaShieldAlt className="seal-icon" />
              </div>
              <div className="verification-text-content">
                <p>Бұл құжат электрондық түрде расталған және жарамды.</p>
                <p className="verification-date">Тексерілген күні: {formatDate(new Date())}</p>
              </div>
            </div>

            <div className="back-to-app">
              <p>Цифрлық құжаттар әмиянына өтіңіз:</p>
              <Link to="/" className="app-button">
                <FaIdCard /> EduID Wallet қолданбасына өту
              </Link>
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