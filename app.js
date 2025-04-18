const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');

const { NotificationServices } = require('./src/services/NotificationServices');

dotenv.config();

require('./src/config/passport');

const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'https://taskly-frontend-gamma.vercel.app',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Session setup
app.use(session({
  secret: process.env.JWT_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,  // เปิดใช้เพราะใช้ HTTPS
    sameSite: 'none',  // อนุญาต cross-site requests
    domain: '.herokuapp.com',  // domain สำหรับ production
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    path: '/'
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  retryWrites: true,
  w: "majority",
  connectTimeoutMS: 30000,
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Exit process with failure
    process.exit(1);
  });

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/project', require('./src/routes/project'));
app.use('/status', require('./src/routes/status'));
app.use('/task', require('./src/routes/task'))
app.use('/user', require('./src/routes/user'));
app.use('/course', require('./src/routes/course'));
app.use('/assignment', require('./src/routes/assignment'));
app.use('/upload', require('./src/routes/upload'));
app.use('/line', require('./src/routes/line'));
app.use('/notification', require('./src/routes/notification'));
app.use('/search', require('./src/routes/search'));

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to the Project Management API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {

  NotificationServices();

  console.log(`Server running on port ${PORT}`);
});