// server/routes/documents.js - обновленный с поддержкой публичных токенов
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const crypto = require('crypto'); // Для генерации токенов
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
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжаттарды алу кезінде қате орын алды' });
  }
});

// Жеке құжатты алу
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2', 
      [req.params.id, req.user.id]
    );
    
    const document = result.rows[0];
    
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }
    
    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжатты алу кезінде қате орын алды' });
  }
});

// Публичное получение документа по токену
router.get('/public/:token', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, u.username, u.full_name as owner_name 
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.public_token = $1`, 
      [req.params.token]
    );
    
    const document = result.rows[0];
    
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }
    
    // Возвращаем базовую информацию, подходящую для публичного просмотра
    res.json({
      id: document.id,
      doc_type: document.doc_type,
      doc_number: document.doc_number,
      doc_name: document.doc_name,
      issue_date: document.issue_date,
      expiry_date: document.expiry_date,
      owner_name: document.owner_name,
      // Не возвращаем приватные поля
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжатты алу кезінде қате орын алды' });
  }
});

// Құжатты QR-кодын алу с поддержкой публичных ссылок
router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2', 
      [req.params.id, req.user.id]
    );
    
    const document = result.rows[0];
    
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }

    // Генерация случайного токена для публичного доступа, если еще не существует
    let publicToken = document.public_token;
    if (!publicToken) {
      // Генерируем новый токен
      publicToken = crypto.randomBytes(16).toString('hex');
      
      // Сохраняем токен в базе данных
      await db.query(
        'UPDATE documents SET public_token = $1 WHERE id = $2',
        [publicToken, document.id]
      );
    }

    // Создаем полный URL для публичного просмотра
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // или ваш реальный домен
    const publicUrl = `${baseUrl}/verify/${publicToken}`;

    // Генерируем QR-код из URL
    const qrCodeDataURL = await QRCode.toDataURL(publicUrl);
    res.json({ qrCode: qrCodeDataURL, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'QR кодын жасау кезінде қате орын алды' });
  }
});

// Жаңа құжат қосу
router.post('/', auth, upload.single('file'), async (req, res) => {
  const { doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Генерация токена для публичного доступа
    const publicToken = crypto.randomBytes(16).toString('hex');
    
    const result = await db.query(
      'INSERT INTO documents (user_id, doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path, public_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [req.user.id, doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path, publicToken]
    );

    const document = {
      id: result.rows[0].id,
      user_id: req.user.id,
      doc_type,
      doc_number,
      doc_name,
      issue_date,
      expiry_date,
      doc_data,
      file_path,
      public_token: publicToken
    };

    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжатты сақтау кезінде қате орын алды' });
  }
});

// Құжатты өңдеу
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data } = req.body;
    
    // Құжаттың бар екенін тексеру
    const checkResult = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2', 
      [req.params.id, req.user.id]
    );
    
    const document = checkResult.rows[0];
    
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }

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

    // Если публичный токен не существует, создаем его
    let publicToken = document.public_token;
    if (!publicToken) {
      publicToken = crypto.randomBytes(16).toString('hex');
    }

    // Құжатты жаңарту
    await db.query(
      'UPDATE documents SET doc_type = $1, doc_number = $2, doc_name = $3, issue_date = $4, expiry_date = $5, doc_data = $6, file_path = $7, public_token = $8 WHERE id = $9 AND user_id = $10',
      [doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path, publicToken, req.params.id, req.user.id]
    );

    res.json({
      id: parseInt(req.params.id),
      user_id: req.user.id,
      doc_type,
      doc_number,
      doc_name,
      issue_date,
      expiry_date,
      doc_data,
      file_path,
      public_token: publicToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжатты жаңарту кезінде қате орын алды' });
  }
});

// Құжатты жою
router.delete('/:id', auth, async (req, res) => {
  try {
    // Құжаттың бар екенін тексеру
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2', 
      [req.params.id, req.user.id]
    );
    
    const document = result.rows[0];
    
    if (!document) {
      return res.status(404).json({ message: 'Құжат табылмады' });
    }

    // Егер файл болса, оны жою
    if (document.file_path) {
      const filePath = path.join(__dirname, '..', document.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Құжатты деректер қорынан жою
    await db.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    res.json({ message: 'Құжат сәтті жойылды' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжатты жою кезінде қате орын алды' });
  }
});

module.exports = router;