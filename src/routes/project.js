const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, projectController.getAllProject);

// Find ProjectByID
// AddUserToProject

// useable

// create project
router.post('/create', authenticate, projectController.createProject);

// update project 
router.put('/:id', authenticate, projectController.updateProject);

// delete project
router.delete('/:id', authenticate, projectController.deleteProject);

// get project by userId
router.get('/user/:id', authenticate, projectController.getProjectByUserId);

// get project by projectId
router.get('/:id', authenticate, projectController.getProjectById);

router.put('/addUser/:id', authenticate, projectController.addUserToProject);

module.exports = router;