const { z } = require('zod');

const paginationSchema = z.object({
  page: z.union([z.number(), z.string().transform(Number)]).default(1),
  limit: z.union([z.number(), z.string().transform(Number)]).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
}).refine(data => data.limit <= 100, {
  message: "limit must be less than or equal to 100",
  path: ['limit']
});

module.exports = { paginationSchema };
