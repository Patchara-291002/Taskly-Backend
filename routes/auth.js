const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/google',
  passport.authenticate('google',{ scope: ['profile', 'email'] }));

router.get('/login', (req, res) => {
  const token = req.cookies.jwtToken;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (err) {
      res.clearCookie('jwtToken');
    }
  }
  res.redirect('/auth/google');
});

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('jwtToken', token, { httpOnly: true, secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwtToken');
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;


