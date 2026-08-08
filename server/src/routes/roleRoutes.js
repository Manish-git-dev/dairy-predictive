const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createRoleSchema, updateRoleSchema } = require('../validators/roleValidator');
const roleController = require('../controllers/roleController');

router.get('/', authorize('ops_admin', 'manager'), roleController.getAll);
router.post('/', authorize('ops_admin'), validate(createRoleSchema), roleController.create);
router.get('/:id', authorize('ops_admin', 'manager'), roleController.getById);
router.put('/:id', authorize('ops_admin'), validate(updateRoleSchema), roleController.update);
router.delete('/:id', authorize('ops_admin'), roleController.delete);

module.exports = router;
