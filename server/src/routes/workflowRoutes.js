const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateWorkflowStageSchema } = require('../validators/workflowValidator');
const { createWorkflowSchema, updateWorkflowSchema, transitionWorkflowSchema } = require('../validators/workflowCrudValidator');
const workflowController = require('../controllers/workflowController');
const workflowCrudController = require('../controllers/workflowCrudController');

// Persistent workflow management
router.get('/', workflowCrudController.list);
router.get('/users', workflowCrudController.getUsers);
router.get('/:id', workflowCrudController.getById);
router.post('/', authorize('ops_admin', 'manager'), validate(createWorkflowSchema), workflowCrudController.create);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateWorkflowSchema), workflowCrudController.update);
router.patch('/:id/status', authorize('ops_admin', 'manager', 'field_staff'), validate(transitionWorkflowSchema), workflowCrudController.transition);
router.delete('/:id', authorize('ops_admin', 'manager'), workflowCrudController.remove);

// Existing operational queues/stage transition APIs
router.get('/queues', workflowController.getAllQueues);
router.get('/queues/:stage', workflowController.getQueueByStage);
router.post('/transition', authorize('ops_admin', 'manager', 'field_staff'), validate(updateWorkflowStageSchema), workflowController.transitionStage);

module.exports = router;
