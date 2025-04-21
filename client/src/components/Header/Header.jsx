import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaIdCard, FaUserCircle, FaSignOutAlt, FaUserAlt, FaHome, FaInfoCircle, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  // Закрываем меню при изменении маршрута
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Обработка кликов вне меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        toggleButtonRef.current && 
        !toggleButtonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Добавляем/удаляем класс menu-open для body
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  // Закрываем профиль при клике вне его области
  useEffect(() => {
    const handleProfileClickOutside = (event) => {
      const profileDropdown = document.querySelector('.profile-dropdown');
      const profileToggle = document.querySelector('.profile-toggle');
      
      if (
        profileOpen &&
        profileDropdown && 
        profileToggle && 
        !profileDropdown.contains(event.target) && 
        !profileToggle.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleProfileClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleProfileClickOutside);
    };
  }, [profileOpen]);

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  // Гамбургер-меню с анимацией
  const HamburgerIcon = () => (
    <div className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );

  return (
    <header className="header">
      <div className="container header-container">
        <div 
          className="mobile-toggle" 
          onClick={toggleMenu} 
          ref={toggleButtonRef}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <div className="header-logo">
          <Link to="/" className="logo">
            <FaIdCard /> <span>EduID Wallet</span>
          </Link>
        </div>
        
        <nav 
          className={`header-nav ${menuOpen ? 'open' : ''}`}
          ref={menuRef}
        >
          {isAuthenticated() ? (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={closeMenu}>
                <FaHome className="nav-icon" /> Басты бет
              </Link>
              <Link to="/documents" className={`nav-link ${location.pathname === '/documents' ? 'active' : ''}`} onClick={closeMenu}>
                <FaIdCard className="nav-icon" /> Менің құжаттарым
              </Link>
              {isAdmin() && (
                <Link to="/admin" className={`nav-link admin-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`} onClick={closeMenu}>
                  <FaChartBar className="nav-icon" /> Әкімші панелі
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>
                <FaHome className="nav-icon" /> Басты бет
              </Link>
              <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} onClick={closeMenu}>
                <FaInfoCircle className="nav-icon" /> Біз туралы
              </Link>
            </>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated() ? (
            <div className="user-profile">
              <div className="profile-toggle" onClick={toggleProfile}>
                <FaUserCircle />
                <span className="username">{user.username}</span>
              </div>
              {profileOpen && (
                <div className="profile-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={() => {
                    closeMenu();
                    setProfileOpen(false);
                  }}>
                    <FaUserAlt /> Профиль
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <FaSignOutAlt /> Шығу
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
                Кіру
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                Тіркелу
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Компонент FaBars
const FaBars = () => (
  <div className="hamburger-menu">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

// Компонент FaTimes (крестик)
const FaTimes = () => (
  <div className="hamburger-menu-close">
    <span></span>
    <span></span>
  </div>
);

export default Header;