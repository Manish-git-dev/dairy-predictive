const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createQualityTestSchema, updateQualityTestSchema } = require('../validators/qualityTestValidator');
const qualityTestController = require('../controllers/qualityTestController');

router.get('/', qualityTestController.getAll);
router.post('/', authorize('ops_admin', 'manager', 'analyst', 'field_staff'), validate(createQualityTestSchema), qualityTestController.create);
router.get('/:id', qualityTestController.getById);
router.put('/:id', authorize('ops_admin', 'manager', 'analyst'), validate(updateQualityTestSchema), qualityTestController.update);

module.exports = router;
