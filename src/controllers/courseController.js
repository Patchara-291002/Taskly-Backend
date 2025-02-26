const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.getAllCourses = async (req, res) => {
    try {
        const userId = req.userId;
        const courses = await Course.find({ userId }).populate('userId');

        const coursesWithAssignmentCount = await Promise.all(
            courses.map(async course => {
                const assignmentCount = await Assignment.countDocuments({ courseId: course._id });
                return { ...course.toObject(), Assignment: assignmentCount };
            })
        );

        res.status(200).json(coursesWithAssignmentCount);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { courseName } = req.body;
        const userId = req.userId;

        const newCourse = new Course({ courseName, userId });
        await newCourse.save();

        res.status(201).json(newCourse);
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(id, updatedData, { new: true });
        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: 'Error updating course', error });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course', error });
    }
};

exports.fetchCourseByCourseId = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id).populate('userId', 'name email profile');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const assignments = await Assignment.find({ courseId: id });
        res.status(200).json({ ...course.toObject(), Assignments: assignments });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course', error });
    }
};

exports.addFileToCourse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileName = req.body.fileName || req.file.originalname;
        const fileAddress = req.file.location;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add file to this course' });
        }

        course.files.push({ fileName, fileAddress });
        await course.save();
        res.status(200).json({ message: 'File added successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error adding file to course', error });
    }
};

exports.addContentToCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add content to this course' });
        }

        const defaultContent = {
            title: "Empty",
            content: "Empty",
            isLink: false
        };

        course.contents.push(defaultContent);
        await course.save();

        res.status(200).json({ message: 'Content added successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error adding content to course', error });
    }
};


exports.deleteContentFromCourse = async (req, res) => {
    try {
        const { id, contentId } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete content from this course' });
        }

        course.contents.pull({ _id: contentId });
        await course.save();

        res.status(200).json({ message: 'Content deleted successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting content from course', error });
    }
};

exports.deleteFileFromCourse = async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete file from this course' });
        }

        course.files.pull({ _id: fileId });
        await course.save();
        res.status(200).json({ message: 'File deleted successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file from course', error });
    }
};
