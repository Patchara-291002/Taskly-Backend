const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const uploadController = require('../controllers/uploadController');

router.post('/', authenticate, uploadController.uploadFile, uploadController.handleUpload);

module.exports = router;