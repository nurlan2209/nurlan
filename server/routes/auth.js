// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT құпия кілті
const JWT_SECRET = process.env.JWT_SECRET || '2bf646392185d4b4f732a2115b9bee27bc58a638bd7e7ab194043dcf9a15fbe5a251b883918e1b499e1ed720bfc8355362180a7ec1d4c86c8e98acd1694b54084d35f0d6b6666f762fdd1f626afe4c62cd87f29195307deac5bad3e993eb7d3dc9e96645ee1243710d7f0381247c914ea279339702286d0d85105f7936f119d9103b401f549474cd4ae085a549de1cb846ed9710cb8232086767d6dcc4af5b1723618c445069230fd2ceca482554431d1da6923cc4805c832e714b5ce9a154e15685f776e07e568be06ae3289271c224d035646be3dd7631ae35a255276dfe0853e4df3ee44b331a4d0b9fb3703971c2aa42df194a721f324b1d491b0c677646';

// Жүйеге кіру
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Пайдаланушыны іздеу
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(400).json({ message: 'Жарамсыз пайдаланушы аты немесе құпия сөз' });
    }

    // Құпия сөзді тексеру
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Жарамсыз пайдаланушы аты немесе құпия сөз' });
    }

    // JWT токенін жасау
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          return res.status(500).json({ message: 'Токен жасау кезінде қате орын алды' });
        }

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            is_admin: user.is_admin
          }
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверде қате орын алды' });
  }
});

// Тіркелу
router.post('/register', async (req, res) => {
  const { username, email, password, full_name, iin } = req.body;

  // Деректерді тексеру
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ message: 'Барлық өрістерді толтырыңыз' });
  }

  try {
    // Check if username exists
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Пайдаланушы аты бұрыннан бар',
        field: 'username'
      });
    }

    // Check if email exists
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Email бұрыннан бар',
        field: 'email'
      });
    }

    // Check if IIN exists (if provided)
    if (iin) {
      const iinCheck = await db.query('SELECT * FROM users WHERE iin = $1', [iin]);
      
      if (iinCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'ЖСН бұрыннан бар',
          field: 'iin'
        });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert the new user
    const result = await db.query(
      'INSERT INTO users (username, email, password, full_name, iin, is_admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [username, email, hash, full_name, iin, 0]
    );

    const newUserId = result.rows[0].id;

    // Create JWT token
    const payload = {
      id: newUserId,
      username,
      email,
      is_admin: 0
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          return res.status(500).json({ message: 'Токен жасау кезінде қате орын алды' });
        }

        res.status(201).json({
          success: true,
          token,
          user: {
            id: newUserId,
            username,
            email,
            full_name,
            is_admin: 0
          }
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Пайдаланушыны қосу кезінде қате орын алды' });
  }
});

// Check if username/email/iin exists
router.get('/check', async (req, res) => {
  const { field, value } = req.query;
  
  if (!field || !value) {
    return res.status(400).json({ message: 'Field және value параметрлері міндетті' });
  }
  
  // Проверка допустимых полей
  if (!['username', 'email', 'iin'].includes(field)) {
    return res.status(400).json({ message: 'Тексеруге рұқсат етілмеген өріс' });
  }
  
  try {
    const query = `SELECT * FROM users WHERE ${field} = $1`;
    const result = await db.query(query, [value]);
    
    return res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверде қате орын алды' });
  }
});

module.exports = router;