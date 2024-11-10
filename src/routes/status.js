const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const authenticate = require('../middleware/authenticate');

router.post('/create', authenticate, statusController.createStatus); 

router.put('/update/:id', authenticate, statusController.updateStatus);

router.delete('/delete/:id', authenticate, statusController.deleteStatus);

router.put('/update/position/:id', authenticate, statusController.updateStatusPosition);

module.exports = router;