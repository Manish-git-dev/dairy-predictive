const Payment = require('../models/Payment');
const MilkLot = require('../models/MilkLot');
const Approval = require('../models/Approval');
const getPagination = require('../utils/pagination');

const paymentService = {
  calculate: async (farmerId, startDate, endDate, organizationId) => {
    const paymentId = `PAY-${Date.now()}`;
    
    const lots = await MilkLot.find({
      farmer: farmerId,
      organization: organizationId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('quality');

    let totalAmount = 0;
    const fatBonus = 0.5; // From org settings ideally
    const snfBonus = 0.2;

    lots.forEach(lot => {
      let lotAmount = lot.basePrice || (lot.quantityLitres * 20); // fallback price
      if (lot.quality) {
         if (lot.quality.fat > 4.5) lotAmount += lot.quantityLitres * fatBonus;
         if (lot.quality.snf > 8.5) lotAmount += lot.quantityLitres * snfBonus;
      }
      totalAmount += lotAmount;
    });

    const payment = new Payment({
      paymentId,
      farmer: farmerId,
      organization: organizationId,
      amount: totalAmount,
      periodStart: startDate,
      periodEnd: endDate,
      status: 'calculated',
      milkLots: lots.map(l => l._id)
    });

    await payment.save();
    return payment;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Payment.find(query).populate('farmer').skip(skip).limit(limitNum);
    const total = await Payment.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Payment.findOne({ _id: id, organization: organizationId }).populate('farmer milkLots');
  },

  approve: async (id, userId, organizationId) => {
    const payment = await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'approved' },
      { new: true }
    );
    
    if (payment) {
      const approval = new Approval({
        organization: organizationId,
        type: 'payment',
        entityId: payment._id,
        status: 'approved',
        requestedBy: userId,
        reviewer: userId
      });
      await approval.save();
    }
    
    return payment;
  },

  disburse: async (id, transactionRef, organizationId) => {
    return await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'disbursed', transactionRef, disbursedAt: new Date() },
      { new: true }
    );
  },

  dispute: async (id, organizationId) => {
    return await Payment.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'disputed' },
      { new: true }
    );
  },

  getByFarmer: async (farmerId, organizationId) => {
    return await Payment.find({ farmer: farmerId, organization: organizationId }).sort({ createdAt: -1 });
  }
};

module.exports = paymentService;
