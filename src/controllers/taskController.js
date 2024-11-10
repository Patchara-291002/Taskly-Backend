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