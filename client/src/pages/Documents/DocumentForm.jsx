// client/src/pages/Documents/DocumentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './DocumentForm.css';

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    doc_type: '',
    doc_number: '',
    doc_name: '',
    issue_date: '',
    expiry_date: '',
    doc_data: '',
    file: null
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Используем import.meta.env для получения переменной среды
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Предопределенные типы документов
  const documentTypes = [
    'Жеке куәлік',
    'Студенттік билет',
    'Вакцинация паспорты',
    'Медициналық сақтандыру',
    'Басқа'
  ];

  // Функция для получения токена
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Проверка авторизации
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Авторизация қажет. Қайта кіруіңізді сұраймыз.');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditMode) {
      const fetchDocument = async () => {
        try {
          setLoading(true);
          const token = getAuthToken();
          
          const response = await axios.get(`${BASE_URL}/api/documents/${id}`, {
            headers: { 
              'x-auth-token': token 
            }
          });
          
          const { doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data } = response.data;
          
          // Форматирование дат для input type="date"
          const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };
          
          setFormData({
            doc_type,
            doc_number,
            doc_name,
            issue_date: formatDate(issue_date),
            expiry_date: formatDate(expiry_date),
            doc_data,
            file: null
          });
          
          setLoading(false);
        } catch (err) {
          console.error('Құжатты жүктеу кезінде қате орын алды:', err);
          if (err.response && err.response.status === 401) {
            setError('Авторизация мерзімі аяқталды. Қайта кіруіңізді сұраймыз.');
            navigate('/login');
          } else {
            setError('Құжатты жүктеу кезінде қате орын алды');
          }
          setLoading(false);
        }
      };
      fetchDocument();
    }
  }, [id, isEditMode, BASE_URL, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file') {
      const file = files ? files[0] : null;
      setFormData(prev => ({
        ...prev,
        file
      }));
      
      // Создание URL для предварительного просмотра изображения
      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = getAuthToken();
    if (!token) {
      setError('Авторизация мерзімі аяқталды. Қайта кіруіңізді сұраймыз.');
      navigate('/login');
      return;
    }

    const formDataToSubmit = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSubmit.append(key, formData[key]);
      }
    });

    try {
      const url = isEditMode 
        ? `${BASE_URL}/api/documents/${id}` 
        : `${BASE_URL}/api/documents`;
      
      const method = isEditMode ? 'put' : 'post';
      
      await axios[method](url, formDataToSubmit, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token // Важно: используйте x-auth-token вместо Authorization: Bearer
        }
      });

      navigate('/documents');
    } catch (err) {
      console.error('Құжатты сақтау кезінде қате орын алды:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Авторизация мерзімі аяқталды. Қайта кіруіңізді сұраймыз.');
        navigate('/login');
      } else {
        setError('Құжатты сақтау кезінде қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-form-container">
      <h1 className="document-form-title">
        {isEditMode ? 'Құжатты өңдеу' : 'Жаңа құжат қосу'}
      </h1>
      
      {error && (
        <div className="document-form-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="document-form">
        <div className="document-form-group">
          <label htmlFor="doc_type" className="document-form-label">
            Құжат түрі
          </label>
          <select
            id="doc_type"
            name="doc_type"
            value={formData.doc_type}
            onChange={handleChange}
            required
            className="document-form-input"
          >
            <option value="">Құжат түрін таңдаңыз</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="document-form-group">
          <label htmlFor="doc_number" className="document-form-label">
            Құжат нөмірі
          </label>
          <input
            type="text"
            id="doc_number"
            name="doc_number"
            value={formData.doc_number}
            onChange={handleChange}
            required
            className="document-form-input"
            placeholder="Құжат нөмірін енгізіңіз"
          />
        </div>

        <div className="document-form-group">
          <label htmlFor="doc_name" className="document-form-label">
            Құжат атауы
          </label>
          <input
            type="text"
            id="doc_name"
            name="doc_name"
            value={formData.doc_name}
            onChange={handleChange}
            required
            className="document-form-input"
            placeholder="Құжат атауын енгізіңіз"
          />
        </div>

        <div className="document-form-group">
          <label htmlFor="issue_date" className="document-form-label">
            Берілген күні
          </label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            value={formData.issue_date}
            onChange={handleChange}
            className="document-form-input"
          />
        </div>

        <div className="document-form-group">
          <label htmlFor="expiry_date" className="document-form-label">
            Жарамдылық мерзімі
          </label>
          <input
            type="date"
            id="expiry_date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="document-form-input"
          />
        </div>

        <div className="document-form-group">
          <label htmlFor="doc_data" className="document-form-label">
            Қосымша ақпарат
          </label>
          <textarea
            id="doc_data"
            name="doc_data"
            value={formData.doc_data}
            onChange={handleChange}
            className="document-form-input document-form-textarea"
            rows="4"
            placeholder="Құжат туралы қосымша ақпаратты енгізіңіз"
          />
        </div>

        <div className="document-form-group">
          <label htmlFor="file" className="document-form-label">
            Құжат файлы
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            className="document-form-file-input"
          />
          
          {previewUrl && (
            <div className="file-preview">
              <img 
                src={previewUrl} 
                alt="Құжат алдын-ала көрінісі" 
                className="file-preview-image" 
              />
              <p className="file-preview-info">
                Файл: {formData.file?.name}
              </p>
            </div>
          )}
          
          {formData.file && !previewUrl && (
            <div className="file-preview">
              <p className="file-preview-info">
                Файл: {formData.file?.name}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="document-form-submit"
          disabled={loading}
        >
          {loading 
            ? 'Сақталуда...' 
            : isEditMode 
              ? 'Өзгерістерді сақтау' 
              : 'Құжатты сақтау'
          }
        </button>
      </form>
    </div>
  );
};

export default DocumentForm;