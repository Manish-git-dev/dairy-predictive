const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', dashboardController.getOverview);
router.get('/collection-trend', dashboardController.getCollectionTrend);
router.get('/quality-distribution', dashboardController.getQualityDistribution);
router.get('/stage-metrics', dashboardController.getStageMetrics);

module.exports = router;
