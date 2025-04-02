const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');

const scheduledNotifications = require('./src/services/scheduledNotifications');

dotenv.config();

require('./src/config/passport');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Session setup
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  retryWrites: true,
  w: "majority"
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
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

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to the Project Management API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // เริ่มระบบแจ้งเตือนอัตโนมัติ
  // scheduledNotifications.checkAllTasks();
  scheduledNotifications.checkDeadlinesAndNotify();

  console.log(`Server running on port ${PORT}`);
});