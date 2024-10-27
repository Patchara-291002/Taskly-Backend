const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, projectController.getAllProject);

// Find ProjectByID
// AddUserToProject

// useable
router.post('/create', authenticate, projectController.createProject);

router.put('/:id', authenticate, projectController.updateProject);

router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;