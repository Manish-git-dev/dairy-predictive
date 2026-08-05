const { z } = require('zod');

const createTankerSchema = z.object({
  registrationNumber: z.string().min(1),
  capacityLitres: z.number().positive(),
  driver: z.object({
    name: z.string(),
    phone: z.string(),
    licenseNumber: z.string()
  }),
  assignedCentres: z.array(z.string().min(24))
});

const updateTankerSchema = createTankerSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['available', 'in_transit', 'maintenance', 'unloading'])
});

module.exports = { createTankerSchema, updateTankerSchema, updateStatusSchema };
