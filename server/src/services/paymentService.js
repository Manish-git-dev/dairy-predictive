const Payment = require('../models/Payment');
const MilkLot = require('../models/MilkLot');
const Approval = require('../models/Approval');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const paymentService = {
  calculate: async (body, organizationId) => {
    const { farmer, period } = body;
    const startDate = period && period.startDate;
    const endDate = period && period.endDate;

    const lots = await MilkLot.find({
      farmer,
      organization: organizationId,
      status: { $ne: 'rejected' },
      collectionDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    let totalAmount = 0;
    let totalQuantity = 0;
    let avgFat = 0, avgSnf = 0;

    lots.forEach(lot => {
      const pricePerLitre = lot.pricePerLitre || 35;
      totalAmount += (lot.quantityLitres || 0) * pricePerLitre;
      totalQuantity += lot.quantityLitres || 0;
      if (lot.quality) {
        avgFat += lot.quality.fat || 0;
        avgSnf += lot.quality.snf || 0;
      }
    });

    if (lots.length > 0) {
      avgFat = avgFat / lots.length;
      avgSnf = avgSnf / lots.length;
    }

    const payment = new Payment({
      paymentId: `PAY-${Date.now()}`,
      farmer,
      organization: organizationId,
      period: { startDate: new Date(startDate), endDate: new Date(endDate) },
      milkLots: lots.map(l => l._id),
      totalQuantity: parseFloat(totalQuantity.toFixed(2)),
      averageFat: parseFloat(avgFat.toFixed(2)),
      averageSnf: parseFloat(avgSnf.toFixed(2)),
      baseAmount: parseFloat(totalAmount.toFixed(2)),
      netAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'calculated'
    });

    await payment.save();
    return payment;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Payment.find(query).populate('farmer').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Payment.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const payment = await Payment.findOne({ _id: id, organization: organizationId }).populate('farmer milkLots');
    if (!payment) throw new ApiError(404, 'Payment not found');
    return payment;
  },

  approve: async (id, organizationId, userId) => {
    const payment = await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'approved', approvedBy: userId },
      { new: true }
    );
    if (!payment) throw new ApiError(404, 'Payment not found');

    const approval = new Approval({
      approvalId: `APR-${Date.now()}`,
      organization: organizationId,
      type: 'payment',
      title: `Payment approval for ${payment.paymentId}`,
      requester: userId,
      reviewer: userId,
      status: 'approved',
      reviewedAt: new Date(),
      relatedEntity: { type: 'Payment', id: payment._id }
    });
    await approval.save();

    return payment;
  },

  disburse: async (id, organizationId, userId) => {
    const payment = await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'disbursed', disbursedDate: new Date(), transactionReference: `TXN-${Date.now()}` },
      { new: true }
    );
    if (!payment) throw new ApiError(404, 'Payment not found');
    return payment;
  },

  dispute: async (id, body, organizationId) => {
    const payment = await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'disputed' },
      { new: true }
    );
    if (!payment) throw new ApiError(404, 'Payment not found');
    return payment;
  },

  getByFarmer: async (farmerId, organizationId) => {
    return await Payment.find({ farmer: farmerId, organization: organizationId }).populate('farmer').sort({ createdAt: -1 });
  }
};

module.exports = paymentService;
