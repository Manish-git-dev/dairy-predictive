const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createSlaRuleSchema, updateSlaRuleSchema } = require('../validators/slaRuleValidator');
const slaRuleController = require('../controllers/slaRuleController');

router.get('/', slaRuleController.getAll);
router.post('/', authorize('ops_admin'), validate(createSlaRuleSchema), slaRuleController.create);
router.get('/:id', slaRuleController.getById);
router.put('/:id', authorize('ops_admin'), validate(updateSlaRuleSchema), slaRuleController.update);
router.delete('/:id', authorize('ops_admin'), slaRuleController.delete);

module.exports = router;
