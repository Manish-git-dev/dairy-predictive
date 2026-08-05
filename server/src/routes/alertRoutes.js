const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createAlertSchema } = require('../validators/alertValidator');
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAll);
router.get('/active', alertController.getActiveAlerts);
router.get('/counts', alertController.getAlertCounts);
router.post('/', authorize('ops_admin', 'manager'), validate(createAlertSchema), alertController.create);
router.get('/:id', alertController.getById);
router.patch('/:id/acknowledge', alertController.acknowledge);
router.patch('/:id/resolve', authorize('ops_admin', 'manager'), alertController.resolve);

module.exports = router;
