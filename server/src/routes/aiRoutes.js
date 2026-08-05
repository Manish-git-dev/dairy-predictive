const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { explainSchema, recommendSchema } = require('../validators/aiValidator');
const aiController = require('../controllers/aiController');

router.post('/explain', authorize('ops_admin', 'manager', 'analyst'), validate(explainSchema), aiController.getExplanation);
router.post('/recommend', authorize('ops_admin', 'manager', 'analyst'), validate(recommendSchema), aiController.getRecommendation);
router.get('/runs', authorize('ops_admin', 'manager', 'analyst'), aiController.getAiRuns);
router.get('/runs/:id', authorize('ops_admin', 'manager', 'analyst'), aiController.getAiRunById);

module.exports = router;
