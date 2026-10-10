const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

// 1. Initialize Express App and HTTP Server FIRST
const app = express();
const server = http.createServer(app);

// 2. Define Allowed Origins for Production and Development
const allowedOrigins = [
  'https://local-link-beta.vercel.app',
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// 3. Attach Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// 4. Socket.io Setup with Unified CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.send('LocalLink Backend API is running!');
});

app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: process.env.PORT || 5001
  };
  res.json(healthData);
});

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI not set in .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/auth', require('./routes/users'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/events', require('./routes/events'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/sharing', require('./routes/sharing'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/barter', require('./routes/barter'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ msg: `Upload error: ${err.message}` });
  }
  return res.status(err.status || 500).json({
    msg: err.message || 'An internal server error occurred'
  });
});

// Socket.io Real-Time Chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.chatId).emit('receive-message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
