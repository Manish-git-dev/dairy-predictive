const router = require('express').Router();
const { authorize } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.get('/', authorize('ops_admin', 'manager', 'analyst'), paymentController.getAll);
router.post('/calculate', authorize('ops_admin', 'manager'), paymentController.calculate);
router.get('/farmer/:farmerId', authorize('ops_admin', 'manager', 'analyst'), paymentController.getByFarmer);
router.get('/:id', authorize('ops_admin', 'manager', 'analyst'), paymentController.getById);
router.patch('/:id/approve', authorize('ops_admin', 'manager'), paymentController.approve);
router.patch('/:id/disburse', authorize('ops_admin'), paymentController.disburse);
router.patch('/:id/dispute', authorize('ops_admin', 'manager'), paymentController.dispute);

module.exports = router;
