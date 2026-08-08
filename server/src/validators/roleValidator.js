const { z } = require('zod');

const roleNames = ['ops_admin', 'manager', 'analyst', 'field_staff'];
const actions = ['create', 'read', 'update', 'delete'];

const permissionSchema = z.object({
  resource: z.string().trim().min(1).max(100),
  actions: z.array(z.enum(actions)).min(1).max(actions.length)
});

const createRoleSchema = z.object({
  name: z.enum(roleNames),
  displayName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(permissionSchema).max(100).default([])
}).strict();

const updateRoleSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(permissionSchema).max(100).optional()
}).strict();

module.exports = {
  createRoleSchema,
  updateRoleSchema
};
