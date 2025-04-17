const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');

router.get('/incomplete', authenticate, taskController.getIncompleteTasks);

router.post('/create', authenticate, taskController.createTask);

router.put('/update/status/:id', authenticate, taskController.updateTaskStatus);

router.put('/update/:id', authenticate, taskController.updateTask);

router.delete('/delete/:id', authenticate, taskController.deleteTask);

router.get("/:id", authenticate, taskController.getTaskById);

router.get(`/project/:taskId`, authenticate, taskController.getProjectIdByTaskId)

router.put(`/done/:taskId`, authenticate, taskController.moveTaskToDone)

module.exports = router;