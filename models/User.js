const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
  }
});

module.exports = mongoose.model('User', UserSchema);