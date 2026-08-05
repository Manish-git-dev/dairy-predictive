const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');
const productController = require('../controllers/productController');

router.get('/', productController.getAll);
router.post('/', authorize('ops_admin', 'manager'), validate(createProductSchema), productController.create);
router.get('/:id', productController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateProductSchema), productController.update);
router.delete('/:id', authorize('ops_admin'), productController.delete);

module.exports = router;
