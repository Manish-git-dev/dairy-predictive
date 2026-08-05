const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['milk', 'curd', 'butter', 'ghee', 'paneer', 'cheese', 'powder', 'other']),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
  shelfLifeDays: z.number().int().positive(),
  storageTemperature: z.number()
});

const updateProductSchema = createProductSchema.partial();

module.exports = { createProductSchema, updateProductSchema };
