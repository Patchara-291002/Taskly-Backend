const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello');
});

// เริ่มการยืนยันตัวตนด้วย Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback หลังจาก Google ยืนยันตัวตนแล้ว
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Protected route
router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`Hello, ${req.user.displayName}`);
});

module.exports = router;
