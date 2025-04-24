import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import './Notification.css';

const Notification = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  isVisible = false,
  position = 'top-right' 
}) => {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
    
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck />;
      case 'error':
        return <FaExclamationTriangle />;
      case 'warning':
        return <FaExclamationTriangle />;
      case 'info':
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <div className={`notification notification-${position} notification-${type} ${visible ? 'visible' : ''}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        {message}
      </div>
      <button className="notification-close" onClick={handleClose}>
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification;