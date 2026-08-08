const { z } = require('zod');

const generateForecastSchema = z.object({
  metric: z.enum(['milk_collection', 'demand', 'capacity', 'operational_volume']).default('milk_collection'),
  type: z.enum(['demand', 'workload', 'resource']).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  horizon: z.coerce.number().int().min(1).max(90).default(7),
  historyDays: z.coerce.number().int().min(7).max(365).default(30)
}).superRefine((value, ctx) => {
  if (value.type === 'demand' && value.metric === 'milk_collection') value.metric = 'demand';
  if (value.type === 'workload' && value.metric === 'milk_collection') value.metric = 'operational_volume';
  if (value.type === 'resource' && value.metric === 'milk_collection') value.metric = 'capacity';
  if (value.period !== 'daily') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['period'], message: 'The baseline forecast currently operates on daily historical observations. Use period=daily.' });
  }
});

module.exports = { generateForecastSchema };
