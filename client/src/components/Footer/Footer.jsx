import React from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section about">
            <div className="logo">
              <FaIdCard />
              <span>Digital ID Wallet</span>
            </div>
            <p className="footer-description">
              Жеке куәлік, студенттік билет, вакцинация паспорты сияқты құжаттарды цифрлы түрде сақтау платформасы.
            </p>
          </div>

          <div className="footer-section links">
            <h3>Пайдалы сілтемелер</h3>
            <ul>
              <li><Link to="/">Басты бет</Link></li>
              <li><Link to="/about">Біз туралы</Link></li>
              <li><Link to="/faq">Жиі қойылатын сұрақтар</Link></li>
              <li><Link to="/terms">Қолдану шарттары</Link></li>
              <li><Link to="/privacy">Құпиялылық саясаты</Link></li>
            </ul>
          </div>

          <div className="footer-section contact">
            <h3>Байланыс</h3>
            <div className="contact-info">
              <p><FaEnvelope /> info@digitalid.kz</p>
              <p><FaPhone /> +7 775 852 4891</p>
              <p><FaGlobe /> www.digitalid.kz</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Digital ID Wallet. Барлық құқықтар қорғалған.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;