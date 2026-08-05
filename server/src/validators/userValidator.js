const { z } = require('zod');

const createUserSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase, one lowercase, and one number'),
  phone: z.string().optional(),
  role: z.enum(['ops_admin', 'manager', 'analyst', 'field_staff']),
  organization: z.string().optional()
});

const updateUserSchema = createUserSchema.omit({ password: true }).partial();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase, one lowercase, and one number')
});

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema };
