const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createMilkLotSchema, updateMilkLotSchema, updateStatusSchema } = require('../validators/milkLotValidator');
const milkLotController = require('../controllers/milkLotController');

router.get('/', milkLotController.getAll);
router.post('/', authorize('ops_admin', 'manager', 'field_staff'), validate(createMilkLotSchema), milkLotController.create);
router.get('/farmer/:farmerId', milkLotController.getByFarmer);
router.get('/:id', milkLotController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateMilkLotSchema), milkLotController.update);
router.patch('/:id/status', authorize('ops_admin', 'manager'), validate(updateStatusSchema), milkLotController.updateStatus);

module.exports = router;
