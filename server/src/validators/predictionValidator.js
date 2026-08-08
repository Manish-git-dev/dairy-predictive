const { z } = require('zod');

const generatePredictionSchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30)
});

module.exports = { generatePredictionSchema };
