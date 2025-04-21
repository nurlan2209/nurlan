const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
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
const admin = async (req, res, next) => {
    try {
      // Check if user exists and is an admin
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ? AND role = "admin"', [req.user.id], (err, user) => {
          if (err) {
            return reject(err);
          }
          
          if (!user) {
            return res.status(403).json({ message: 'Рұқсат етілмеген. Әкімші құқықтары қажет.' });
          }
          
          // If user is an admin, proceed to the next middleware
          next();
          resolve();
        });
      });
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({ message: 'Серверде қате орын алды' });
    }
  };
// Пайдаланушы құжаттарын алу
router.get('/', auth, (req, res) => {
  db.all('SELECT * FROM documents WHERE user_id = ?', [req.user.id], (err, documents) => {
    if (err) {
      return res.status(500).json({ message: 'Құжаттарды алу кезінде қате орын алды' });
    }
    res.json(documents);
  });
});

// Жеке құжатты алу
router.get('/:id', auth, (req, res) => {
  db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, document) => {
    if (err) {
      return res.status(500).json({ message: 'Құжатты алу кезінде қате орын алды' });
    }
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }
    res.json(document);
  });
});

// Құжатты QR-кодын алу
router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    const document = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, doc) => {
        if (err) reject(err);
        if (!doc) reject(new Error('Құжат табылмады'));
        resolve(doc);
      });
    });

    // QR кодын генерациялау
    const documentData = {
      id: document.id,
      type: document.doc_type,
      number: document.doc_number,
      name: document.doc_name,
      owner: req.user.id
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(documentData));
    res.json({ qrCode: qrCodeDataURL });
  } catch (err) {
    res.status(500).json({ message: 'QR кодын жасау кезінде қате орын алды' });
  }
});

// Жаңа құжат қосу
router.post('/', auth, upload.single('file'), (req, res) => {
  const { doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO documents (user_id, doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Құжатты сақтау кезінде қате орын алды' });
      }

      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        doc_type,
        doc_number,
        doc_name,
        issue_date,
        expiry_date,
        doc_data,
        file_path
      });
    }
  );
});

// Пайдаланушыны жою (тек әкімшілер үшін)
router.delete('/users/:id', [auth, admin], async (req, res) => {
  try {
    // Өзін өзі жою талпынысын болдырмау
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Өз аккаунтыңызды жоя алмайсыз' });
    }

    // Пайдаланушының бар екенін тексеру
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err) reject(err);
        if (!user) reject(new Error('Пайдаланушы табылмады'));
        resolve(user);
      });
    });

    // Пайдаланушымен байланысты құжаттарды жою
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM documents WHERE user_id = ?', [req.params.id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Пайдаланушыны жою
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.json({ message: 'Пайдаланушы сәтті жойылды' });
  } catch (err) {
    res.status(500).json({ message: 'Пайдаланушыны жою кезінде қате орын алды' });
  }
});

module.exports = router;