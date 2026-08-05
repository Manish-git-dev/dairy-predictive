const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validators/userValidator');
const userController = require('../controllers/userController');

router.get('/', authorize('ops_admin', 'manager'), userController.getAll);
router.post('/', authorize('ops_admin'), validate(createUserSchema), userController.create);
router.get('/:id', authorize('ops_admin', 'manager'), userController.getById);
router.put('/:id', authorize('ops_admin'), validate(updateUserSchema), userController.update);
router.patch('/:id/password', userController.changePassword);
router.patch('/:id/deactivate', authorize('ops_admin'), userController.deactivate);
router.patch('/:id/activate', authorize('ops_admin'), userController.activate);

module.exports = router;
