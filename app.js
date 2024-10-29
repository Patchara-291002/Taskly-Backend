const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

require('./src/config/passport');

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

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/project', require('./src/routes/project'));
app.use('/status', require('./src/routes/status'));
app.use('/task', require('./src/routes/task'))

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to the Project Management API');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
