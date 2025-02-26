const Project = require('../models/Project');
const Status = require('../models/Status');
const Task = require('../models/Task');

const mongoose = require('mongoose')

exports.createProject = async (req, res) => {
    try {
        const { projectName, startDate, dueDate } = req.body;
        const userId = req.userId;

        const projectStartDate = new Date(startDate).toISOString();
        const projectDueDate = new Date(dueDate).toISOString();

        const newProject = new Project({
            projectName,
            users: [{ userId, role: 'owner' }],
            startDate: projectStartDate,
            dueDate: projectDueDate,
            contents: Array(5).fill({ title: "Empty", content: "Empty", isLink: false }),
            roles: [{ roleId: new mongoose.Types.ObjectId(), name: "Default role", color: "#D6D6D6" }]
        });

        await newProject.save();

        res.status(201).json(newProject);
    } catch (error) {
        console.error("❌ Error creating project:", error); // ✅ ดู Error
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};


exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, startDate, dueDate, contents } = req.body;

        // ✅ ตรวจสอบว่า `id` ถูกต้อง
        if (!id) {
            return res.status(400).json({ message: "Missing project ID" });
        }

        // ✅ ตรวจสอบว่า `project` มีอยู่จริง
        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        // ✅ อัปเดตข้อมูลโครงการ
        existingProject.projectName = projectName ?? existingProject.projectName;
        existingProject.startDate = startDate ?? existingProject.startDate;
        existingProject.dueDate = dueDate ?? existingProject.dueDate;

        // ✅ ตรวจสอบ `contents` และอัปเดต
        if (Array.isArray(contents)) {
            existingProject.contents = contents;
        }

        existingProject.updatedAt = new Date();

        // ✅ บันทึกการเปลี่ยนแปลง
        await existingProject.save();

        res.status(200).json(existingProject);
    } catch (error) {
        console.error("❌ Error updating project:", error);
        res.status(500).json({ message: "Failed to update project", error });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔹 ดึงข้อมูล Status ทั้งหมดของ Project ก่อนลบ
        const statuses = await Status.find({ projectId: id });

        // 🔹 ลบ Project
        const deletedProject = await Project.findByIdAndDelete(id);
        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // 🔹 ดึง `statusId` ทั้งหมดเพื่อใช้ลบ Tasks
        const statusIds = statuses.map(status => status._id);

        // 🔹 ลบ Status และ Task ที่เกี่ยวข้อง
        await Status.deleteMany({ projectId: id });
        await Task.deleteMany({ statusId: { $in: statusIds } });

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("❌ Failed to delete project:", error);
        res.status(500).json({ message: 'Failed to delete project', error: error.message });
    }
};

exports.getProjectByUserId = async (req, res) => {
    try {
        const userId = req.userId;

        const projects = await Project.find({ 'users.userId': userId })
            .populate('users.userId', 'name email profile');

        const projectsWithProgress = await Promise.all(projects.map(async (project) => {
            const statuses = await Status.find({ projectId: project._id });
            const doneStatus = statuses.find(status => status.isDone); 
            const statusIds = statuses.map(status => status._id);

            const tasks = await Task.find({ statusId: { $in: statusIds } });

            let totalWeight = 0;
            let completedWeight = 0;

            tasks.forEach(task => {
                const priority = task.priority || 1;
                totalWeight += priority;

                if (doneStatus && task.statusId.equals(doneStatus._id)) {
                    completedWeight += priority;
                }
            });

            const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

            return {
                ...project.toObject(),
                progress: Math.round(progress),
            };
        }));

        res.status(200).json(projectsWithProgress);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects', error });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔹 ดึงข้อมูล Project และ Users
        const project = await Project.findById(id).populate({
            path: 'users.userId',
            select: 'name email profile'
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // 🔹 ดึงข้อมูล Status ทั้งหมดของ Project
        const statuses = await Status.find({ projectId: id }).sort({ position: 1 });

        // 🔹 ดึง Tasks ทั้งหมดของ Project (ไม่ผูกกับ Status โดยตรง)
        const tasks = await Task.find({ statusId: { $in: statuses.map(status => status._id) } })
            .populate({
                path: 'assignees',
                select: 'name email profile'
            })
            .lean(); // 🔥 ใช้ lean() เพื่อลด Overhead

        // 🔹 สร้างโครงสร้าง Response ใหม่ (แยก Tasks ออกมา)
        const projectWithBoard = {
            ...project.toObject(),
            statuses: statuses.map(status => status.toObject()), // ✅ Status แยกออกมา
            tasks: tasks // ✅ Tasks อยู่แยกจาก Status
        };

        res.status(200).json(projectWithBoard);
    } catch (error) {
        console.error("Error fetching project:", error);
        return res.status(500).json({ message: 'Failed to fetch the project', error: error.message });
    }
};




exports.addUserToProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId; // ใช้ userId จาก Token
        const { role } = req.body; // รับเฉพาะ role

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            {
                $push: { users: { userId, role } },
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(updatedProject);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add user to project', error });
    }
};

exports.addFileToProject = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileName = req.body.fileName || req.file.originalname;
        const fileAddress = req.file.location;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isUserInProject = project.users.some(user => user.userId.toString() === req.userId);
        if (!isUserInProject) {
            return res.status(403).json({ message: 'Unauthorized to add file to this project' });
        }

        project.files.push({ fileName, fileAddress });
        await project.save();

        res.status(200).json({ message: 'File added successfully', project });
    } catch (error) {
        console.error("❌ Error adding file to project:", error);
        res.status(500).json({ message: 'Error adding file to project', error });
    }
};

exports.addContentToProject = async (req, res) => {
    try {
        const { id } = req.params; // รับค่า projectId
        const { title, content, isLink } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.contents.push({ title, content, isLink });
        await project.save();

        res.status(200).json({ message: 'Content added successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error adding content to project', error });
    }
};

exports.deleteContentFromProject = async (req, res) => {
    try {
        const { id, contentId } = req.params; // รับค่า projectId และ contentId

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.contents.pull({ _id: contentId });
        await project.save();

        res.status(200).json({ message: 'Content deleted successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting content from project', error });
    }
};

exports.deleteFileFromProject = async (req, res) => {
    try {
        const { id, fileId } = req.params; // รับค่า projectId และ fileId

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.files.pull({ _id: fileId });
        await project.save();

        res.status(200).json({ message: 'File deleted successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file from project', error });
    }
};

exports.addRoleToProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const newRole = { roleId: new mongoose.Types.ObjectId(), name, color };
        project.roles.push(newRole);
        await project.save();

        res.status(200).json({ message: 'Role added successfully', newRole });
    } catch (error) {
        res.status(500).json({ message: 'Error adding role to project', error });
    }
};

exports.updateRoleInProject = async (req, res) => {
    try {
        const { id, roleId } = req.params;
        const { name, color } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const role = project.roles.find(r => r.roleId.toString() === roleId);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        role.name = name || role.name;
        role.color = color || role.color;

        await project.save();
        res.status(200).json({ message: 'Role updated successfully', role });
    } catch (error) {
        res.status(500).json({ message: 'Error updating role', error });
    }
};

exports.deleteRoleFromProject = async (req, res) => {
    try {
        const { id, roleId } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.roles = project.roles.filter(r => r.roleId.toString() !== roleId);
        await project.save();

        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting role', error });
    }
};