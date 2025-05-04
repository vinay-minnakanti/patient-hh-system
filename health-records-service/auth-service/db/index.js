// db.js
const { Pool } = require('pg');
const AWS = require('aws-sdk');

let pool;

const loadSecretsAndConnect = async () => {
  const secretsManager = new AWS.SecretsManager({ region: 'us-east-2' });
  const data = await secretsManager.getSecretValue({ SecretId: 'patient-health-system-secrets' }).promise();
  const secrets = JSON.parse(data.SecretString);

  pool = new Pool({
    connectionString: secrets.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const res = await pool.query('SELECT NOW()');
  console.log('✅ Connected to PostgreSQL at', res.rows[0].now);
};

const getPool = () => {
  if (!pool) throw new Error('❌ Pool not initialized. Call connectDB() first.');
  return pool;
};

module.exports = { connectDB: loadSecretsAndConnect, getPool };
