import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaIdCard, FaChartBar } from 'react-icons/fa';
import { api } from '../../utils/api';
import './Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    docTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка статистики
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/admin/stats');
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error('Статистиканы жүктеу кезінде қате орын алды:', err);
        setError('Статистиканы жүктеу кезінде қате орын алды. Қайталап көріңіз.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1 className="page-title">Әкімші панелі</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="admin-dashboard-content">
        {loading ? (
          <div className="loading-message">Деректер жүктелуде...</div>
        ) : (
          <>
            <div className="stats-cards">
              <div className="stats-card">
                <div className="stats-icon">
                  <FaUsers />
                </div>
                <div className="stats-info">
                  <h3>Пайдаланушылар</h3>
                  <div className="stats-value">{stats.totalUsers}</div>
                  <Link to="/admin/users" className="stats-link">
                    Толығырақ көру
                  </Link>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <FaIdCard />
                </div>
                <div className="stats-info">
                  <h3>Құжаттар</h3>
                  <div className="stats-value">{stats.totalDocuments}</div>
                  <Link to="/admin/documents" className="stats-link">
                    Толығырақ көру
                  </Link>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h2 className="section-title">
                <FaChartBar /> Құжат түрлері бойынша статистика
              </h2>
              <div className="document-types-container">
                {stats.docTypes.length > 0 ? (
                  <div className="document-types-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Құжат түрі</th>
                          <th>Саны</th>
                          <th>Пайызы</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.docTypes.map((type) => (
                          <tr key={type.doc_type}>
                            <td>{type.doc_type || 'Белгісіз'}</td>
                            <td>{type.count}</td>
                            <td>
                              {stats.totalDocuments > 0
                                ? Math.round((type.count / stats.totalDocuments) * 100)
                                : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-message">Құжаттар әлі қосылмаған</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;