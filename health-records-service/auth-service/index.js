const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./db');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // allow frontend dev server
  credentials: true
}));



app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

connectDB();



app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
