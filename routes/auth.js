const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');

// เริ่มการยืนยันตัวตนผ่าน Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/google');
});

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });  
  res.cookie('jwt', token, { httpOnly: true, secure: true });
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwt');
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;


