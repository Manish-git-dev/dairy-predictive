const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createFarmerSchema, updateFarmerSchema } = require('../validators/farmerValidator');
const farmerController = require('../controllers/farmerController');

router.get('/', farmerController.getAll);
router.post('/', authorize('ops_admin', 'manager'), validate(createFarmerSchema), farmerController.create);
router.get('/:id', farmerController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateFarmerSchema), farmerController.update);
router.delete('/:id', authorize('ops_admin'), farmerController.delete);
router.get('/:id/performance', farmerController.getPerformance);

module.exports = router;
