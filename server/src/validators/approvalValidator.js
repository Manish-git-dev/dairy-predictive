const { z } = require('zod');

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'overridden']),
  overrideReason: z.string().optional()
}).refine(data => {
  if (data.status === 'overridden' && !data.overrideReason) return false;
  return true;
}, {
  message: "overrideReason is required when status is 'overridden'",
  path: ['overrideReason']
});

module.exports = { reviewSchema };
