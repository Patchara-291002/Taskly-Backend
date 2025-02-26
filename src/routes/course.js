const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const courseController = require('../controllers/courseController');
const uploadController = require('../controllers/uploadController');

router.get('/', authenticate, courseController.getAllCourses);
router.get('/:id', authenticate, courseController.fetchCourseByCourseId)
router.post('/create', authenticate, courseController.createCourse);
router.put('/update/:id', authenticate, courseController.updateCourse);
router.delete('/delete/:id', authenticate, courseController.deleteCourse);

router.post(
    '/upload-file/:id',
    authenticate,
    uploadController.uploadFile,
    courseController.addFileToCourse
);
router.post('/create-content/:id', authenticate, courseController.addContentToCourse);
router.delete('/delete-content/:id/:contentId', authenticate, courseController.deleteContentFromCourse);
router.delete('/delete-file/:id/:fileId', authenticate, courseController.deleteFileFromCourse);

module.exports = router;