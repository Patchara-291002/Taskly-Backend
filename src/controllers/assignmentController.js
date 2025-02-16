const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.createAssignment = async (req, res) => {
    try {
        const { courseId, assignmentName, description, status, startDate, endDate } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' })
        }

        const newAssignment = new Assignment({
            courseId,
            assignmentName,
            description,
            status,
            startDate,
            endDate,
            userId: req.userId
        });

        await newAssignment.save();
        res.status(201).json(newAssignment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating assignment', error });

    }
}

exports.getAllByUserId = async (req, res) => {
    try {
        const userId = req.userId;  
        const assignments = await Assignment.find({ userId })
            .populate('courseId', 'courseName courseCode');
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments', error });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to update this assignment' });
        }
        
        const updatedAssignment = await Assignment.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json(updatedAssignment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating assignment', error });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        // ตรวจสอบสิทธิ์ผู้ใช้
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this assignment' });
        }
        
        await Assignment.findByIdAndDelete(id);
        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting assignment', error });
    }
};