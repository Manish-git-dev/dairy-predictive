const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');

const reportService = {
  generateReport: async (type, startDate, endDate, format, organizationId) => {
    let data = [];
    const dateQuery = { 
      organization: organizationId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    switch (type) {
      case 'collection':
        data = await MilkLot.find(dateQuery).populate('farmer collectionCentre').lean();
        break;
      case 'quality':
        data = await QualityTest.find(dateQuery).populate('milkLot').lean();
        break;
      case 'payment':
        data = await Payment.find(dateQuery).populate('farmer').lean();
        break;
      case 'production':
        data = await Batch.find(dateQuery).populate('product').lean();
        break;
      case 'inventory':
        // Inventory might not use dateQuery if it's current stock
        data = await Inventory.find({ organization: organizationId }).populate('product').lean();
        break;
      case 'anomaly':
        // Assuming AnomalyEvent model
        const mongoose = require('mongoose');
        const AnomalyEvent = mongoose.models.AnomalyEvent;
        if (AnomalyEvent) {
          data = await AnomalyEvent.find(dateQuery).lean();
        }
        break;
      default:
        throw new Error('Invalid report type');
    }

    let result = { 
      data, 
      metadata: { 
        type, 
        period: { startDate, endDate }, 
        generatedAt: new Date(), 
        recordCount: data.length 
      }
    };

    if (format === 'csv') {
      // Very simple CSV conversion logic for demonstration
      if (data.length > 0) {
        const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object').join(',');
        const rows = data.map(row => {
          return Object.keys(row)
            .filter(k => typeof row[k] !== 'object')
            .map(k => `"${row[k]}"`)
            .join(',');
        }).join('\n');
        result.csv = `${headers}\n${rows}`;
      } else {
        result.csv = '';
      }
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
