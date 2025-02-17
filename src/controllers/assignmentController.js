const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.createAssignment = async (req, res) => {
    try {
        const { courseId, assignmentName, description, status, startDate, endDate, links } = req.body;

        // ตรวจสอบว่ารายวิชานั้นมีอยู่จริง
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const newAssignment = new Assignment({
            courseId,
            assignmentName,
            description,
            status,
            startDate,
            endDate,
            userId: req.userId,
            // รับ links ที่ส่งมาจาก client (อาจเป็น array ของ object ที่มี linkName, linkType, linkAddress)
            links: links || []
        });

        await newAssignment.save();
        res.status(201).json(newAssignment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating assignment', error });
    }
};

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

        // ตรวจสอบว่ามี assignment อยู่จริง
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // ตรวจสอบสิทธิ์การแก้ไขว่ามาจากเจ้าของจริงหรือไม่
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to update this assignment' });
        }

        // โดยปกติคุณสามารถแก้ไขฟิลด์ links ผ่าน update ได้เลย
        // เช่น client ส่งมาเป็น array ใหม่ของ links เพื่อแทนที่ข้อมูลเดิม
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

        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this assignment' });
        }

        await Assignment.findByIdAndDelete(id);
        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting assignment', error });
    }
};

exports.addLinkToAssignment = async (req, res) => {
    try {
        const { id } = req.params; // assignment id
        const { linkName, linkType, linkAddress } = req.body; // type: 'external', 'file', 'image'

        // ค้นหา assignment และตรวจสอบสิทธิ์ผู้ใช้
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add link to this assignment' });
        }

        // ใน model ของ Assignment เราใช้ field "linkType" แต่ใน request อาจส่งมาเป็น "type"
        assignment.links.push({
            linkName,
            linkType,
            linkAddress,
        });

        await assignment.save();
        res.status(200).json({ message: 'Link added successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding link to assignment', error });
    }
};

exports.addFileToAssignment = async (req, res) => {
    try {
        const { id } = req.params; // assignment id
        // ใช้ req.file ที่ได้จาก upload middleware
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const linkName = req.body.linkName || req.file.originalname;
        const linkAddress = req.file.location;
        const linkType = 'file';

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add file to this assignment' });
        }

        assignment.links.push({
            linkName,
            linkType,
            linkAddress,
        });

        await assignment.save();
        res.status(200).json({ message: 'File added successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding file to assignment', error });
    }
};

exports.addImageToAssignment = async (req, res) => {
    try {
        const { id } = req.params; // assignment id
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const linkName = req.body.linkName || req.file.originalname;
        const linkAddress = req.file.location;
        const linkType = 'image';

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (assignment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add image to this assignment' });
        }

        assignment.links.push({
            linkName,
            linkType,
            linkAddress,
        });

        await assignment.save();
        res.status(200).json({ message: 'Image added successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding image to assignment', error });
    }
};

exports.deleteLinkFromAssignment = async (req, res) => {
    try {
      const { id, linkId } = req.params; // id = assignment id, linkId = _id ของ link ที่ต้องการลบ
  
      // ค้นหา assignment และตรวจสอบสิทธิ์ผู้ใช้
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      if (assignment.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Unauthorized to delete link from this assignment' });
      }
  
      // ลบ link ที่มี _id ตรงกับ linkId จาก array links
      assignment.links.pull({ _id: linkId });
  
      await assignment.save();
      res.status(200).json({ message: 'Link deleted successfully', assignment });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting link from assignment', error });
    }
  };
  