// server/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'digital_id_wallet',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL деректер қорына қосылу кезінде қате орын алды:', err.message);
  } else {
    console.log('PostgreSQL деректер қорына сәтті қосылды');
  }
});

// Function to create database tables if they don't exist
const initializeDatabase = async () => {
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

    // Documents table with public_token field
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
        public_token VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Check if public_token column exists, add if it doesn't
    try {
      await pool.query(`
        SELECT public_token FROM documents LIMIT 1
      `);
    } catch (err) {
      if (err.code === '42703') { // Undefined column error code
        console.log('Adding public_token column to documents table');
        await pool.query(`
          ALTER TABLE documents 
          ADD COLUMN public_token VARCHAR(255) UNIQUE
        `);
      }
    }

    // Check if admin user exists and create if not
    const bcrypt = require('bcryptjs');
    const defaultAdmin = {
      username: 'admin',
      email: 'admin@digitalid.kz',
      password: bcrypt.hashSync('admin123', 10),
      full_name: 'Жүйе Әкімшісі',
      iin: '000000000000',
      is_admin: 1
    };

    const adminResult = await pool.query('SELECT * FROM users WHERE username = $1', [defaultAdmin.username]);
    
    if (adminResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, email, password, full_name, iin, is_admin) VALUES ($1, $2, $3, $4, $5, $6)',
        [defaultAdmin.username, defaultAdmin.email, defaultAdmin.password, defaultAdmin.full_name, defaultAdmin.iin, defaultAdmin.is_admin]
      );
      console.log('Әдепкі әкімші пайдаланушысы жасалды');
    }

    console.log('Барлық кестелер сәтті жасалды');
  } catch (err) {
    console.error('Деректер қорын инициализациялау кезінде қате орын алды:', err.message);
  }
};

// Run initialization
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};