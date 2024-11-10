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
}

exports.createProject = async (req, res) => {
    try {
        const { projectName, startDate, dueDate } = req.body;
        const userId = req.userId;

        const newProject = new Project({
            projectName,
            users: [{ userId, role: 'owner' }],
            startDate,
            dueDate
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
        const { projectName, startDate, dueDate } = req.body

        const updateProject = await Project.findByIdAndUpdate(
            id,
            { projectName, startDate, dueDate, updatedAt: Date.now() },
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

exports.getProjectByUserId = async (req, res) => {
    try {
        const { id } = req.params;

        const projects = await Project.find({ 'users.userId': id }).populate('users.userId', 'displayName profilePicture');

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

                // Check if task status matches the "Done" status
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
            select: 'displayName profilePicture'
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
                    select: 'displayName profilePicture'
                })
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
        const { userId, role } = req.body;

        const updateProject = await Project.findByIdAndUpdate(
            id,
            {
                $push: { users: { userId, role } },
                updateAt: Date.now()
            },
            { new: true } // return new value affter updated
        )

        if (!updateProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(updateProject);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add user to project', error })
    }
};