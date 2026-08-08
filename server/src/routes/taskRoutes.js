const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, updateStatusSchema, assignTaskSchema, addNoteSchema, escalateSchema } = require('../validators/taskValidator');
const taskController = require('../controllers/taskController');

router.get('/', taskController.getAll);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/assignees', taskController.getAssignees);
router.get('/sla-check', authorize('ops_admin', 'manager'), taskController.checkSlaBreaches);
router.post('/', authorize('ops_admin', 'manager'), validate(createTaskSchema), taskController.create);
router.get('/:id', taskController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateTaskSchema), taskController.update);
router.patch('/:id/status', validate(updateStatusSchema), taskController.updateStatus);
router.patch('/:id/assign', authorize('ops_admin', 'manager'), validate(assignTaskSchema), taskController.assign);
router.post('/:id/notes', validate(addNoteSchema), taskController.addNote);
router.patch('/:id/escalate', authorize('ops_admin', 'manager'), validate(escalateSchema), taskController.escalate);
router.delete('/:id', authorize('ops_admin', 'manager'), taskController.remove);

module.exports = router;
