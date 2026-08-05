const { z } = require('zod');

const createQualityTestSchema = z.object({
  milkLot: z.string().min(24),
  collectionCentre: z.string().min(24),
  parameters: z.object({
    fat: z.number().optional(),
    snf: z.number().optional(),
    clr: z.number().optional(),
    pH: z.number().optional(),
    temperature: z.number().optional(),
    density: z.number().optional(),
    acidity: z.number().optional(),
    adulteration: z.array(z.string()).optional()
  }),
  result: z.enum(['passed', 'failed', 'conditional']),
  grade: z.enum(['A', 'B', 'C', 'reject']),
  notes: z.string().optional()
});

const updateQualityTestSchema = createQualityTestSchema.partial();

module.exports = { createQualityTestSchema, updateQualityTestSchema };
