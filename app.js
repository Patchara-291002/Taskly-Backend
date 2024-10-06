const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');

require('dotenv').config();
require('./config/passport');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Session setup
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/project', require('./routes/project'));
app.use('/dashboard',require('./routes/dashboard'));
app.use('/project-task', require('./routes/project_task'));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Test route
app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Auth</a>');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
