const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Деректер қоры каталогін тексеру
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite деректер қорын қосу
const dbPath = path.join(dbDir, 'db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Деректер қорына қосылу кезінде қате орын алды:', err.message);
  } else {
    console.log('SQLite деректер қорына сәтті қосылды');
    initializeDatabase();
  }
});

// Деректер қорын инициализациялау
function initializeDatabase() {
  // Пайдаланушылар кестесі
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    iin TEXT UNIQUE,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Құжаттар кестесі
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doc_type TEXT NOT NULL,
    doc_number TEXT NOT NULL,
    doc_name TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    doc_data TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Әкімшілік тізімде әдепкі әкімші пайдаланушысын жасау
  const bcrypt = require('bcryptjs');
  const defaultAdmin = {
    username: 'admin',
    email: 'admin@digitalid.kz',
    password: bcrypt.hashSync('admin123', 10),
    full_name: 'Жүйе Әкімшісі',
    iin: '000000000000',
    is_admin: 1
  };

  db.get('SELECT * FROM users WHERE username = ?', [defaultAdmin.username], (err, user) => {
    if (err) {
      console.error('Әкімшіні тексеру кезінде қате:', err);
    } else if (!user) {
      db.run(
        'INSERT INTO users (username, email, password, full_name, iin, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
        [defaultAdmin.username, defaultAdmin.email, defaultAdmin.password, defaultAdmin.full_name, defaultAdmin.iin, defaultAdmin.is_admin],
        function(err) {
          if (err) {
            console.error('Әкімшіні қосу кезінде қате:', err);
          } else {
            console.log('Әдепкі әкімші пайдаланушысы жасалды');
          }
        }
      );
    }
  });
}

module.exports = db;