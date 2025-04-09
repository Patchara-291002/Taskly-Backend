const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configure S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Configure Multer with S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                contentType: file.mimetype,
                encoding: 'utf-8'
            });
        },
        key: function (req, file, cb) {
            // Generate unique filename with timestamp
            const timestamp = Date.now();
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const newFilename = `${timestamp}-${originalName}`;
            cb(null, newFilename);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// File upload middleware
exports.uploadFile = upload.single('file');

exports.deleteFileFromS3 = async (key) => {
  try {
      const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
      });

      await s3.send(command);
      return true;
  } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
  }
};

// Upload response handler
exports.handleUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'ไม่พบไฟล์ที่อัปโหลด'
        });
    }

    // Create S3 URL
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;
    
    // Get original filename in UTF-8
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    res.status(201).json({
        success: true,
        message: 'อัปโหลดไฟล์สำเร็จ',
        fileUrl: s3Url,
        filename: originalName,
        key: req.file.key,
        location: req.file.location
    });
};

// Error handling middleware
exports.handleError = (error, req, res, next) => {
    console.error('Upload error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'ไฟล์มีขนาดใหญ่เกินไป (จำกัด 10MB)'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        });
    }

    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
    });
};

// CORS middleware
exports.corsMiddleware = (req, res, next) => {
    res.charset = 'utf-8';
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    next();
};