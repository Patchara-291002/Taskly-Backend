const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');
const uploadController = require('../controllers/uploadController');


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

router.post('/create-content/:id', authenticate, projectController.addContentToProject);
router.post('/upload-file/:id', authenticate, uploadController.uploadFile, projectController.addFileToProject);
router.delete('/delete-content/:id/:contentId', authenticate, projectController.deleteContentFromProject);
router.delete('/delete-file/:id/:fileId', authenticate, projectController.deleteFileFromProject);

// role 
router.post('/create-role/:id', authenticate, projectController.addRoleToProject);
router.put('/update-role/:id/:roleId', authenticate, projectController.updateRoleInProject);
router.delete('/delete-role/:id/:roleId', authenticate, projectController.deleteRoleFromProject);

router.put('/user-role/:projectId/:userId', authenticate, projectController.updateUserProjectRole);

module.exports = router;