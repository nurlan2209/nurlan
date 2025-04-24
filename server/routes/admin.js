// server/routes/admin.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Middleware для проверки прав администратора
const admin = async (req, res, next) => {
  try {
    // Проверяем, является ли пользователь администратором
    const result = await db.query('SELECT * FROM users WHERE id = $1 AND is_admin = 1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Рұқсат етілмеген. Әкімші құқықтары қажет.' });
    }
    
    // Если пользователь - администратор, переходим к следующему middleware
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Серверде қате орын алды' });
  }
};

// Получение статистики для панели администратора
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // Получить общее количество пользователей
    const usersResult = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Получить общее количество документов
    const docsResult = await db.query('SELECT COUNT(*) FROM documents');
    const totalDocuments = parseInt(docsResult.rows[0].count);

    // Получить статистику по типам документов
    const docTypesResult = await db.query(`
      SELECT doc_type, COUNT(*) as count
      FROM documents
      GROUP BY doc_type
      ORDER BY count DESC
    `);

    res.json({
      totalUsers,
      totalDocuments,
      docTypes: docTypesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Статистиканы алу кезінде қате орын алды' });
  }
});

// Получение списка всех пользователей (только для админов)
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, username, email, full_name, iin, is_admin, created_at
      FROM users
      ORDER BY id
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыларды алу кезінде қате орын алды' });
  }
});

// Получение конкретного пользователя (только для админов)
router.get('/users/:id', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, iin, is_admin, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыны алу кезінде қате орын алды' });
  }
});

// Добавление нового пользователя (только для админов)
router.post('/users', [auth, admin], async (req, res) => {
  const { username, email, password, full_name, iin, is_admin } = req.body;

  // Проверка обязательных полей
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ message: 'Барлық міндетті өрістерді толтырыңыз' });
  }

  try {
    // Проверка уникальности username
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Пайдаланушы аты бұрыннан бар',
        field: 'username'
      });
    }

    // Проверка уникальности email
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Email бұрыннан бар',
        field: 'email'
      });
    }

    // Проверка уникальности ИИН (если предоставлен)
    if (iin) {
      const iinCheck = await db.query('SELECT * FROM users WHERE iin = $1', [iin]);
      
      if (iinCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'ЖСН бұрыннан бар',
          field: 'iin'
        });
      }
    }

    // Хеширование пароля
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Добавление пользователя
    const result = await db.query(
      'INSERT INTO users (username, email, password, full_name, iin, is_admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, full_name, iin, is_admin, created_at',
      [username, email, hashedPassword, full_name, iin, is_admin ? 1 : 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыны қосу кезінде қате орын алды' });
  }
});

// Обновление пользователя (только для админов)
router.put('/users/:id', [auth, admin], async (req, res) => {
  const { username, email, password, full_name, iin, is_admin } = req.body;
  const userId = req.params.id;

  // Проверка обязательных полей
  if (!username || !email || !full_name) {
    return res.status(400).json({ message: 'Барлық міндетті өрістерді толтырыңыз' });
  }

  try {
    // Проверка существования пользователя
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    // Проверка уникальности username
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, userId]);
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Пайдаланушы аты бұрыннан бар',
        field: 'username'
      });
    }

    // Проверка уникальности email
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Email бұрыннан бар',
        field: 'email'
      });
    }

    // Проверка уникальности ИИН (если предоставлен)
    if (iin) {
      const iinCheck = await db.query('SELECT * FROM users WHERE iin = $1 AND id != $2', [iin, userId]);
      
      if (iinCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'ЖСН бұрыннан бар',
          field: 'iin'
        });
      }
    }

    // Если пароль предоставлен, хешируем его
    let hashedPassword;
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Обновление пользователя
    let query, params;
    if (password) {
      query = `
        UPDATE users 
        SET username = $1, email = $2, password = $3, full_name = $4, iin = $5, is_admin = $6 
        WHERE id = $7 
        RETURNING id, username, email, full_name, iin, is_admin, created_at
      `;
      params = [username, email, hashedPassword, full_name, iin, is_admin ? 1 : 0, userId];
    } else {
      query = `
        UPDATE users 
        SET username = $1, email = $2, full_name = $3, iin = $4, is_admin = $5 
        WHERE id = $6 
        RETURNING id, username, email, full_name, iin, is_admin, created_at
      `;
      params = [username, email, full_name, iin, is_admin ? 1 : 0, userId];
    }

    const result = await db.query(query, params);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыны жаңарту кезінде қате орын алды' });
  }
});

// Удаление пользователя (только для админов)
router.delete('/users/:id', [auth, admin], async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Предотвращение самоудаления
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Өз аккаунтыңызды жоя алмайсыз' });
    }

    // Проверка существования пользователя
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });
    }

    // Получение всех документов пользователя для удаления файлов
    const docsResult = await db.query('SELECT * FROM documents WHERE user_id = $1', [userId]);
    
    // Удаление файлов, связанных с документами пользователя
    for (const doc of docsResult.rows) {
      if (doc.file_path) {
        const filePath = path.join(__dirname, '..', doc.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Удаление всех документов пользователя
    await db.query('DELETE FROM documents WHERE user_id = $1', [userId]);
    
    // Удаление пользователя
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'Пайдаланушы сәтті жойылды' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыны жою кезінде қате орын алды' });
  }
});

// Получение всех документов (только для админов)
router.get('/documents', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.username, u.full_name 
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.id DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Құжаттарды алу кезінде қате орын алды' });
  }
});

module.exports = router;