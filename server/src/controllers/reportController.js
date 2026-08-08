const reportService = require('../services/reportService');

const generateReport = async (req, res, next) => {
  try {
    const { type, format = 'preview', startDate, endDate, filters = {} } = req.body;
    const options = { type, format, startDate, endDate, filters: { ...filters, startDate, endDate } };

    if (format === 'csv') {
      return await reportService.streamCsv(req.organizationId, req.user.id, options, res);
    }

    const result = await reportService.generateReport(req.organizationId, req.user.id, options);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getReportTypes = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: reportService.getReportTypes() });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await reportService.getHistory(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReportTypes,
  getHistory
};
