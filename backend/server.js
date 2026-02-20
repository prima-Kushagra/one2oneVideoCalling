require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });




app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during signup' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});



const onlineUsers = new Map();

const getOnlineUsers = () => {
  return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    status: data.status
  }));
};

const broadcastUserList = () => {
  io.emit('update-user-list', getOnlineUsers());
};



io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return next(new Error('Invalid token'));

    try {
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication server error'));
    }
  });
});



io.on('connection', (socket) => {

  const userId = socket.user._id.toString();
  const username = socket.user.username;

  console.log(`User connected: ${username} (${userId}) - ${socket.id}`);

 
  const existingUser = onlineUsers.get(userId);

  if (existingUser) {
    console.log("User reconnected:", username);

    existingUser.socketId = socket.id;
    existingUser.status = 'online';
    existingUser.partnerId = null;

    onlineUsers.set(userId, existingUser);
  } else {
    onlineUsers.set(userId, {
      socketId: socket.id,
      username,
      status: 'online',
      partnerId: null
    });
  }

  broadcastUserList();

  
  socket.on('call-user', ({ toId, offer }) => {

    const target = onlineUsers.get(toId);
    if (!target) return socket.emit('error', { message: 'User offline' });

    if (target.status === 'busy') {
      return socket.emit('user-busy');
    }

    onlineUsers.get(userId).status = 'busy';
    onlineUsers.get(userId).partnerId = toId;

    target.status = 'busy';
    target.partnerId = userId;

    broadcastUserList();

    io.to(target.socketId).emit('incoming-call', {
      fromId: userId,
      fromName: username,
      offer
    });
  });

 
  socket.on('answer-call', ({ toId, answer }) => {
    const target = onlineUsers.get(toId);
    if (target) {
      io.to(target.socketId).emit('call-answered', {
        fromId: userId,
        answer
      });
    }
  });

 
  socket.on('ice-candidate', ({ toId, candidate }) => {
    const target = onlineUsers.get(toId);
    if (target) {
      io.to(target.socketId).emit('ice-candidate', {
        fromId: userId,
        candidate
      });
    }
  });


  socket.on('end-call', ({ toId }) => {

    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).status = 'online';
      onlineUsers.get(userId).partnerId = null;
    }

    if (onlineUsers.has(toId)) {
      onlineUsers.get(toId).status = 'online';
      onlineUsers.get(toId).partnerId = null;
      io.to(onlineUsers.get(toId).socketId).emit('call-ended', { fromId: userId });
    }

    broadcastUserList();
  });

  socket.on('disconnect', (reason) => {

    console.log(`User disconnected: ${username}`);
    console.log("Reason:", reason);

    setTimeout(() => {

      const userData = onlineUsers.get(userId);
      if (!userData) return;

      if (userData.socketId !== socket.id) {
        console.log("Reconnected detected. Skipping cleanup.");
        return;
      }

      console.log("Final cleanup for:", username);

      if (userData.partnerId) {
        const partner = onlineUsers.get(userData.partnerId);

        if (partner) {
          partner.status = 'online';
          partner.partnerId = null;

          io.to(partner.socketId).emit('call-ended', { fromId: userId });
        }
      }

      onlineUsers.delete(userId);
      broadcastUserList();

    }, 3000); 
  });

});



app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO ready');
});