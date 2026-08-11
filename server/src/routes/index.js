const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { setOrganization } = require('../middleware/organizationMiddleware');
const { authorizeByPermission } = require('../middleware/permissionMiddleware');

// Health check - no auth required
router.use('/health', require('./healthRoutes'));

// Auth routes - no auth for login/register
router.use('/auth', require('./authRoutes'));

// All routes below require authentication, organization context, and an
// active database-backed resource/action permission.
router.use(authenticate);
router.use(setOrganization);
router.use(authorizeByPermission);

router.use('/users', require('./userRoutes'));
router.use('/farmers', require('./farmerRoutes'));
router.use('/collection-centres', require('./collectionCentreRoutes'));
router.use('/milk-lots', require('./milkLotRoutes'));
router.use('/quality-tests', require('./qualityTestRoutes'));
router.use('/tankers', require('./tankerRoutes'));
router.use('/batches', require('./batchRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/sla-rules', require('./slaRuleRoutes'));
router.use('/alerts', require('./alertRoutes'));
router.use('/workflows', require('./workflowRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/forecasts', require('./forecastRoutes'));
router.use('/predictions', require('./predictionRoutes'));
router.use('/anomalies', require('./anomalyRoutes'));
router.use('/preventive-rules', require('./preventiveRuleRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/approvals', require('./approvalRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/audit', require('./auditRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/roles', require('./roleRoutes'));
router.use('/kpi', require('./kpiRoutes'));
router.use('/risk', require('./riskRoutes'));

module.exports = router;
