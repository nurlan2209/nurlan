import React from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaQrcode, FaLock, FaUserPlus, FaExchangeAlt, FaMobileAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Барлық маңызды құжаттарыңыз бір жерде
            </h1>
            <p className="hero-description">
              Digital ID Wallet - сіздің жеке құжаттарыңызды цифрлық форматта сақтауға және қолдануға арналған қауіпсіз платформа
            </p>
            {isAuthenticated() ? (
              <Link to="/dashboard" className="btn btn-primary hero-btn">
                Менің құжаттарым
              </Link>
            ) : (
              <div className="hero-actions">
              </div>
            )}
          </div>
          <div className="hero-image">
            <img src="/images/hero-image.svg" alt="Digital ID Wallet" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Платформа мүмкіндіктері</h2>
          <p className="section-description">
            Digital ID Wallet сіздің құжаттарыңызды сақтау мен пайдалануды жеңілдетеді
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaIdCard />
              </div>
              <h3>Цифрлық құжаттар</h3>
              <p>Жеке куәлік, студенттік билет, вакцинация паспорты және басқа құжаттарды сандық түрде сақтаңыз</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaQrcode />
              </div>
              <h3>QR-код генерациясы</h3>
              <p>Құжаттарыңызды тексеру үшін бірегей QR-кодтарын жасаңыз және бөлісіңіз</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaLock />
              </div>
              <h3>Қауіпсіз сақтау</h3>
              <p>Деректеріңіздің қауіпсіздігі мен құпиялылығы біз үшін басты құндылық</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaMobileAlt />
              </div>
              <h3>Мобильді қолжетімділік</h3>
              <p>Барлық құрылғыларда жұмыс істейтін ыңғайлы интерфейс</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title1">Қалай жұмыс істейді</h2>
          <p className="section-description">
            Digital ID Wallet-ті пайдалану оңай және ыңғайлы
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Тіркеліңіз</h3>
              <p>Жүйеде тіркеліп, өз профиліңізді жасаңыз</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Құжаттарды қосыңыз</h3>
              <p>Өз құжаттарыңызды жүктеп, ақпаратты толтырыңыз</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Сақтаңыз және қолданыңыз</h3>
              <p>Құжаттарыңызды сақтап, қажет болған кезде оларды қолданыңыз</p>
            </div>
          </div>

          {!isAuthenticated() && (
            <div className="cta-container">
              <Link to="/register" className="btn btn-primary cta-btn">
                Қазір бастау
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title">Жиі қойылатын сұрақтар</h2>

          <div className="faq-list">
            <div className="faq-item">
              <h3>Digital ID Wallet дегеніміз не?</h3>
              <p>
                Digital ID Wallet - бұл жеке куәлік, студенттік билет, вакцинация паспорты сияқты маңызды құжаттарыңызды цифрлық форматта сақтауға мүмкіндік беретін қауіпсіз онлайн платформа.
              </p>
            </div>

            <div className="faq-item">
              <h3>Менің деректерім қаншалықты қауіпсіз?</h3>
              <p>
                Біз сіздің деректеріңіздің қауіпсіздігі мен құпиялылығын қамтамасыз ету үшін ең жоғарғы қауіпсіздік стандарттарын қолданамыз. Барлық ақпарат шифрленіп, қауіпсіз серверлерде сақталады.
              </p>
            </div>

            <div className="faq-item">
              <h3>Платформаны пайдалану ақылы ма?</h3>
              <p>
                Жоқ, Digital ID Wallet платформасын пайдалану толығымен тегін. Сіз барлық негізгі функцияларға еркін қол жеткізе аласыз.
              </p>
            </div>

            <div className="faq-item">
              <h3>QR-кодын қалай пайдалануға болады?</h3>
              <p>
                Әр құжат үшін бірегей QR-кодын жасауға болады, ол сіздің құжатыңыздың түпнұсқалығын тексеруге мүмкіндік береді. QR-кодын сканерлеу арқылы құжат туралы негізгі ақпаратты көруге болады.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;