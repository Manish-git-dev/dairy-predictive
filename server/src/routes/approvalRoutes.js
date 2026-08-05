const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { reviewSchema } = require('../validators/approvalValidator');
const approvalController = require('../controllers/approvalController');

router.get('/', authorize('ops_admin', 'manager'), approvalController.getAll);
router.get('/pending', authorize('ops_admin', 'manager'), approvalController.getPending);
router.get('/my-approvals', approvalController.getMyApprovals);
router.get('/:id', authorize('ops_admin', 'manager'), approvalController.getById);
router.patch('/:id/review', authorize('ops_admin', 'manager'), validate(reviewSchema), approvalController.review);

module.exports = router;
