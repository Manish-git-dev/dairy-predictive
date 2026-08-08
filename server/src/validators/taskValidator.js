const { z } = require('zod');

const taskStatus = z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']);
const taskPriority = z.enum(['low', 'medium', 'high', 'critical']);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().optional().default(''),
  type: z.string().trim().min(1).max(80).default('operational'),
  stage: z.string().optional(),
  assignedTo: z.string().min(24).optional().nullable(),
  priority: taskPriority.default('medium'),
  status: taskStatus.default('pending'),
  dueDate: z.string().datetime().optional().nullable(),
  relatedEntity: z.object({
    type: z.string().min(1),
    id: z.string().min(1)
  }).optional(),
  notes: z.array(z.object({ text: z.string().min(1) })).optional()
});

const updateTaskSchema = createTaskSchema.partial();

const updateStatusSchema = z.object({ status: taskStatus });
const assignTaskSchema = z.object({ assigneeId: z.string().min(24).nullable() });
const addNoteSchema = z.object({ text: z.string().trim().min(1).max(2000) });
const escalateSchema = z.object({
  escalatedTo: z.string().min(24),
  escalationReason: z.string().min(1)
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  assignTaskSchema,
  addNoteSchema,
  escalateSchema
};
