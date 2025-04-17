const cron = require('node-cron');
const ProjectTaskNotifier = require('./notification/projectTaskNotifier');

function initializeNotificationServices() {
    console.log('Initializing notification services...');

    // เริ่มการทำงานของ ProjectTaskNotifier
    ProjectTaskNotifier.initialize();

    console.log('All notification services initialized');
}

module.exports = { initializeNotificationServices };