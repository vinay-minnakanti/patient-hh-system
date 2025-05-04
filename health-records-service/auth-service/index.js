const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

// ✅ Proper async startup sequence
const startServer = async () => {
  try {
    await connectDB();  // ✅ Wait until DB + secrets are ready
    app.listen(PORT, () => {
      console.log(`✅ Auth service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
