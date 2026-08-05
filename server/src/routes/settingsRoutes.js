const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateConfigSchema } = require('../validators/configurationValidator');
const configurationController = require('../controllers/configurationController');

router.get('/', configurationController.getAll);
router.get('/:key', configurationController.get);
router.put('/:key', authorize('ops_admin'), validate(updateConfigSchema), configurationController.set);
router.delete('/:key', authorize('ops_admin'), configurationController.delete);
router.post('/bulk', authorize('ops_admin', 'manager'), configurationController.getBulk);

module.exports = router;
