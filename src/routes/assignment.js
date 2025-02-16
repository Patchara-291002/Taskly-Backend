const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const assignmentController = require('../controllers/assignmentController');

router.get('/', authenticate, assignmentController.getAllByUserId);
router.post('/create', authenticate, assignmentController.createAssignment);
router.put('/update/:id', authenticate, assignmentController.updateAssignment);
router.delete('/delete/:id', authenticate, assignmentController.deleteAssignment);

module.exports = router;