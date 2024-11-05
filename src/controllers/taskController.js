const Task = require('../models/Task');
const Status = require('../models/Status');

exports.createTask = async (req, res) => {
    try {
        const { statusId, taskName, detail, tag, priority, color, startDate, dueDate, statTime, dueTime, assignees } = req.body;

        const status = await Status.findById(statusId);
        if (!status) {
            return res.status(404).json({ message: 'Status not found' });
        }

        const newTask = new Task({
            statusId,
            taskName,
            detail,
            tag,
            priority,
            color,
            startDate,
            dueDate,
            statTime,
            dueTime,
            assignees
        });
        await newTask.save();

        res.status(201).json(newTask);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create task', error });
    }
}