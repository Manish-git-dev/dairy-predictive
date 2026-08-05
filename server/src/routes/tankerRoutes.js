const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createTankerSchema, updateTankerSchema } = require('../validators/tankerValidator');
const tankerController = require('../controllers/tankerController');

router.get('/', tankerController.getAll);
router.get('/active-routes', tankerController.getActiveRoutes);
router.post('/', authorize('ops_admin', 'manager'), validate(createTankerSchema), tankerController.create);
router.get('/:id', tankerController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateTankerSchema), tankerController.update);
router.delete('/:id', authorize('ops_admin'), tankerController.delete);
router.patch('/:id/status', authorize('ops_admin', 'manager', 'field_staff'), tankerController.updateStatus);
router.patch('/:id/location', authorize('ops_admin', 'manager', 'field_staff'), tankerController.updateLocation);

module.exports = router;
