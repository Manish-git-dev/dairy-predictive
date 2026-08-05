const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');

router.get('/', authorize('ops_admin'), auditController.getAll);
router.get('/:resource/:resourceId', authorize('ops_admin'), auditController.getByResource);

module.exports = router;
