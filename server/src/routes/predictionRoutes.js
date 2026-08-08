const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { generatePredictionSchema } = require('../validators/predictionValidator');
const controller = require('../controllers/predictionController');

router.post('/generate', authorize('ops_admin', 'manager', 'analyst'), validate(generatePredictionSchema), controller.generate);
router.get('/', authorize('ops_admin', 'manager', 'analyst'), controller.list);
router.get('/:id', authorize('ops_admin', 'manager', 'analyst'), controller.getById);

module.exports = router;
