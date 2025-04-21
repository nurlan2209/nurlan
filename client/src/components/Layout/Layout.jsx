import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="content-wrapper">
        {isAuthenticated() && !isAuthPage && (
          <Sidebar isOpen={sidebarOpen} />
        )}
        
        <main className={`main-content ${isAuthenticated() && !isAuthPage ? 'with-sidebar' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;