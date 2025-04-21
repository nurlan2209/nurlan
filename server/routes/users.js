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

// Multer конфигурациясы - добавляем эту часть, она отсутствовала
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
router.get('/me', auth, (req, res) => {
  db.get('SELECT id, username, email, full_name, iin, is_admin FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    res.json(user);
  });
});

// Пайдаланушы профилін жаңарту
router.put('/me', auth, (req, res) => {
  const { full_name, email } = req.body;

  // Деректерді тексеру
  if (!full_name || !email) {
    return res.status(400).json({ message: 'Барлық қажетті өрістерді толтырыңыз' });
  }

  // Email бірегейлігін тексеру
  db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    if (user) {
      return res.status(400).json({ message: 'Бұл email бұрыннан бар' });
    }

    // Пайдаланушыны жаңарту
    db.run(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [full_name, email, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Профильді жаңарту кезінде қате орын алды' });
        }

        res.json({
          id: req.user.id,
          username: req.user.username,
          email,
          full_name,
          is_admin: req.user.is_admin
        });
      }
    );
  });
});

// Исправляем эту строку - уберем upload.single('file') так как он не нужен для обновления пароля
router.put('/me/password', auth, (req, res) => {
  const { current_password, new_password } = req.body;

  // Деректерді тексеру
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Барлық қажетті өрістерді толтырыңыз' });
  }

  // Пайдаланушыны алу
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    // Ағымдағы құпия сөзді тексеру
    bcrypt.compare(current_password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Серверде қате орын алды' });
      }
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Ағымдағы құпия сөз дұрыс емес' });
      }

      // Жаңа құпия сөзді хэштеу
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return res.status(500).json({ message: 'Серверде қате орын алды' });
        }

        bcrypt.hash(new_password, salt, (err, hash) => {
          if (err) {
            return res.status(500).json({ message: 'Серверде қате орын алды' });
          }

          // Құпия сөзді жаңарту
          db.run(
            'UPDATE users SET password = ? WHERE id = ?',
            [hash, req.user.id],
            function(err) {
              if (err) {
                return res.status(500).json({ message: 'Құпия сөзді жаңарту кезінде қате орын алды' });
              }

              res.json({ message: 'Құпия сөз сәтті өзгертілді' });
            }
          );
        });
      });
    });
  });
});

module.exports = router;