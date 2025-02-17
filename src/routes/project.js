const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

// router.get('/', authenticate, projectController.getAllProject);

// create project
router.post('/create', authenticate, projectController.createProject);

// update project 
router.put('/update/:id', authenticate, projectController.updateProject);

// delete project
router.delete('/delete/:id', authenticate, projectController.deleteProject);

// get project by userId
router.get('/', authenticate, projectController.getProjectByUserId);

// get project by projectId
router.get('/:id', authenticate, projectController.getProjectById);

// add user to this project
router.put('/add/:id', authenticate, projectController.addUserToProject);

module.exports = router;