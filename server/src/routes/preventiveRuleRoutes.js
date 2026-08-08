const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const controller = require('../controllers/preventiveRuleController');

router.get('/', controller.getAll);
router.get('/:id/history', controller.history);
router.get('/:id', controller.getById);
router.post('/', authorize('ops_admin', 'manager'), controller.create);
router.put('/:id', authorize('ops_admin', 'manager'), controller.update);
router.delete('/:id', authorize('ops_admin', 'manager'), controller.remove);
router.patch('/:id/enabled', authorize('ops_admin', 'manager'), controller.setEnabled);
router.post('/:id/test', authorize('ops_admin', 'manager', 'analyst'), controller.test);
router.post('/:id/trigger', authorize('ops_admin', 'manager', 'analyst'), controller.trigger);

module.exports = router;
