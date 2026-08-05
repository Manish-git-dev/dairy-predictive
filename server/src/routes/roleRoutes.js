const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const roleController = require('../controllers/roleController');

router.get('/', roleController.getAll);
router.post('/', authorize('ops_admin'), roleController.create);
router.get('/:id', roleController.getById);
router.put('/:id', authorize('ops_admin'), roleController.update);
router.delete('/:id', authorize('ops_admin'), roleController.delete);

module.exports = router;
