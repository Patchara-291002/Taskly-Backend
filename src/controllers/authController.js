const jwt = require('jsonwebtoken');
const passport = require('passport');

// เริ่มกระบวนการยืนยันตัวตนด้วย Google
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// ฟังก์ชัน login ที่ตรวจสอบการมีอยู่ของ token ใน cookies
exports.login = (req, res) => {
  const token = req.cookies.jwtToken;
  if (token) {
    try {
      // ตรวจสอบความถูกต้องของ token
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/'); // ถ้า token ถูกต้อง ให้ไปที่ dashboard
    } catch (err) {
      res.clearCookie('jwtToken'); // ถ้า token ผิด ให้ลบออก
    }
  }
};

exports.googleCallback = (req, res) => {
  // const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  // res.cookie('jwtToken', token, { httpOnly: true, secure: true, maxAge: 3600000 });
  // res.redirect(`http://localhost:3001?userId=${req.user._id}`);
  try {
    if (!req.user) {
      console.error("Error: No user found in request.");
      return res.status(500).json({ message: "Authentication failed" });
    }
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '3h' })
    const hour = 3600000 * 3
    res.cookie('jwtToken', token, { httpOnly: true, secure: true, maxAge: hour });
    res.redirect(`http://localhost:3001?userId=${req.user._id}`);
  } catch (error) {
    console.error("Error in googleCallback:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ฟังก์ชัน logout ที่ลบ cookie และยกเลิกการ login ของผู้ใช้
exports.logout = (req, res, next) => {
  res.clearCookie('jwtToken');
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};
