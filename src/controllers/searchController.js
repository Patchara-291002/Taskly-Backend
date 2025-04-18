const Project = require('../models/Project');
const Task = require('../models/Task');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.globalSearch = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.userId;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchRegex = new RegExp(query, 'i');

        const [projects, tasks, courses, assignments] = await Promise.all([
            // ค้นหา Projects
            Project.find({
                'users.userId': userId,
                projectName: searchRegex
            }).select('projectName description'),

            // ค้นหา Tasks
            Task.find({
                $or: [
                    { taskName: searchRegex },
                    { detail: searchRegex }
                ]
            })
            .populate({
                path: 'statusId',
                select: 'projectId',
                populate: {
                    path: 'projectId',
                    select: '_id'
                }
            })
            .select('taskName detail'),

            // ค้นหา Courses
            Course.find({
                userId: userId,
                courseName: searchRegex
            }).select('courseName description'),

            // ค้นหา Assignments
            Assignment.find({
                userId: userId,
                assignmentName: searchRegex
            })
            .populate('courseId', '_id')
            .select('assignmentName description courseId')
        ]);

        const results = [
            ...projects.map(p => ({
                type: 'project',
                name: p.projectName,
                description: p.description,
                link: `/home/project/${p._id}`,
                score: calculateRelevance(query, p.projectName)
            })),
            ...tasks.map(t => ({
                type: 'task',
                name: t.taskName,
                description: t.detail,
                link: `/home/project/${t.statusId?.projectId?._id || ''}`,
                score: calculateRelevance(query, t.taskName)
            })),
            ...courses.map(c => ({
                type: 'course',
                name: c.courseName,
                description: c.description,
                link: `/home/study/${c._id}`,
                score: calculateRelevance(query, c.courseName)
            })),
            ...assignments.map(a => ({
                type: 'assignment',
                name: a.assignmentName,
                description: a.description,
                link: `/home/study/${a.courseId?._id || ''}`,
                score: calculateRelevance(query, a.assignmentName)
            }))
        ];

        // เรียงลำดับตามความเกี่ยวข้อง
        results.sort((a, b) => b.score - a.score);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing search'
        });
    }
};

function calculateRelevance(query, text) {
    if (!query || !text) return 0;
    
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    if (text === query) return 1;
    if (text.startsWith(query)) return 0.8;
    if (text.includes(query)) return 0.6;
    
    return 1 - (levenshteinDistance(query, text) / Math.max(query.length, text.length));
}

function levenshteinDistance(str1, str2) {
    if (!str1 || !str2) return 0;

    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }

    return track[str2.length][str1.length];
}

module.exports = exports;