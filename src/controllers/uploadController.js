const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
//   acl: 'public-read', 
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    cb(null, Date.now().toString() + '-' + file.originalname);
  },
});

const upload = multer({ storage: uploadStorage });

// middleware สำหรับอัปโหลดไฟล์ โดยใช้ key 'file'
exports.uploadFile = upload.single('file'); 

// ฟังก์ชันสำหรับส่ง response หลังอัปโหลด (สำหรับทดสอบแบบ stand-alone)
exports.handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(201).json({
    message: 'File uploaded successfully',
    fileUrl: req.file.location,
  });
};
