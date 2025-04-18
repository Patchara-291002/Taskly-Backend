const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const assignmentController = require('../controllers/assignmentController');
const uploadController = require('../controllers/uploadController');

router.get('/incomplete', authenticate, assignmentController.getIncompleteAssignments);

router.get('/', authenticate, assignmentController.getAllByUserId);
router.post('/create', authenticate, assignmentController.createAssignment);
router.put('/update/:id', authenticate, assignmentController.updateAssignment);
router.delete('/delete/:id', authenticate, assignmentController.deleteAssignment);
router.post('/:id/link', authenticate, assignmentController.addLinkToAssignment);
router.post(
    '/:id/upload-file',
    authenticate,
    uploadController.uploadFile,
    assignmentController.addFileToAssignment
);
router.post(
    '/:id/upload-image',
    authenticate,
    uploadController.uploadFile,
    assignmentController.addImageToAssignment
);
router.delete('/:id/link/:linkId', authenticate, assignmentController.deleteLinkFromAssignment);

module.exports = router;