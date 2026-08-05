module.exports = {
  ROLES: {
    OPS_ADMIN: 'ops_admin',
    MANAGER: 'manager',
    ANALYST: 'analyst',
    FIELD_STAFF: 'field_staff'
  },
  WORKFLOW_STAGES: ['collection', 'testing', 'chilling', 'transport', 'processing', 'packaging', 'distribution', 'settlement', 'farmer_support'],
  TASK_STATUSES: ['pending', 'assigned', 'in_progress', 'completed', 'escalated', 'cancelled'],
  TASK_PRIORITIES: ['low', 'medium', 'high', 'critical'],
  APPROVAL_STATUSES: ['pending', 'approved', 'rejected', 'overridden'],
  ANOMALY_SEVERITIES: ['low', 'medium', 'high', 'critical'],
  MILK_QUALITY_GRADES: ['A', 'B', 'C', 'rejected'],
  PAYMENT_STATUSES: ['pending', 'calculated', 'approved', 'disbursed', 'disputed', 'settled'],
  TANKER_STATUSES: ['available', 'in_transit', 'loading', 'unloading', 'maintenance'],
  NOTIFICATION_TYPES: ['alert', 'task', 'approval', 'anomaly', 'sla_breach', 'system'],
  PRODUCT_CATEGORIES: ['milk', 'butter', 'cheese', 'yogurt', 'cream', 'powder', 'ghee'],
  AI_ACTION_TYPES: ['explanation', 'recommendation', 'risk_score', 'forecast']
};
