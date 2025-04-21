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

// Құжатты өңдеу
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data } = req.body;
    
    // Құжаттың бар екенін тексеру
    const document = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, doc) => {
        if (err) reject(err);
        if (!doc) reject(new Error('Құжат табылмады'));
        resolve(doc);
      });
    });

    let file_path = document.file_path;
    
    // Жаңа файл жүктелген жағдайда
    if (req.file) {
      // Егер бұрын файл болса, оны жою
      if (document.file_path) {
        const oldFilePath = path.join(__dirname, '..', document.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      file_path = `/uploads/${req.file.filename}`;
    }

    // Құжатты жаңарту
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE documents SET doc_type = ?, doc_number = ?, doc_name = ?, issue_date = ?, expiry_date = ?, doc_data = ?, file_path = ? WHERE id = ? AND user_id = ?',
        [doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path, req.params.id, req.user.id],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    res.json({
      id: parseInt(req.params.id),
      user_id: req.user.id,
      doc_type,
      doc_number,
      doc_name,
      issue_date,
      expiry_date,
      doc_data,
      file_path
    });
  } catch (err) {
    res.status(500).json({ message: 'Құжатты жаңарту кезінде қате орын алды' });
  }
});

// Құжатты жою
router.delete('/:id', auth, async (req, res) => {
  try {
    // Құжаттың бар екенін тексеру
    const document = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, doc) => {
        if (err) reject(err);
        if (!doc) reject(new Error('Құжат табылмады'));
        resolve(doc);
      });
    });

    // Егер файл болса, оны жою
    if (document.file_path) {
      const filePath = path.join(__dirname, '..', document.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Құжатты деректер қорынан жою
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json({ message: 'Құжат сәтті жойылды' });
  } catch (err) {
    res.status(500).json({ message: 'Құжатты жою кезінде қате орын алды' });
  }
});

module.exports = router;