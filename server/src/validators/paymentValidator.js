const { z } = require('zod');

const createPaymentSchema = z.object({
  farmer: z.string().min(24),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }),
  milkLots: z.array(z.string().min(24))
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'processing', 'paid', 'failed']),
  transactionReference: z.string().optional()
});

const approvePaymentSchema = z.object({
  notes: z.string().optional()
});

module.exports = { createPaymentSchema, updateStatusSchema, approvePaymentSchema };
