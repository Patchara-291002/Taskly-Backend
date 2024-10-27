const Project = require('../models/Project');
const User = require('../models/User');

exports.getAllProject = async (req, res) => {
    try {
        // ดึงข้อมูลโปรเจกต์ทั้งหมด พร้อม populate ฟิลด์ userId ที่อยู่ใน users array
        const projects = await Project.find().populate({
            path: 'users.userId', // ระบุเส้นทางที่ต้องการ populate คือ users.userId
            select: 'displayName profilePicture', // เลือกแค่ฟิลด์ที่ต้องการจากโมเดล User
        });

        // ส่งข้อมูลโปรเจกต์กลับไปในรูปแบบ JSON
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects', error });
    }
}

exports.createProject = async (req, res) => {
    try {
        const { projectName } = req.body;
        const userId = req.userId;

        const newProject = new Project({
            projectName,
            users: [{ userId, role: 'owner' }]
        });

        await newProject.save();

        const populatedProject = await Project.findById(newProject._id).populate('users.userId', 'displayName profilePicture');

        res.status(201).json(populatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName } = req.body

        const updateProject = await Project.findByIdAndUpdate(
            id,
            { projectName, updatedAt: Date.now() },
            { new: true }
        );

        if (!updateProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(updateProject);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update project' }, error);
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const deleteProject = await Project.findByIdAndDelete(id);

        if (!deleteProject) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete project', error });
    }
};
