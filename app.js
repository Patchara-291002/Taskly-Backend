const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

require('dotenv').config();

const app = express();

// DB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Session setup
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
}));

// Passport setup
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
