const Project = require('../models/Project');
const Status = require('../models/Status');
const Task = require('../models/Task');

exports.getAllProject = async (req, res) => {
    try {
        const projects = await Project.find().populate({
            path: 'users.userId',
            select: 'displayName profilePicture'
        });

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects', error });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { projectName, startDate, dueDate } = req.body;
        const userId = req.userId;

        // ✅ บังคับใช้ ISO 8601 เพื่อป้องกันปัญหา Timezone
        const projectStartDate = new Date(startDate).toISOString();
        const projectDueDate = new Date(dueDate).toISOString();

        // ✅ สร้าง Project
        const newProject = new Project({
            projectName,
            users: [{ userId, role: 'owner' }],
            startDate: projectStartDate,
            dueDate: projectDueDate
        });

        await newProject.save();

        // ✅ กำหนด Status ที่ต้องสร้างอัตโนมัติ
        const statusNames = ['Todo', 'Doing', 'Done'];
        const statusColors = ['#FF5733', '#33FF57', '#3357FF']; // สามารถเพิ่มสีอื่นๆ ได้

        // ✅ สร้าง Status และบันทึกลง Database
        const statuses = await Promise.all(statusNames.map(async (statusName, index) => {
            const status = new Status({
                projectId: newProject._id,
                statusName,
                position: index + 1,
                color: statusColors[index % statusColors.length] // เลือกสีแบบวนซ้ำ
            });
            return status.save();
        }));

        // ✅ หาสถานะ "Todo" เพื่อกำหนด Task เริ่มต้น
        const todoStatus = statuses.find(status => status.statusName === 'Todo');
        if (!todoStatus) {
            throw new Error('Failed to find default status "Todo"');
        }

        // ✅ กำหนดเวลา StartDate และ EndDate ของ Task
        const taskStartDate = new Date(startDate);
        const taskEndDate = new Date(taskStartDate);
        taskEndDate.setDate(taskEndDate.getDate() + 2); // End Date +2 วันจาก Start Date

        // ✅ แปลงเป็น ISO 8601 (UTC)
        const formattedTaskStartDate = taskStartDate.toISOString();
        const formattedTaskEndDate = taskEndDate.toISOString();

        // ✅ สร้าง Task เริ่มต้น
        const newTask = new Task({
            taskName: `New task`,
            detail: 'This is an automatically generated task.',
            statusId: todoStatus._id, 
            priority: 1,
            startDate: formattedTaskStartDate,
            dueDate: formattedTaskEndDate,
            dueTime: "09:00", // Default เป็น 9:00 AM
            assignees: [userId]
        });

        await newTask.save();

        // ✅ ดึง Project พร้อม Status และ Task ที่เพิ่งสร้าง
        const populatedProject = await Project.findById(newProject._id)
            .populate('users.userId', 'displayName profilePicture');

        res.status(201).json({
            ...populatedProject.toObject(),
            statuses,
            tasks: [newTask]
        });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: 'Error creating project', error });
    }
};


exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, startDate, dueDate } = req.body;

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { projectName, startDate, dueDate, updatedAt: Date.now() },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update project', error });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProject = await Project.findByIdAndDelete(id);

        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete project', error });
    }
};

exports.getProjectByUserId = async (req, res) => {
    try {
        const userId = req.userId;

        const projects = await Project.find({ 'users.userId': userId })
            .populate('users.userId', 'name email profile');

        const projectsWithProgress = await Promise.all(projects.map(async (project) => {
            const statuses = await Status.find({ projectId: project._id });
            const doneStatus = statuses.find(status => status.statusName === 'Done');
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

        const project = await Project.findById(id).populate({
            path: 'users.userId',
            select: 'name email profile'
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const statuses = await Status.find({ projectId: id }).sort({ position: 1 });

        const boardWithTasks = await Promise.all(
            statuses.map(async (status) => {
                const tasks = await Task.find({ statusId: status._id })
                    .populate({
                        path: 'assignees',
                        select: 'name email profile'
                    });

                return {
                    ...status.toObject(),
                    tasks: tasks
                };
            })
        );

        const projectWithBoard = {
            ...project.toObject(),
            status: boardWithTasks
        };

        res.status(200).json(projectWithBoard);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch the project', error });
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
