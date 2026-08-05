const { z } = require('zod');

const createMilkLotSchema = z.object({
  farmer: z.string().min(24),
  collectionCentre: z.string().min(24),
  shift: z.enum(['morning', 'evening']),
  quantityLitres: z.number().positive(),
  temperature: z.number(),
  quality: z.object({
    fat: z.number().optional(),
    snf: z.number().optional(),
    clr: z.number().optional(),
    acidity: z.number().optional(),
    adulterants: z.array(z.string()).optional()
  }).optional()
});

const updateMilkLotSchema = createMilkLotSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['collected', 'tested', 'rejected', 'transporting', 'received', 'processed'])
});

module.exports = { createMilkLotSchema, updateMilkLotSchema, updateStatusSchema };
