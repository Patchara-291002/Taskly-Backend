const Task = require('../models/Task');
const Status = require('../models/Status');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
    try {
        const { projectId, statusId, taskName, detail, priority, startDate, dueDate, startTime, dueTime, assignees, roleId } = req.body;

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
            assignees
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