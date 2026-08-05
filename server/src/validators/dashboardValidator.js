const { z } = require('zod');

const dashboardQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily')
});

module.exports = { dashboardQuerySchema };
