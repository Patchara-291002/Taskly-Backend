const cron = require('node-cron');
const ProjectTaskNotifier = require('./notification/projectTaskNotifier');
const TaskDeadlineNotifier = require('./notification/taskDeadlineNotifier');
const AssignmentDeadlineNotifier = require('./notification/assignmentDeadineNotifier');

function NotificationServices() {
    console.log('Initializing notification services...');

    ProjectTaskNotifier.initialize();
    TaskDeadlineNotifier.initialize();
    AssignmentDeadlineNotifier.initialize();
    console.log('All notification services initialized');
}

module.exports = { NotificationServices };