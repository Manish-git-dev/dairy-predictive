const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { generateForecastSchema } = require('../validators/forecastValidator');
const forecastController = require('../controllers/forecastController');

router.post('/generate', authorize('ops_admin', 'manager', 'analyst'), validate(generateForecastSchema), forecastController.generateForecast);
router.post('/demand', authorize('ops_admin', 'manager', 'analyst'), validate(generateForecastSchema), forecastController.generateDemandForecast);
router.post('/workload', authorize('ops_admin', 'manager', 'analyst'), validate(generateForecastSchema), forecastController.generateWorkloadForecast);
router.post('/resource', authorize('ops_admin', 'manager', 'analyst'), validate(generateForecastSchema), forecastController.generateResourceForecast);
router.get('/', authorize('ops_admin', 'manager', 'analyst'), forecastController.getForecasts);

module.exports = router;
