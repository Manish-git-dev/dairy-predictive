const { z } = require('zod');

const updateWorkflowStageSchema = z.object({
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
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.string().min(1),
  notes: z.string().optional()
});

module.exports = { updateWorkflowStageSchema };
