const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const anomalyController = require('../controllers/anomalyController');

router.post('/detect', authorize('ops_admin', 'manager', 'analyst'), anomalyController.detect);
router.get('/', anomalyController.getAll);
router.get('/risk-scores', anomalyController.getRiskScores);
router.get('/:id', anomalyController.getById);
router.patch('/:id/status', authorize('ops_admin', 'manager'), anomalyController.updateStatus);
router.get('/:id/explain', anomalyController.explainAnomaly);

module.exports = router;
