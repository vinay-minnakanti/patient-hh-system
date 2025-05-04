const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Register
const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Registration error');
  }
};

// ✅ Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).send('Invalid credentials');

    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) return res.status(401).send('Invalid credentials');

    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
  const token = jwt.sign(
    { userId: user.rows[0].id, email: user.rows[0].email },
    JWT_SECRET,
    { expiresIn: '5m' } // 🕔 expires in 5 minutes
  );
};

// ✅ Google SSO Login
const googleLogin = async (req, res) => {
  const { id_token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      const hashed = await bcrypt.hash(email, 10);
      await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2)',
        [email, hashed]
      );
      user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    }

    const token = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(401).send('Google login failed');
  }
  const token = jwt.sign(
    { userId: user.rows[0].id, email: user.rows[0].email },
    JWT_SECRET,
    { expiresIn: '5m' } // 🕔 expires in 5 minutes
  );
};

module.exports = { register, login, googleLogin };
