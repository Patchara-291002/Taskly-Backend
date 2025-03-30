const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const lineController = require('../controllers/lineController');

router.post('/webhook', lineController.handleWebhook);

// เชื่อมบัญชี LINE
router.post('/link', authenticate, lineController.linkLineAccount);

// ส่งข้อความทดสอบ
router.post('/notify', authenticate, lineController.testSendNotification);

module.exports = router;