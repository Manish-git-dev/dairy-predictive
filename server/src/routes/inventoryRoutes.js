const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createInventorySchema, updateInventorySchema } = require('../validators/inventoryValidator');
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAll);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/expiring', inventoryController.getExpiringSoon);
router.post('/', authorize('ops_admin', 'manager'), validate(createInventorySchema), inventoryController.create);
router.get('/:id', inventoryController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateInventorySchema), inventoryController.update);
router.patch('/:id/adjust', authorize('ops_admin', 'manager'), inventoryController.adjustStock);

module.exports = router;
