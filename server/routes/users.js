// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const db = require('../config/database');

// Upload каталогын жасау
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer конфигурациясы
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Рұқсат етілген форматтар
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Тек .jpeg, .jpg, .png және .pdf файлдарына рұқсат етіледі'));
    }
  }
});

// Қазіргі пайдаланушы туралы ақпаратты алу
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, iin, is_admin FROM users WHERE id = $1', 
      [req.user.id]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверде қате орын алды' });
  }
});

// Пайдаланушы профилін жаңарту
router.put('/me', auth, async (req, res) => {
  const { full_name, email } = req.body;

  // Деректерді тексеру
  if (!full_name || !email) {
    return res.status(400).json({ message: 'Барлық қажетті өрістерді толтырыңыз' });
  }

  try {
    // Email бірегейлігін тексеру
    const emailCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 AND id != $2', 
      [email, req.user.id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Бұл email бұрыннан бар' });
    }

    // Пайдаланушыны жаңарту
    await db.query(
      'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
      [full_name, email, req.user.id]
    );

    res.json({
      id: req.user.id,
      username: req.user.username,
      email,
      full_name,
      is_admin: req.user.is_admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Профильді жаңарту кезінде қате орын алды' });
  }
});

// Құпия сөзді өзгерту
router.put('/me/password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;

  // Деректерді тексеру
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Барлық қажетті өрістерді толтырыңыз' });
  }

  try {
    // Пайдаланушыны алу
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    // Ағымдағы құпия сөзді тексеру
    const isMatch = await bcrypt.compare(current_password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Ағымдағы құпия сөз дұрыс емес' });
    }

    // Жаңа құпия сөзді хэштеу
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    // Құпия сөзді жаңарту
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hash, req.user.id]
    );

    res.json({ message: 'Құпия сөз сәтті өзгертілді' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құпия сөзді жаңарту кезінде қате орын алды' });
  }
});

module.exports = router;