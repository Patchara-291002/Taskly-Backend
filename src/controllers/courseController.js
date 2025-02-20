const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.getAllCourses = async (req, res) => {
    try {
        const userId = req.userId;
        const courses = await Course.find({ userId }).populate('userId');

        const coursesWithAssignmentCount = await Promise.all(
            courses.map(async course => {
                const assignmentCount = await Assignment.countDocuments({ courseId: course._id });
                const courseObj = course.toObject();
                courseObj.Assignment = assignmentCount;
                return courseObj;
            })
        );

        res.status(200).json(coursesWithAssignmentCount);
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
            day,
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
            day,
            startTime,
            endTime,
            links: links || [],
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


exports.fetchCourseByCourseId = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id).populate('userId', 'name email profile');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const assignments = await Assignment.find({ courseId: id });
        const courseObj = course.toObject();
        courseObj.Assignments = assignments;

        res.status(200).json(courseObj);
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

        course.files.push({
            fileName,
            fileAddress,
        });

        await course.save();
        res.status(200).json({ message: 'File added successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error adding file to course', error });
    }
};

exports.addLinkToCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { linkName, linkAddress } = req.body;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to add link to this assignment' });
        }

        course.links.push({
            linkName,
            linkType: "link",
            linkAddress,
        });

        await course.save();
        res.status(200).json({ message: 'Link added successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error adding link to assignment', error });
    }
};

exports.deleteLinkFromCourse = async (req, res) => {
    try {
        // รับ course id และ link id จาก req.params
        const { id, linkId } = req.params;

        // ค้นหา course ตาม id
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // ตรวจสอบสิทธิ์ผู้ใช้ (ถ้าใน Course model มี field userId)
        if (course.userId && course.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete link from this course' });
        }

        // ลบ link ที่มี _id ตรงกับ linkId ออกจาก array links
        course.links.pull({ _id: linkId });
        await course.save();

        res.status(200).json({ message: 'Link deleted successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting link from course', error });
    }
};

exports.deleteFileFromCourse = async (req, res) => {
    try {
      const { id, fileId } = req.params; // id = course id, fileId = _id ของไฟล์ที่ต้องการลบ
  
      // ค้นหา course ตาม id
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // ตรวจสอบสิทธิ์ผู้ใช้ ว่าคุณเป็นเจ้าของ course นี้หรือไม่
      if (course.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Unauthorized to delete file from this course' });
      }
  
      // ลบไฟล์ที่มี _id ตรงกับ fileId จาก array files
      course.files.pull({ _id: fileId });
  
      await course.save();
      res.status(200).json({ message: 'File deleted successfully', course });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting file from course', error });
    }
  };
