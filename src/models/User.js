const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // จำเป็นสำหรับทุกผู้ใช้
  },
  email: {
    type: String,
    unique: true,
    required: true, // จำเป็นสำหรับ Email และ Google Login
  },
  password: {
    type: String,
    select: false, // ปิดการดึง password อัตโนมัติ
  },
  googleId: {
    type: String, // สำหรับ Google Login
    unique: true,
    sparse: true, // อนุญาตให้ googleId เป็น null ได้
  },
  profile: {
    type: String, // เก็บ URL ของรูปโปรไฟล์
    default: null, // ถ้าไม่ใช่ Google Login จะเริ่มต้นเป็น null
  },
  isVerified: {
    type: Boolean,
    default: false, // อีเมลยังไม่ยืนยันเริ่มต้นเป็น false
  },
  verificationToken: {
    type: String, // Token สำหรับยืนยันอีเมล
  },
  resetPasswordToken: {
    type: String, // Token สำหรับรีเซ็ตรหัสผ่าน
  },
  resetPasswordExpires: {
    type: Date, // วันหมดอายุของ Token
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// เข้ารหัส password ก่อนบันทึก
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// ตรวจสอบรหัสผ่าน
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
