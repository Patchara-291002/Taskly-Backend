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

app.use(cookieParser(process.env.JWT_SECRET));

app.use(express.json());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: true
}));

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for Heroku
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.herokuapp.com', // Fixed domain for Heroku
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  }
}));


// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Token extraction middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] ||
    req.cookies.token ||
    req.query.token;

  if (token) {
    req.token = token;
  }
  next();
});


// Add headers for cross-origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  next();
});

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
    process.exit(1);
  });

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/project', require('./src/routes/project'));
app.use('/status', require('./src/routes/status'));
app.use('/task', require('./src/routes/task'));
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