const { z } = require('zod');

const explainSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  context: z.string().optional()
});

const recommendSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  context: z.string().optional()
});

module.exports = { explainSchema, recommendSchema };
