const Status = require('../models/Status');
const Project = require('../models/Project');

exports.createStatus = async (req, res) => {
    try {
        const { projectId, statusName, color } = req.body

        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ message: 'Project not found' })
        }

        const newStatus = new Status({
            projectId,
            statusName,
            color,
        });

        await newStatus.save();

        res.status(201).json(newStatus);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create status', error })
    }
}

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusName, color } = req.body;

        const updatedStatatus = await Status.findByIdAndUpdate(
            id,
            {
                statusName,
                color,
                updatedAt: Date.now()
            },
            {
                new: true
            }
        )

        if (!updatedStatatus) {
            return res.status(404).json({ message: 'Status not found' });
        }

        res.status(200).json(updatedStatatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update status', error });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedStatus = await Status.findByIdAndDelete(id);

        if (!deletedStatus) {
            return res.status(404).json({ message: 'Status not found' });
        }

        res.status(200).json({ message: 'Status deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete status', error });
    }
};