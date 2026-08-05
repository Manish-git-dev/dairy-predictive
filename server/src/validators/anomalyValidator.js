const { z } = require('zod');

const updateStatusSchema = z.object({
  status: z.enum(['detected', 'investigating', 'resolved', 'false_positive']),
  resolution: z.string().optional()
});

module.exports = { updateStatusSchema };
