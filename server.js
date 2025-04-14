require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import User model
const User = require('./models/User'); // Assuming you have this model

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

// MongoDB connection to Atlas
const mongoURI = process.env.MONGO_URI; // MongoDB connection string from your .env file
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the HieroScribe backend!');
});

// Real-time event example (Socket.io)
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const posts = []; // Temporary in-memory storage for posts

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

// User Registration Route
app.post('/api/users/register', async (req, res) => {
  console.log('Registration attempt:', req.body); // Log the request body for debugging

  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  // Save the new user to the database
  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error saving user:', err); // Log the error
    res.status(500).json({ message: 'Server error' });
  }
});

// User Login Route
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expiration time
  });

  res.json({ token });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

