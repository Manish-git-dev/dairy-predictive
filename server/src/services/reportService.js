const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const AnomalyEvent = require('../models/AnomalyEvent');
const csvExport = require('../utils/csvExport');
const ApiError = require('../utils/ApiError');

const reportService = {
  generateReport: async (organizationId, options = {}) => {
    let { type, format = 'json', filters = {} } = options;
    const startDate = filters.startDate || options.startDate;
    const endDate = filters.endDate || options.endDate;

    const dateQuery = {
      organization: organizationId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    let data = [];
    let columns = [];

    switch (type) {
      case 'collection':
        data = await MilkLot.find(dateQuery).populate('farmer', 'firstName lastName').lean();
        columns = [
          { header: 'Lot ID', key: 'lotId' },
          { header: 'Farmer', key: 'farmer' },
          { header: 'Quantity (L)', key: 'quantityLitres' },
          { header: 'Status', key: 'status' },
          { header: 'Date', key: 'collectionDate' }
        ];
        break;
      case 'quality':
        data = await QualityTest.find(dateQuery).populate('milkLot', 'lotId').lean();
        columns = [
          { header: 'Test ID', key: 'testId' },
          { header: 'Lot ID', key: 'milkLot' },
          { header: 'Grade', key: 'grade' },
          { header: 'Result', key: 'result' },
          { header: 'Date', key: 'testDate' }
        ];
        break;
      case 'payment':
        data = await Payment.find(dateQuery).populate('farmer', 'firstName lastName').lean();
        columns = [
          { header: 'Payment ID', key: 'paymentId' },
          { header: 'Farmer', key: 'farmer' },
          { header: 'Amount', key: 'netAmount' },
          { header: 'Status', key: 'status' },
          { header: 'Date', key: 'createdAt' }
        ];
        break;
      case 'production':
        data = await Batch.find(dateQuery).populate('product', 'name').lean();
        columns = [
          { header: 'Batch ID', key: 'batchId' },
          { header: 'Product', key: 'product' },
          { header: 'Quantity', key: 'totalQuantity' },
          { header: 'Yield', key: 'plantYield' },
          { header: 'Status', key: 'status' }
        ];
        break;
      case 'inventory':
        data = await Inventory.find({ organization: organizationId }).populate('product', 'name').lean();
        columns = [
          { header: 'Product', key: 'product' },
          { header: 'Quantity', key: 'quantity' },
          { header: 'Status', key: 'status' },
          { header: 'Expiry', key: 'expiryDate' }
        ];
        break;
      case 'anomaly':
        data = await AnomalyEvent.find(dateQuery).lean();
        columns = [
          { header: 'Anomaly ID', key: 'anomalyId' },
          { header: 'Type', key: 'type' },
          { header: 'Severity', key: 'severity' },
          { header: 'Risk Score', key: 'riskScore' },
          { header: 'Status', key: 'status' }
        ];
        break;
      default:
        throw new ApiError(400, 'Invalid report type');
    }

    const result = {
      metadata: {
        type,
        period: { startDate, endDate },
        generatedAt: new Date(),
        recordCount: data.length
      },
      data
    };

    if (format === 'csv') {
      result.csv = csvExport(data, columns);
    }

    return result;
  },

  getReportTypes: () => {
    return [
      { id: 'collection', name: 'Milk Collection Report', description: 'Daily milk collection details' },
      { id: 'quality', name: 'Quality Testing Report', description: 'Quality parameters and grades' },
      { id: 'payment', name: 'Farmer Payments Report', description: 'Calculated and disbursed payments' },
      { id: 'production', name: 'Production & Yield Report', description: 'Batch processing yields' },
      { id: 'inventory', name: 'Inventory Status Report', description: 'Current stock levels' },
      { id: 'anomaly', name: 'Anomaly & Alerts Report', description: 'Detected system anomalies' }
    ];
  }
};

module.exports = reportService;
