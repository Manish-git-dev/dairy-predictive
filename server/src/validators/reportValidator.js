const { z } = require('zod');

const generateReportSchema = z.object({
  type: z.enum(['collection', 'quality', 'payment', 'production', 'inventory', 'anomaly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['json', 'csv']).default('json')
});

module.exports = { generateReportSchema };
