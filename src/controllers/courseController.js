const Course = require('../models/Course');

exports.getAllCourses = async (req, res) => {
    try {
        const userId = req.userId;
        const courses = await Course.find({ userId }).populate('userId');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const {
            courseName,
            courseCode,
            courseColor,
            instructorName,
            location,
            startTime,
            endTime,
            links,
        } = req.body
        const userId = req.userId;  

        const newCourse = new Course({
            courseName,
            courseCode,
            courseColor,
            instructorName,
            location,
            startTime,
            endTime,
            links,
            userId
        })
        await newCourse.save();

        res.status(201).json(newCourse);
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error });
    }
}

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        // Optionally: เช็คว่าผู้ใช้งานที่ล็อกอินเป็นเจ้าของ course หรือมีสิทธิ์แก้ไข
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
        // Optionally: เช็คสิทธิ์ก่อนลบ
        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course', error });
    }
};