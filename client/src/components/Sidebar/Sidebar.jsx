import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaIdCard, FaUser, FaUsersCog, FaChartBar, FaKey } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Мәзір</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FaHome /> <span>Басты бет</span>
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FaIdCard /> <span>Менің құжаттарым</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FaUser /> <span>Менің профилім</span>
        </NavLink>
        <NavLink to="/change-password" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FaKey /> <span>Құпия сөзді өзгерту</span>
        </NavLink>
        
        {isAdmin() && (
          <>
            <div className="sidebar-divider"></div>
            <div className="sidebar-section-title">Әкімші</div>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <FaChartBar /> <span>Басқару панелі</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <FaUsersCog /> <span>Пайдаланушылар</span>
            </NavLink>
            <NavLink to="/admin/documents" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <FaIdCard /> <span>Құжаттар</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;