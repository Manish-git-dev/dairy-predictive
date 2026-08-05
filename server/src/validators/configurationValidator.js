const { z } = require('zod');

const createConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z.enum(['general', 'quality', 'pricing', 'sla', 'notification', 'system']),
  description: z.string().optional()
});

const updateConfigSchema = z.object({
  value: z.any(),
  category: z.enum(['general', 'quality', 'pricing', 'sla', 'notification', 'system']).optional(),
  description: z.string().optional()
});

module.exports = { createConfigSchema, updateConfigSchema };
