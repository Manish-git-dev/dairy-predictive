const { z } = require('zod');

const createSlaRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stage: z.enum([
    'initiation',
    'validation',
    'approval_pending',
    'in_progress',
    'quality_check',
    'resolution',
    'final_review',
    'completed',
    'archived'
  ]),
  metric: z.string(),
  threshold: z.number(),
  unit: z.string(),
  escalationTime: z.number().int().nonnegative(),
  escalationRole: z.string(),
  notifyRoles: z.array(z.string()),
  isActive: z.boolean().default(true)
});

const updateSlaRuleSchema = createSlaRuleSchema.partial();

module.exports = { createSlaRuleSchema, updateSlaRuleSchema };
