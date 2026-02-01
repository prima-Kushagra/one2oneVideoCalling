require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

// --- Server Setup ---
const app = express();
app.use(cors()); // Allow Cross-Origin requests
app.use(express.json()); // Parse JSON bodies

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (dev only)
    methods: ['GET', 'POST']
  }
});

// --- MongoDB Connection ---
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit if cannot connect to DB
  });

// --- Auth Routes ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(`Signup attempt for: ${email}`);

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.log(`Signup failed: User ${email} or ${username} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, email, password });
    await user.save();

    console.log(`Signup successful: ${email}`);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Signup error details:', err);
    res.status(500).json({
      message: 'Server error during signup',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Incorrect password for ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`Login successful: ${email}`);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({
      message: 'Server error during login',
      error: err.message
    });
  }
});

// --- User Presence Tracking ---
const onlineUsers = new Map(); // userId -> { socketId, username, status }

const getOnlineUsers = () => {
  return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    status: data.status || 'online'
  }));
};

const broadcastUserList = () => {
  io.emit('update-user-list', getOnlineUsers());
};

// --- Socket.IO Middleware (Auth) ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Server error'));
    }
  });
});

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  const username = socket.user.username;

  console.log(`User connected: ${username} (${userId}) - Socket: ${socket.id}`);

  // Register user as online
  onlineUsers.set(userId, { socketId: socket.id, username, status: 'online' });
  broadcastUserList();

  // --- WebRTC Signaling Relays (Direct Calling) ---

  socket.on('call-user', (data) => {
    const { toId, offer } = data;
    const callerId = userId;
    const target = onlineUsers.get(toId);

    if (!target) {
      return socket.emit('error', { message: 'User is offline' });
    }

    if (target.status === 'busy') {
      console.log(`Call rejected: ${target.username} is busy`);
      return socket.emit('user-busy', { toId });
    }

    console.log(`Relaying call from ${username} to ${target.username}`);

    // Set both to busy temporarily (handshake phase)
    // Actually, maybe only when call is answered? 
    // Usually, we set to busy when call starts to avoid multiple incoming calls.
    onlineUsers.get(callerId).status = 'busy';
    onlineUsers.get(toId).status = 'busy';
    broadcastUserList();

    socket.to(target.socketId).emit('incoming-call', {
      fromId: userId,
      fromName: username,
      offer
    });
  });

  socket.on('answer-call', (data) => {
    const { toId, answer } = data;
    const target = onlineUsers.get(toId);
    if (target) {
      socket.to(target.socketId).emit('call-answered', {
        fromId: userId,
        answer
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const { toId, candidate } = data;
    const target = onlineUsers.get(toId);
    if (target) {
      socket.to(target.socketId).emit('ice-candidate', {
        fromId: userId,
        candidate
      });
    }
  });

  socket.on('end-call', (data) => {
    const { toId } = data;

    // Reset status for both users
    if (onlineUsers.has(userId)) onlineUsers.get(userId).status = 'online';
    if (onlineUsers.has(toId)) onlineUsers.get(toId).status = 'online';

    broadcastUserList();

    const target = onlineUsers.get(toId);
    if (target) {
      socket.to(target.socketId).emit('call-ended', { fromId: userId });
    }
  });

  // --- User Disconnect Logic ---
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${username} (${userId})`);

    // If user was in a call, we should notify the peer
    // But since we don't have a stable "peerId" in the socket object yet, 
    // it's better to loop or have client notify.
    // For simplicity, let's just clean up the status.
    onlineUsers.delete(userId);
    broadcastUserList();
  });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
});
