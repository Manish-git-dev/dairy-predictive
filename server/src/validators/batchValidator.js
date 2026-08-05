const { z } = require('zod');

const createBatchSchema = z.object({
  milkLots: z.array(z.string().min(24)).min(1),
  processingDate: z.string().datetime(),
  product: z.string().min(24).optional()
});

const updateBatchSchema = createBatchSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['planned', 'processing', 'completed', 'failed', 'quarantined'])
});

module.exports = { createBatchSchema, updateBatchSchema, updateStatusSchema };
