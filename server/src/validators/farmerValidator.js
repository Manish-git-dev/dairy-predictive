const { z } = require('zod');

const createFarmerSchema = z.object({
  name: z.string().min(2),
  contactInfo: z.object({
    phone: z.string().min(10),
    email: z.string().email().optional(),
    address: z.object({
      street: z.string().optional(),
      village: z.string(),
      district: z.string(),
      state: z.string(),
      pincode: z.string()
    })
  }),
  bankingDetails: z.object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    bankName: z.string()
  }).optional(),
  herdSize: z.number().int().min(0).optional(),
  cooperativeId: z.string().optional(),
  isActive: z.boolean().optional()
});

const updateFarmerSchema = createFarmerSchema.partial();

const searchFarmerSchema = z.object({
  search: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  isActive: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
  page: z.union([z.number(), z.string().transform(Number)]).optional(),
  limit: z.union([z.number(), z.string().transform(Number)]).optional(),
  sort: z.string().optional()
});

module.exports = { createFarmerSchema, updateFarmerSchema, searchFarmerSchema };
