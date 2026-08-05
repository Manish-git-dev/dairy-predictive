const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createCollectionCentreSchema, updateCollectionCentreSchema } = require('../validators/collectionCentreValidator');
const collectionCentreController = require('../controllers/collectionCentreController');

router.get('/', collectionCentreController.getAll);
router.post('/', authorize('ops_admin', 'manager'), validate(createCollectionCentreSchema), collectionCentreController.create);
router.get('/:id', collectionCentreController.getById);
router.put('/:id', authorize('ops_admin', 'manager'), validate(updateCollectionCentreSchema), collectionCentreController.update);
router.delete('/:id', authorize('ops_admin'), collectionCentreController.delete);
router.get('/:id/utilization', collectionCentreController.getUtilization);

module.exports = router;
