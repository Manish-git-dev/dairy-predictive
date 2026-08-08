const { z } = require('zod');

const reportTypes = ['daily_operations', 'collection', 'quality', 'production', 'inventory', 'payments', 'anomalies', 'forecast', 'prediction'];

const generateReportSchema = z.object({
  type: z.enum(reportTypes),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['preview', 'csv']).default('preview'),
  filters: z.object({
    status: z.string().optional(),
    severity: z.string().optional(),
    search: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(100000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }).default({})
});

module.exports = { generateReportSchema, reportTypes };
