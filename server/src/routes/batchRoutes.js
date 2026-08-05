const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createBatchSchema, updateBatchSchema } = require('../validators/batchValidator');
const batchController = require('../controllers/batchController');

router.get('/', batchController.getAll);
router.post('/', authorize('ops_admin', 'manager'), validate(createBatchSchema), batchController.create);
router.get('/:id', batchController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateBatchSchema), batchController.update);
router.patch('/:id/status', authorize('ops_admin', 'manager'), batchController.updateStatus);
router.patch('/:id/yield', authorize('ops_admin', 'manager'), batchController.recordYield);

module.exports = router;
