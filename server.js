const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the HieroScribe backend!');
});

// Example real-time event
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
const posts = []; // Temporary in-memory storage

// Route to get all posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// Route to add a post
app.post('/api/posts', (req, res) => {
  const newPost = {
    id: Date.now(),
    content: req.body.content,
    user: req.body.user || 'Anonymous',
    createdAt: new Date(),
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
