const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const { OAuth2Client } = require('google-auth-library');
const AWS = require('aws-sdk');

let JWT_SECRET;
let GOOGLE_CLIENT_ID;
let oauthClient;

// ✅ Load secrets from AWS once
const loadSecrets = async () => {
  if (JWT_SECRET && GOOGLE_CLIENT_ID) return;

  const client = new AWS.SecretsManager({ region: 'us-east-2' });
  const data = await client.getSecretValue({ SecretId: 'patient-health-system-secrets' }).promise();
  const secrets = JSON.parse(data.SecretString);

  JWT_SECRET = secrets.JWT_SECRET;
  GOOGLE_CLIENT_ID = secrets.GOOGLE_CLIENT_ID;
  oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
};

// ✅ Register
const register = async (req, res) => {
  await loadSecrets();
  const pool = getPool();
  const { email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).send('Registration error');
  }
};

// ✅ Login
const login = async (req, res) => {
  await loadSecrets();
  const pool = getPool();
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).send('Invalid credentials');

    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) return res.status(401).send('Invalid credentials');

    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      JWT_SECRET,
      { expiresIn: '5m' }
    );
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).send('Login error');
  }
};

// ✅ Google Login
const googleLogin = async (req, res) => {
  await loadSecrets();
  const pool = getPool();
  const { id_token } = req.body;

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
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
      { expiresIn: '5m' }
    );
    res.json({ token });
  } catch (err) {
    console.error('❌ Google login error:', err);
    res.status(401).send('Google login failed');
  }
};

module.exports = { register, login, googleLogin };
