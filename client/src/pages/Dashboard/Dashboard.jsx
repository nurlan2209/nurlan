import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Загрузка документов пользователя
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/documents');
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

  // Группировка документов по типу
  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.doc_type || 'Басқа';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {});

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Сәлем, {user?.full_name || user?.username}!</h1>
        <Link to="/documents/add" className="btn btn-primary add-document-btn">
          <FaPlus /> Жаңа құжат қосу
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-message">Құжаттар жүктелуде...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FaIdCard className="empty-icon" />
            <h3>Құжаттар табылмады</h3>
            <p>Сіздің цифрлық әмияныңызда әлі құжаттар жоқ.</p>
            <Link to="/documents/add" className="btn btn-primary">
              Алғашқы құжатты қосу
            </Link>
          </div>
        ) : (
          <>
            <div className="documents-overview">
              <div className="overview-card">
                <h3>Құжаттар саны</h3>
                <p className="count">{documents.length}</p>
              </div>
              <div className="overview-card">
                <h3>Мерзімі өтетін құжаттар</h3>
                <p className="count warning">
                  {documents.filter(doc => isExpiringSoon(doc.expiry_date)).length}
                </p>
              </div>
              <div className="overview-card">
                <h3>Мерзімі өткен құжаттар</h3>
                <p className="count danger">
                  {documents.filter(doc => isExpired(doc.expiry_date)).length}
                </p>
              </div>
            </div>

            <h2 className="section-title">Менің құжаттарым</h2>

            <div className="documents-by-type">
              {Object.entries(groupedDocuments).map(([type, docs]) => (
                <div key={type} className="document-group">
                  <h3 className="group-title">{type}</h3>
                  <div className="documents-grid">
                    {docs.map(doc => (
                      <Link to={`/documents`} key={doc.id} className="document-card">
                        <div className="document-icon">
                          <FaIdCard />
                        </div>
                        <div className="document-info">
                          <h4 className="document-title">{doc.doc_name}</h4>
                          <span className="document-number">{doc.doc_number}</span>
                          
                          {doc.expiry_date && (
                            <div className={`document-expiry ${isExpired(doc.expiry_date) ? 'expired' : isExpiringSoon(doc.expiry_date) ? 'expiring-soon' : ''}`}>
                              {isExpired(doc.expiry_date) ? (
                                <><FaExclamationTriangle /> Мерзімі өткен</>
                              ) : isExpiringSoon(doc.expiry_date) ? (
                                <><FaExclamationTriangle /> Мерзімі жақында бітеді</>
                              ) : (
                                <>Мерзімі: {new Date(doc.expiry_date).toLocaleDateString()}</>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;