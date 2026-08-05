const { z } = require('zod');

const createAlertSchema = z.object({
  type: z.enum(['quality', 'temperature', 'delay', 'volume', 'maintenance', 'system']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(1),
  message: z.string(),
  relatedEntity: z.object({
    entityType: z.string(),
    entityId: z.string()
  }).optional()
});

const acknowledgeSchema = z.object({});

module.exports = { createAlertSchema, acknowledgeSchema };
