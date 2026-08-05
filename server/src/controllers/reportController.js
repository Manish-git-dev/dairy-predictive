const reportService = require('../services/reportService');

const generateReport = async (req, res, next) => {
  try {
    const { type, format, filters } = req.body;
    const result = await reportService.generateReport(req.organizationId, { type, format, filters });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
      return res.status(200).send(result.csv || '');
    }
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getReportTypes = async (req, res, next) => {
  try {
    const result = await reportService.getReportTypes(req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReportTypes
};
