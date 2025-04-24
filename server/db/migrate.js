// server/db/migrate.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
require('dotenv').config();

// SQLite database path
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'digital_id_wallet',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Function to create tables in PostgreSQL
const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        iin VARCHAR(12) UNIQUE,
        is_admin SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        doc_type VARCHAR(100) NOT NULL,
        doc_number VARCHAR(100) NOT NULL,
        doc_name VARCHAR(255) NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        doc_data TEXT,
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('PostgreSQL кестелері сәтті жасалды');
  } catch (err) {
    console.error('PostgreSQL кестелерін жасау кезінде қате орын алды:', err.message);
    process.exit(1);
  }
};

// Function to migrate users
const migrateUsers = async (db) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', async (err, users) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        for (const user of users) {
          await pool.query(
            'INSERT INTO users (id, username, email, password, full_name, iin, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
            [user.id, user.username, user.email, user.password, user.full_name, user.iin, user.is_admin, user.created_at || new Date()]
          );
          console.log(`Пайдаланушы көшірілді: ${user.username}`);
        }

        // Reset the PostgreSQL sequence for the id column
        if (users.length > 0) {
          const maxId = Math.max(...users.map(user => user.id));
          await pool.query(`SELECT setval('users_id_seq', ${maxId}, true)`);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Function to migrate documents
const migrateDocuments = async (db) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM documents', async (err, documents) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        for (const doc of documents) {
          await pool.query(
            'INSERT INTO documents (id, user_id, doc_type, doc_number, doc_name, issue_date, expiry_date, doc_data, file_path, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING',
            [
              doc.id, 
              doc.user_id, 
              doc.doc_type, 
              doc.doc_number, 
              doc.doc_name, 
              doc.issue_date, 
              doc.expiry_date, 
              doc.doc_data, 
              doc.file_path,
              doc.created_at || new Date()
            ]
          );
          console.log(`Құжат көшірілді: ${doc.doc_name}`);
        }

        // Reset the PostgreSQL sequence for the id column
        if (documents.length > 0) {
          const maxId = Math.max(...documents.map(doc => doc.id));
          await pool.query(`SELECT setval('documents_id_seq', ${maxId}, true)`);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Main migration function
const migrate = async () => {
  // Check if SQLite database exists
  if (!fs.existsSync(dbPath)) {
    console.error('SQLite деректер қоры табылмады:', dbPath);
    process.exit(1);
  }

  // Connect to SQLite database
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('SQLite деректер қорына қосылу кезінде қате орын алды:', err.message);
      process.exit(1);
    }
    console.log('SQLite деректер қорына сәтті қосылды');
  });

  try {
    // Create tables in PostgreSQL
    await createTables();

    // Migrate users
    await migrateUsers(db);

    // Migrate documents
    await migrateDocuments(db);

    console.log('Миграция сәтті аяқталды');
  } catch (err) {
    console.error('Миграция кезінде қате орын алды:', err.message);
  } finally {
    // Close SQLite database connection
    db.close((err) => {
      if (err) {
        console.error('SQLite деректер қорын жабу кезінде қате орын алды:', err.message);
      }
      console.log('SQLite деректер қоры жабылды');
    });

    // Close PostgreSQL connection
    pool.end();
  }
};

// Run migration
migrate();