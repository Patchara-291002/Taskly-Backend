const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');

// ดึงข้อมูลโปรเจคต์ทั้งหมด
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find().populate('users');
        res.json(projects);
    } catch (err) {
        res.status(500).send(err);
    }
});

// สร้างโปรเจคต์ใหม่
router.post('/create', async (req, res) => {
    const { projectName, usersId } = req.body;
    try {
        const newProject = new Project({ projectName, users: usersId });
        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).send(err);
    }
});

// อัปเดตโปรเจคต์
router.put('/update/:projectId', async (req, res) => {
    const { projectName, users } = req.body;  // users ที่ส่งมาใน body
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }
        project.projectName = projectName;
        project.users = users;
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).send(err);
    }
});

// ลบโปรเจคต์
router.delete('/delete/:projectId', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).send(err);
    }
});

// ดึงข้อมูลโปรเจคต์ตาม projectId
router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('users')       
            .populate({
                path: 'tasks',            
                model: 'ProjectTask'
            });

        if (!project) {
            return res.status(404).send('Project not found');
        }

        res.json(project);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/task/create', async (req, res) => {
    const { taskName, taskDescription, projectId } = req.body;
    try {
        const newProjectTask = new ProjectTask({
            taskName,
            taskDescription,
            projectId
        });
        await newProjectTask.save();

        const project = await Project.findById(projectId);
        project.tasks.push(newProjectTask._id);  
        await project.save();

        res.status(201).json(newProjectTask);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
