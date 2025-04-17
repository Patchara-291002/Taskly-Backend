const Project = require('../models/Project');
const Status = require('../models/Status');
const Task = require('../models/Task');
const { deleteFileFromS3 } = require('./uploadController');

const mongoose = require('mongoose')

exports.createProject = async (req, res) => {
    try {
        const { projectName, startDate, dueDate } = req.body;
        const userId = req.userId;

        // ✅ ตรวจสอบ startDate และ dueDate
        const projectStartDate = new Date(startDate).toISOString();
        const projectDueDate = new Date(dueDate).toISOString();

        // ✅ สร้าง Project ใหม่
        const newProject = new Project({
            projectName,
            users: [{ userId, role: "owner" }],
            startDate: projectStartDate,
            dueDate: projectDueDate,
            contents: Array(5).fill({ title: "Empty", content: "Empty", isLink: false }),
            roles: [{ roleId: new mongoose.Types.ObjectId(), name: "None", color: "#D6D6D6" }]
        });

        await newProject.save();

        // ✅ กำหนดสถานะเริ่มต้นของโปรเจค
        const statusData = [
            { statusName: "Todo", color: "#FF5733", position: 1, isDone: false },
            { statusName: "Doing", color: "#33FF57", position: 2, isDone: false },
            { statusName: "Done", color: "#3357FF", position: 3, isDone: true }
        ];

        // ✅ สร้าง Status ในฐานข้อมูล
        const statuses = await Status.insertMany(
            statusData.map((s) => ({ ...s, projectId: newProject._id }))
        );

        res.status(201).json({ ...newProject.toObject(), statuses });
    } catch (error) {
        console.error("❌ Error creating project:", error);
        res.status(500).json({ message: "Error creating project", error: error.message });
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
        const userId = req.userId;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบโปรเจกต์'
            });
        }

        // ตรวจสอบว่าผู้ใช้เป็น owner หรือไม่
        const userInProject = project.users.find(user =>
            user.userId.toString() === userId
        );

        if (!userInProject) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้ในโปรเจกต์'
            });
        }

        if (userInProject.role === 'owner') {
            // ถ้าเป็น owner ให้ลบทั้งโปรเจค
            const statuses = await Status.find({ projectId: id });
            const statusIds = statuses.map(status => status._id);

            // ลบ Status และ Task ที่เกี่ยวข้อง
            await Status.deleteMany({ projectId: id });
            await Task.deleteMany({ statusId: { $in: statusIds } });
            await Project.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                message: 'ลบโปรเจกต์สำเร็จ'
            });
        } else {
            // ถ้าเป็น member ให้ลบแค่ผู้ใช้ออกจากโปรเจค
            project.users = project.users.filter(user =>
                user.userId.toString() !== userId
            );
            await project.save();

            return res.status(200).json({
                success: true,
                message: 'ออกจากโปรเจกต์สำเร็จ'
            });
        }
    } catch (error) {
        console.error("❌ Error in project operation:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดำเนินการ',
            error: error.message
        });
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
        const doneStatus = statuses.find(status => status.isDone);

        // 🔹 ดึง Tasks ทั้งหมดของ Project
        const tasks = await Task.find({
            statusId: { $in: statuses.map(status => status._id) }
        })
            .populate({
                path: 'assignees',
                select: 'name email profile'
            })
            .lean();

        // 🔹 คำนวณ Progress
        let totalWeight = 0;
        let completedWeight = 0;

        tasks.forEach(task => {
            const priority = task.priority || 1;
            totalWeight += priority;

            if (doneStatus && task.statusId.equals(doneStatus._id)) {
                completedWeight += priority;
            }
        });

        const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

        // 🔹 สร้างโครงสร้าง Response
        const projectWithBoard = {
            ...project.toObject(),
            progress: progress,
            statuses: statuses.map(status => status.toObject()),
            tasks: tasks
        };

        res.status(200).json(projectWithBoard);
    } catch (error) {
        console.error("Error fetching project:", error);
        return res.status(500).json({
            message: 'Failed to fetch the project',
            error: error.message
        });
    }
};




exports.addUserToProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบโปรเจกต์'
            });
        }

        // ตรวจสอบว่าผู้ใช้อยู่ในโปรเจคแล้วหรือไม่
        const isUserAlreadyInProject = project.users.some(user =>
            user.userId.toString() === userId
        );

        if (isUserAlreadyInProject) {
            return res.status(200).json({
                success: true,
                message: 'ผู้ใช้อยู่ในโปรเจคอยู่แล้ว',
                project
            });
        }

        // เพิ่มผู้ใช้ใหม่ โดยกำหนดให้เป็น member โดยอัตโนมัติ
        const updatedProject = await Project.findByIdAndUpdate(
            id,
            {
                $push: { users: { userId, role: "member" } },
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.status(201).json({
            success: true,
            message: 'เพิ่มผู้ใช้เข้าโปรเจคสำเร็จ',
            project: updatedProject
        });
    } catch (error) {
        console.error("❌ Error adding user to project:", error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้',
            error: error.message
        });
    }
};

exports.addFileToProject = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบโปรเจกต์'
            });
        }

        const isUserInProject = project.users.some(user => user.userId.toString() === req.userId);
        if (!isUserInProject) {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เพิ่มไฟล์ในโปรเจกต์นี้'
            });
        }

        // แปลงชื่อไฟล์เป็น UTF-8
        const originalFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        // เพิ่มไฟล์ด้วยชื่อที่ถูกแปลงแล้ว
        project.files.push({
            fileName: originalFileName,
            fileAddress: req.file.location
        });

        await project.save();

        res.status(200).json({
            success: true,
            message: 'เพิ่มไฟล์สำเร็จ',
            file: {
                fileName: originalFileName,
                fileUrl: req.file.location
            }
        });
    } catch (error) {
        console.error("❌ Error adding file to project:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มไฟล์',
            error: error.message
        });
    }
};

exports.deleteFileFromProject = async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบโปรเจกต์'
            });
        }

        // ตรวจสอบสิทธิ์ผู้ใช้
        const isUserInProject = project.users.some(user => user.userId.toString() === req.userId);
        if (!isUserInProject) {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์ลบไฟล์ในโปรเจกต์นี้'
            });
        }

        // หาไฟล์ที่จะลบ
        const fileToDelete = project.files.find(file => file._id.toString() === fileId);
        if (!fileToDelete) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบไฟล์ที่ต้องการลบ'
            });
        }

        try {
            // ดึง key จาก URL โดยใช้ URL object
            const fileUrl = new URL(fileToDelete.fileAddress);
            // ตัด / ตัวแรกออกจาก pathname
            const key = decodeURIComponent(fileUrl.pathname.substring(1));

            console.log('Attempting to delete file with key:', key); // logging เพื่อตรวจสอบ

            // ลบไฟล์จาก S3
            await deleteFileFromS3(key);
            console.log('Successfully deleted from S3'); // logging เพื่อตรวจสอบ

            // ลบไฟล์จาก database
            project.files.pull({ _id: fileId });
            await project.save();

            res.status(200).json({
                success: true,
                message: 'ลบไฟล์สำเร็จ',
                deletedFile: fileToDelete
            });
        } catch (deleteError) {
            console.error('Error during file deletion:', deleteError);
            throw deleteError;
        }
    } catch (error) {
        console.error("❌ Error deleting file:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบไฟล์',
            error: error.message
        });
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

exports.updateUserProjectRole = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const { roleId } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบโปรเจกต์'
            });
        }

        // ตรวจสอบว่า role ที่จะกำหนดมีอยู่ในโปรเจคหรือไม่
        const roleExists = project.roles.some(role => role.roleId.toString() === roleId);
        if (!roleExists) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบบทบาทที่ระบุในโปรเจคนี้'
            });
        }

        // หาและอัพเดท user's project role
        const userIndex = project.users.findIndex(user => user.userId.toString() === userId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้ในโปรเจคนี้'
            });
        }

        // อัพเดทบทบาทและเวลา
        project.users[userIndex].projectRole = {
            roleId: roleId,
            assignedAt: new Date()
        };

        await project.save();

        res.status(200).json({
            success: true,
            message: 'อัพเดทบทบาทสำเร็จ',
            user: project.users[userIndex]
        });

    } catch (error) {
        console.error("❌ Error updating user project role:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทบทบาท',
            error: error.message
        });
    }
};