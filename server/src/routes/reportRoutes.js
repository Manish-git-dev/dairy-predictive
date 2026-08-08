const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { generateReportSchema } = require('../validators/reportValidator');
const reportController = require('../controllers/reportController');

router.get('/types', reportController.getReportTypes);
router.get('/history', authorize('ops_admin', 'manager', 'analyst'), reportController.getHistory);
router.post('/generate', authorize('ops_admin', 'manager', 'analyst'), validate(generateReportSchema), reportController.generateReport);

module.exports = router;
