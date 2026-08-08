const { z } = require('zod');

const statusValues = ['draft', 'pending', 'in_progress', 'blocked', 'completed', 'cancelled'];
const priorityValues = ['low', 'medium', 'high', 'critical'];

const baseWorkflow = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  priority: z.enum(priorityValues).default('medium'),
  status: z.enum(statusValues).default('draft'),
  owner: z.string().min(1),
  assignedUsers: z.array(z.string().min(1)).default([]),
  slaMinutes: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
  startTime: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  relatedOperation: z.string().trim().max(160).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal(''))
});

const createWorkflowSchema = baseWorkflow;
const updateWorkflowSchema = baseWorkflow.partial();
const transitionWorkflowSchema = z.object({ status: z.enum(statusValues) });

module.exports = { createWorkflowSchema, updateWorkflowSchema, transitionWorkflowSchema };
