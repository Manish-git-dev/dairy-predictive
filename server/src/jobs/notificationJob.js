// Job to check for SLA breaches and create notifications
const Task = require('../models/Task');
const SlaRule = require('../models/SlaRule');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const { v4: uuidv4 } = require('uuid'); // NO! Don't use uuid. Use a simple ID generator.

// Use a simple counter-based ID generation:
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

const runNotificationJob = async () => {
  try {
    console.log('[NotificationJob] Checking for SLA breaches...');
    const orgs = await Organization.find({ isActive: true });
    
    for (const org of orgs) {
      // Find tasks that are overdue
      const overdueTasks = await Task.find({
        organization: org._id,
        status: { $in: ['pending', 'assigned', 'in_progress'] },
        dueDate: { $lt: new Date() },
        slaBreached: { $ne: true }
      }).populate('assignedTo');
      
      for (const task of overdueTasks) {
        task.slaBreached = true;
        await task.save();
        
        // Create alert
        await Alert.create({
          alertId: generateId('ALT'),
          type: 'sla_breach',
          severity: task.priority === 'critical' ? 'critical' : 'high',
          title: `SLA Breach: ${task.title}`,
          message: `Task ${task.taskId} has breached its SLA. Due date was ${task.dueDate.toISOString()}.`,
          relatedEntity: { type: 'Task', id: task._id },
          organization: org._id
        });
        
        // Notify assigned user
        if (task.assignedTo) {
          await Notification.create({
            type: 'sla_breach',
            title: 'SLA Breach Alert',
            message: `Your task "${task.title}" has breached its SLA deadline.`,
            recipient: task.assignedTo._id,
            priority: 'high',
            relatedEntity: { type: 'Task', id: task._id },
            organization: org._id
          });
        }
      }
      
      console.log(`[NotificationJob] Org ${org.name}: ${overdueTasks.length} SLA breaches found.`);
    }
    
    console.log('[NotificationJob] Completed.');
  } catch (error) {
    console.error('[NotificationJob] Fatal error:', error.message);
  }
};

module.exports = { runNotificationJob };
