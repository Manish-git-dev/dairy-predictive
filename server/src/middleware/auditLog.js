const AuditLog = require('../models/AuditLog');

const auditLog = (resourceName) => {
  return async (req, res, next) => {
    // Capture original send function
    const originalSend = res.send;
    
    // Store request body as 'before' state for simplicity, or we can fetch the old record
    // Usually for real audit logs on UPDATE, we would fetch the DB record before mutation.
    // For this boilerplate, we'll log the mutation attempt and user.
    const changes = {
      body: req.body,
      query: req.query
    };

    res.send = function(data) {
      res.send = originalSend;
      
      // Determine action from HTTP method
      const actionMap = {
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete',
        'GET': 'read'
      };
      
      const action = actionMap[req.method] || req.method;
      
      // We log asynchronously
      if (req.user && req.organizationId && action !== 'read') {
        const logEntry = new AuditLog({
          action,
          resource: resourceName,
          resourceId: req.params.id || null, // Best guess
          user: req.user._id,
          organization: req.organizationId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          changes: {
            requestPayload: req.body
          }
        });
        
        logEntry.save().catch(err => console.error('Failed to save audit log:', err));
      }
      
      return res.send(data);
    };
    
    next();
  };
};

module.exports = auditLog;
