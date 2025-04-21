const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT құпия кілті
const JWT_SECRET = process.env.JWT_SECRET || '2bf646392185d4b4f732a2115b9bee27bc58a638bd7e7ab194043dcf9a15fbe5a251b883918e1b499e1ed720bfc8355362180a7ec1d4c86c8e98acd1694b54084d35f0d6b6666f762fdd1f626afe4c62cd87f29195307deac5bad3e993eb7d3dc9e96645ee1243710d7f0381247c914ea279339702286d0d85105f7936f119d9103b401f549474cd4ae085a549de1cb846ed9710cb8232086767d6dcc4af5b1723618c445069230fd2ceca482554431d1da6923cc4805c832e714b5ce9a154e15685f776e07e568be06ae3289271c224d035646be3dd7631ae35a255276dfe0853e4df3ee44b331a4d0b9fb3703971c2aa42df194a721f324b1d491b0c677646';

// Жүйеге кіру
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Пайдаланушыны іздеу
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Жарамсыз пайдаланушы аты немесе құпия сөз' });
    }

    // Құпия сөзді тексеру
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Серверде қате орын алды' });
      }
      
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
    });
  });
});

// Тіркелу
router.post('/register', (req, res) => {
  const { username, email, password, full_name, iin } = req.body;

  // Деректерді тексеру
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ message: 'Барлық өрістерді толтырыңыз' });
  }

  // Отдельные проверки для каждого поля, чтобы точно знать какое поле является дубликатом
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, usernameExists) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    if (usernameExists) {
      return res.status(400).json({ 
        message: 'Пайдаланушы аты бұрыннан бар',
        field: 'username'
      });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, emailExists) => {
      if (err) {
        return res.status(500).json({ message: 'Серверде қате орын алды' });
      }
      
      if (emailExists) {
        return res.status(400).json({ 
          message: 'Email бұрыннан бар',
          field: 'email'
        });
      }

      // Проверяем ИИН только если он предоставлен
      if (iin) {
        db.get('SELECT * FROM users WHERE iin = ?', [iin], (err, iinExists) => {
          if (err) {
            return res.status(500).json({ message: 'Серверде қате орын алды' });
          }
          
          if (iinExists) {
            return res.status(400).json({ 
              message: 'ЖСН бұрыннан бар',
              field: 'iin'
            });
          }
          
          // Если все проверки прошли успешно, продолжаем регистрацию
          registerUser();
        });
      } else {
        // Если ИИН не предоставлен, сразу продолжаем регистрацию
        registerUser();
      }
    });
  });

  // Функция для регистрации пользователя после всех проверок
  function registerUser() {
    // Құпия сөзді хэштеу
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return res.status(500).json({ message: 'Серверде қате орын алды' });
      }

      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          return res.status(500).json({ message: 'Серверде қате орын алды' });
        }

        // Пайдаланушыны қосу
        db.run(
          'INSERT INTO users (username, email, password, full_name, iin) VALUES (?, ?, ?, ?, ?)',
          [username, email, hash, full_name, iin],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Пайдаланушыны қосу кезінде қате орын алды' });
            }

            // JWT токенін жасау
            const payload = {
              id: this.lastID,
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
                    id: this.lastID,
                    username,
                    email,
                    full_name,
                    is_admin: 0
                  }
                });
              }
            );
          }
        );
      });
    });
  }
});

// Новый эндпоинт для проверки существования полей
router.get('/check', (req, res) => {
  const { field, value } = req.query;
  
  if (!field || !value) {
    return res.status(400).json({ message: 'Field и value являются обязательными параметрами' });
  }
  
  // Проверка допустимых полей
  if (!['username', 'email', 'iin'].includes(field)) {
    return res.status(400).json({ message: 'Недопустимое поле для проверки' });
  }
  
  // Создаем запрос с параметром, защищаемся от SQL инъекций
  const query = `SELECT * FROM users WHERE ${field} = ?`;
  
  db.get(query, [value], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Серверде қате орын алды' });
    }
    
    return res.json({ exists: !!user });
  });
});

module.exports = router;