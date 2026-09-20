const mysql2 = require('mysql2/promise');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const pool = mysql2.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'gym_management',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '+05:30',
  multipleStatements: true,
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected to database: "${process.env.DB_NAME || 'gym_management'}" on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    conn.release();

    // Check if tables exist
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`📊 Found ${tables.length} tables in database.`);

    if (tables.length === 0) {
      console.log('⚡ No tables found! Automatically initializing schema from database/schema.sql...');
      const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Schema & seed data created successfully via auto-init!');
      } else {
        console.warn('⚠️ schema.sql not found at:', schemaPath);
      }
    }

    // Always ensure admin and demo users exist with valid password hashes
    try {
      await pool.query(`
        INSERT INTO users (email, password, role) VALUES
          ('admin@gymms.com', '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'admin'),
          ('demo@gmail.com',  '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'admin'),
          ('rahul@example.com', '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'member')
        ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role);
      `);
    } catch (userErr) {
      console.warn('⚠️ Note when ensuring demo users:', userErr.message);
    }

    // Print all available users in terminal so user can see exactly who exists
    try {
      const [users] = await pool.query('SELECT user_id, email, role FROM users');
      console.log('👥 Active users in database:');
      users.forEach(u => console.log(`   • [ID: ${u.user_id}] ${u.email} (${u.role})`));
    } catch (listErr) {
      console.warn('⚠️ Could not query users table:', listErr.message);
    }

  } catch (err) {
    console.error('❌ MySQL connection / init failed:');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    console.error('   Stack:', err.stack);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
