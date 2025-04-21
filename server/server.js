const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');

// Express қосымшасын құру
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статикалық файлдарға қол жеткізу
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Маршруттар
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Қате өңдеуші
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Серверде қате орын алды',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Серверді іске қосу
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер ${PORT} портында қосылды`);
});