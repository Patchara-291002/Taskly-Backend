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
  res.redirect('/auth/google'); // ถ้าไม่มี token ให้ไปที่ Google authentication
};

// ฟังก์ชัน callback หลังจากที่ผู้ใช้ผ่าน Google authentication แล้ว
exports.googleCallback = (req, res) => {
  // สร้าง JWT token และตั้งค่า cookie ให้กับผู้ใช้
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('jwtToken', token, { httpOnly: true, secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.redirect('/'); // ไปที่ dashboard หลังจากตั้งค่า token แล้ว
};

// ฟังก์ชัน logout ที่ลบ cookie และยกเลิกการ login ของผู้ใช้
exports.logout = (req, res, next) => {
  res.clearCookie('jwtToken');
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};
