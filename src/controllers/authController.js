const jwt = require('jsonwebtoken');
const passport = require('passport');

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.login = (req, res) => {
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
};

exports.googleCallback = (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('jwtToken', token, { httpOnly: true, secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.redirect('/dashboard');
};

exports.logout = (req, res, next) => {
  res.clearCookie('jwtToken');
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};