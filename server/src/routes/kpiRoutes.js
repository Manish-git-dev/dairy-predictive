const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const kpiController = require('../controllers/kpiController');

router.post('/snapshot', authorize('ops_admin', 'manager'), kpiController.captureSnapshot);
router.get('/snapshots', kpiController.getSnapshots);
router.get('/calculate', kpiController.calculateKpis);

module.exports = router;
