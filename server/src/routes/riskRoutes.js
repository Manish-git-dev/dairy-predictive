const router = require('express').Router();
const anomalyController = require('../controllers/anomalyController');

router.get('/scores', anomalyController.getRiskScores);

module.exports = router;
