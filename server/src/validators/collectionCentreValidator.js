const { z } = require('zod');

const createCollectionCentreSchema = z.object({
  name: z.string().min(1),
  location: z.object({
    address: z.string(),
    coordinates: z.array(z.number()).length(2).optional()
  }),
  capacityLitres: z.number().positive(),
  chillingCapacity: z.number().positive(),
  contactPhone: z.string(),
  manager: z.string().min(24).optional(),
  equipment: z.array(z.string()).optional()
});

const updateCollectionCentreSchema = createCollectionCentreSchema.partial();

module.exports = { createCollectionCentreSchema, updateCollectionCentreSchema };
