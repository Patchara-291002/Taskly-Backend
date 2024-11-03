const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/ีuserController');

router.get('/:id', authenticate, userController.getUserDetail);

module.exports = router;