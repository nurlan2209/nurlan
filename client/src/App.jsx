import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './utils/PrivateRoute';
import { AdminRoute } from './utils/AdminRoute';
import Layout from './components/Layout/Layout';

// Публичные страницы
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import NotFound from './pages/NotFound/NotFound';
import PublicDocumentView from './pages/Documents/PublicDocumentView';

// Защищенные страницы пользователя
import Dashboard from './pages/Dashboard/Dashboard';
import Documents from './pages/Documents/Documents';
import DocumentView from './pages/Documents/DocumentView';
import DocumentForm from './pages/Documents/DocumentForm';

// Административные страницы
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminDocuments from './pages/Admin/AdminDocuments';

import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<PublicDocumentView />} />

        {/* Защищенные маршруты пользователя */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
        <Route path="/documents/:id" element={<PrivateRoute><DocumentView /></PrivateRoute>} />
        <Route path="/documents/add" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
        <Route path="/documents/edit/:id" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

        {/* Административные маршруты */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />

        {/* Маршрут "не найдено" */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;