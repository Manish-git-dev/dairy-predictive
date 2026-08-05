const { z } = require('zod');

const generateForecastSchema = z.object({
  type: z.enum(['demand', 'workload', 'resource']),
  period: z.enum(['daily', 'weekly', 'monthly']),
  horizon: z.number().int().min(1).max(90)
});

module.exports = { generateForecastSchema };
