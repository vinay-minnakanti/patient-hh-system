const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDB = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL at', res.rows[0].now);
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
