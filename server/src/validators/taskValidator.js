const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  type: z.string(),
  stage: z.enum(['todo', 'in_progress', 'review', 'done']),
  assignedTo: z.string().min(24),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().datetime(),
  relatedEntity: z.object({
    entityType: z.string(),
    entityId: z.string()
  }).optional()
});

const updateTaskSchema = createTaskSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done'])
});

const addNoteSchema = z.object({
  text: z.string().min(1)
});

const escalateSchema = z.object({
  escalatedTo: z.string().min(24),
  escalationReason: z.string().min(1)
});

module.exports = { createTaskSchema, updateTaskSchema, updateStatusSchema, addNoteSchema, escalateSchema };
