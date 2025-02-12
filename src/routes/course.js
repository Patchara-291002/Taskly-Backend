const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const courseController = require('../controllers/courseController');

router.get('/', authenticate, courseController.getAllCourses);
router.post('/create', authenticate, courseController.createCourse);
router.put('/update/:id', authenticate, courseController.updateCourse);
router.delete('/delete/:id', authenticate, courseController.deleteCourse);

module.exports = router;