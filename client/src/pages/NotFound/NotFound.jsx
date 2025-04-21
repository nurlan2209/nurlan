import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <FaExclamationTriangle className="not-found-icon" />
        <h1>404</h1>
        <h2>Бет табылмады</h2>
        <p>Сіз іздеген бет табылмады немесе қол жетімді емес.</p>
        <Link to="/" className="btn btn-primary">
          <FaHome /> Басты бетке оралу
        </Link>
      </div>
    </div>
  );
};

export default NotFound;