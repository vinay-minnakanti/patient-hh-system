const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
