const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // ตรวจสอบว่ามีอีเมลซ้ำ
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // สร้าง Token สำหรับยืนยัน
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // สร้างผู้ใช้ใหม่ในฐานข้อมูล
    const newUser = new User({
      name,
      email,
      password,
      verificationToken,
    });
    await newUser.save();

    // ตั้งค่า Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/login?token=${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Email Verification',
      html: `<p>Please verify your email by clicking the link below:</p>
             <a href="${verificationUrl}">${verificationUrl}</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // ตรวจสอบว่ามี Token หรือไม่
    if (!token) {
      return res.status(400).json({ message: 'Missing token in request.' });
    }

    // ค้นหา User ตาม verificationToken
    const user = await User.findOne({ verificationToken: token });

    // ตรวจสอบว่าพบ User หรือไม่
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // อัปเดตสถานะเป็น Verified
    user.isVerified = true;
    user.verificationToken = undefined; // ล้าง Token ออกจาก DB
    await user.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'Invalid email or unverified account.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>This link will expire in 1 hour.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // ตรวจสอบว่า Token ยังไม่หมดอายุ
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // ตั้งรหัสผ่านใหม่
    user.password = newPassword;
    user.resetPasswordToken = undefined; // ล้าง Token
    user.resetPasswordExpires = undefined; // ล้างวันหมดอายุ
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
}

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error." });
  }
}