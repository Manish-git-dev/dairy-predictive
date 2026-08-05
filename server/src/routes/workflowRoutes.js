const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateWorkflowStageSchema } = require('../validators/workflowValidator');
const workflowController = require('../controllers/workflowController');

router.get('/queues', workflowController.getAllQueues);
router.get('/queues/:stage', workflowController.getQueueByStage);
router.post('/transition', authorize('ops_admin', 'manager', 'field_staff'), validate(updateWorkflowStageSchema), workflowController.transitionStage);

module.exports = router;
