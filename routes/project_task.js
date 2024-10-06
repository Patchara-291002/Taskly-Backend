const express = require('express');
const router = express.Router();
const ProjectTask = require('../models/ProjectTask');

router.post('/create', async (req, res) => {
    const { taskName, taskDescription, projectId } = req.body;
    try {
        const newProjectTask = new ProjectTask({
            taskName,
            taskDescription,
            projectId
        });
        await newProjectTask.save();
        res.status(201).json(newProjectTask);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
