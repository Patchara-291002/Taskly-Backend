const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.getAllCourses = async (req, res) => {
    try {
        const userId = req.userId;
        const courses = await Course.find({ userId })
            .populate('userId', 'name email profile')
            .lean();

        const coursesWithAssignmentCount = await Promise.all(
            courses.map(async course => {
                const assignmentCount = await Assignment.countDocuments({ courseId: course._id });
                return {
                    ...course,
                    Assignment: assignmentCount
                };
            })
        );

        res.status(200).json(coursesWithAssignmentCount);
    } catch (error) {
        console.error("❌ Error fetching courses:", error);
        res.status(500).json({ 
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส', 
            error: error.message 
        });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { courseName } = req.body;
        const userId = req.userId;

        color="#D6D6D6"

        const newCourse = new Course({ courseName, userId, courseColor: color });
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
        
        // ตรวจสอบว่ามีคอร์สอยู่จริงและผู้ใช้มีสิทธิ์ลบ
        const course = await Course.findOne({ _id: id, userId: req.userId });
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found or unauthorized' 
            });
        }

        // ใช้ Promise.all เพื่อลบพร้อมกัน
        await Promise.all([
            // ลบคอร์ส
            Course.findByIdAndDelete(id),
            
            // ลบการบ้านทั้งหมดที่เกี่ยวข้อง
            Assignment.deleteMany({ courseId: id })
        ]);

        res.status(200).json({ 
            success: true,
            message: 'Course and related assignments deleted successfully' 
        });

    } catch (error) {
        console.error("❌ Error deleting course:", error);
        res.status(500).json({ 
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบคอร์ส', 
            error: error.message 
        });
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
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบคอร์ส'
            });
        }

        // ตรวจสอบสิทธิ์ผู้ใช้
        if (course.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เพิ่มไฟล์ในคอร์สนี้'
            });
        }

        // แปลงชื่อไฟล์เป็น UTF-8
        const originalFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        // เพิ่มไฟล์ด้วยชื่อที่ถูกแปลงแล้ว
        course.files.push({
            fileName: originalFileName,
            fileAddress: req.file.location
        });

        await course.save();

        res.status(201).json({
            success: true,
            message: 'อัปโหลดไฟล์สำเร็จ',
            file: {
                fileName: originalFileName,
                fileUrl: req.file.location
            }
        });
    } catch (error) {
        console.error("❌ Error adding file to course:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มไฟล์',
            error: error.message
        });
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

exports.getClassToDay = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get current date and time in Thailand timezone
        const now = new Date();
        const options = { timeZone: 'Asia/Bangkok' };
        const thailandTime = now.toLocaleString('en-US', options);
        const thailandDate = new Date(thailandTime);

        // Get day name in English
        const daysInEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = daysInEnglish[thailandDate.getDay()];

        // Find courses for today
        const todayCourses = await Course.find({
            userId: userId,
            day: todayName
        })
        .populate('userId', 'name email profile')
        .sort({ startTime: 1 });

        if (!todayCourses || todayCourses.length === 0) {
            return res.status(200).json({ 
                success: true,
                courses: [] 
            });
        }

        // Format response data
        const formattedCourses = todayCourses.map(course => ({
            _id: course._id,
            courseName: course.courseName,
            courseCode: course.courseCode,
            courseColor: course.courseColor,
            day: course.day,
            location: course.location,
            startTime: course.startTime,
            endTime: course.endTime,
            instructor: course.instructorName
        }));

        res.status(200).json({
            success: true,
            courses: formattedCourses
        });

    } catch (error) {
        console.error("❌ Error fetching today's classes:", error);
        res.status(500).json({ 
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคลาสเรียน', 
            error: error.message 
        });
    }
};