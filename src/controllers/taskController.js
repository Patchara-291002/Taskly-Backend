const Task = require('../models/Task');
const Status = require('../models/Status');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
    try {
        const { projectId, statusId, taskName, detail, priority, startDate, dueDate, startTime, dueTime, assignees, roleId } = req.body;
        const creatorId = req.userId; // ID ของผู้ใช้ที่สร้าง task (จาก middleware authentication)

        // ✅ ถ้าไม่มี statusId -> ใช้ Status ตัวแรกของ Project
        let finalStatusId = statusId;
        if (!finalStatusId) {
            let defaultStatus = await Status.findOne({ projectId }).sort({ position: 1 });
            if (!defaultStatus) {
                // ✅ ถ้าไม่มี Status ใน Project ให้สร้าง "New status" ขึ้นมา
                defaultStatus = new Status({
                    projectId,
                    statusName: "New status",
                    color: "#D6D6D6",
                    position: 1,
                    isDone: false,
                });
                await defaultStatus.save();
            }
            finalStatusId = defaultStatus._id;
        }

        // ✅ ถ้าไม่มี roleId -> ใช้ Role ตัวแรกของ Project
        let finalRoleId = roleId;
        if (!finalRoleId) {
            const project = await Project.findById(projectId);
            if (!project || project.roles.length === 0) {
                return res.status(400).json({ message: "No roles found in the project" });
            }
            finalRoleId = project.roles[0].roleId; // ✅ ใช้ Default Role
        }

        // ✅ สร้าง array assignees ที่รวมผู้สร้าง
        let finalAssignees = Array.isArray(assignees) ? [...assignees] : [];

        // ✅ เพิ่มผู้สร้างเข้าไปใน assignees ถ้ายังไม่มี
        if (creatorId && !finalAssignees.includes(creatorId)) {
            finalAssignees.push(creatorId);
        }

        // ✅ สร้าง Task ใหม่
        const newTask = new Task({
            statusId: finalStatusId,
            roleId: finalRoleId,
            taskName,
            detail,
            priority,
            startDate,
            dueDate,
            startTime,
            dueTime,
            assignees: finalAssignees
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        console.error("❌ Error creating task:", error);
        res.status(500).json({ message: "Failed to create task", error });
    }
};



exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusId } = req.body;

        const task = await Task.findByIdAndUpdate(id, { statusId }, { new: true });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update task status', error });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params; // รับ taskId จาก URL
        const updatedData = req.body; // รับข้อมูลใหม่จาก request

        // ✅ ค้นหา Task ที่ต้องการอัปเดต
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // ✅ อัปเดตเฉพาะฟิลด์ที่ถูกส่งมาใน `req.body`
        Object.keys(updatedData).forEach((key) => {
            task[key] = updatedData[key];
        });

        // ✅ บันทึกการเปลี่ยนแปลงลง Database
        await task.save();

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ ดึง Task พร้อมข้อมูลพื้นฐาน
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        let roleOptions = [];
        let statusOptions = [];

        // ✅ ถ้ามี roleId -> ค้นหา Project และดึง roles ทั้งหมด
        if (task.roleId) {
            const project = await Project.findOne({ "roles.roleId": task.roleId });
            if (project) {
                roleOptions = project.roles; // ✅ ดึง role ทั้งหมดใน project นั้น
            }
        }

        // ✅ ถ้ามี statusId -> ค้นหา Project และดึง statuses ทั้งหมด
        if (task.statusId) {
            const status = await Status.findById(task.statusId);
            if (status) {
                const statuses = await Status.find({ projectId: status.projectId }).sort({ position: 1 });
                statusOptions = statuses; // ✅ ดึง status ทั้งหมดใน project นั้น
            }
        }

        res.status(200).json({
            task,
            roleOptions,
            statusOptions
        });
    } catch (error) {
        console.error("❌ Error fetching task with options:", error);
        res.status(500).json({ message: "Failed to fetch task", error });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
}

exports.getIncompleteTasks = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Find all projects where user is a member
        const projects = await Project.find({
            'users.userId': userId
        }, {
            'users.$': 1,  // Get only the matched user
            projectName: 1
        }).lean();

        if (!projects || projects.length === 0) {
            return res.status(200).json({
                success: true,
                tasks: []
            });
        }

        let allTasks = [];

        // 2. For each project, get tasks based on user's role
        for (const project of projects) {
            const userInProject = project.users[0]; // Get user's data in this project
            const userProjectRole = userInProject.projectRole?.roleId;

            if (!userProjectRole) continue;

            // Find tasks in this project with user's role
            const projectTasks = await Task.find({
                roleId: userProjectRole,
                statusId: {
                    $in: await Status.find({
                        projectId: project._id,
                        isDone: false
                    }).distinct('_id')
                }
            })
                .populate('statusId', 'statusName color projectId')
                .populate('roleId', 'name color')
                .lean();

            // Add project context to each task
            const tasksWithContext = projectTasks.map(task => ({
                _id: task._id,
                taskName: task.taskName,
                detail: task.detail,
                priority: task.priority,
                startDate: task.startDate,
                dueDate: task.dueDate,
                startTime: task.startTime,
                dueTime: task.dueTime,
                project: {
                    id: project._id,
                    name: project.projectName
                },
                status: task.statusId ? {
                    id: task.statusId._id,
                    name: task.statusId.statusName,
                    color: task.statusId.color
                } : null,
                role: task.roleId ? {
                    id: task.roleId._id,
                    name: task.roleId.name,
                    color: task.roleId.color
                } : null
            }));

            allTasks = [...allTasks, ...tasksWithContext];
        }

        // Sort by due date (closest first)
        allTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        res.status(200).json({
            success: true,
            tasks: allTasks
        });

    } catch (error) {
        console.error("❌ Error fetching incomplete tasks:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน',
            error: error.message
        });
    }
};

exports.getProjectIdByTaskId = async (req, res) => {
    try {
        const { taskId } = req.params;

        // หา task และ populate statusId เพื่อเข้าถึง projectId
        const task = await Task.findById(taskId)
            .populate('statusId', 'projectId')
            .lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบ Task ที่ระบุ'
            });
        }

        if (!task.statusId || !task.statusId.projectId) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล Project ที่เกี่ยวข้อง'
            });
        }

        res.status(200).json({
            success: true,
            projectId: task.statusId.projectId
        });

    } catch (error) {
        console.error("❌ Error fetching project ID:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Project',
            error: error.message
        });
    }
};

exports.moveTaskToDone = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { projectId } = req.body;

        // Validate required fields
        if (!taskId || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'ต้องระบุ taskId และ projectId'
            });
        }

        // Find task
        const task = await Task.findById(taskId)
            .populate('statusId', 'projectId')
            .lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบ Task ที่ระบุ'
            });
        }

        // Verify task belongs to the specified project
        if (task.statusId.projectId.toString() !== projectId) {
            return res.status(403).json({
                success: false,
                message: 'Task นี้ไม่ได้อยู่ในโปรเจคที่ระบุ'
            });
        }

        // Find Done status in the project
        const doneStatus = await Status.findOne({
            projectId: projectId,
            isDone: true
        });

        if (!doneStatus) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบสถานะ Done ในโปรเจคนี้'
            });
        }

        // Update task status to Done
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { statusId: doneStatus._id },
            { new: true }
        ).populate('statusId', 'statusName color isDone');

        res.status(200).json({
            success: true,
            message: 'ย้าย Task ไปยังสถานะ Done สำเร็จ',
            task: {
                _id: updatedTask._id,
                taskName: updatedTask.taskName,
                status: {
                    id: updatedTask.statusId._id,
                    name: updatedTask.statusId.statusName,
                    color: updatedTask.statusId.color
                }
            }
        });

    } catch (error) {
        console.error("❌ Error moving task to done:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการย้าย Task',
            error: error.message
        });
    }
};

