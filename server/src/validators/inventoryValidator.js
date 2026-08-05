const { z } = require('zod');

const createInventorySchema = z.object({
  product: z.string().min(24),
  batch: z.string().min(24).optional(),
  quantity: z.number().nonnegative(),
  unit: z.string(),
  location: z.string(),
  expiryDate: z.string().datetime(),
  minimumStock: z.number().nonnegative(),
  reorderPoint: z.number().nonnegative()
});

const updateInventorySchema = createInventorySchema.partial();

module.exports = { createInventorySchema, updateInventorySchema };
