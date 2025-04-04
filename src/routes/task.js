const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');

router.post('/create', authenticate, taskController.createTask);

router.put('/update/status/:id', authenticate, taskController.updateTaskStatus);

router.put('/update/:id', authenticate, taskController.updateTask);

router.get("/:id", authenticate, taskController.getTaskById);

module.exports = router;