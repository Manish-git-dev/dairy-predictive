const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { setOrganization } = require('../middleware/organizationMiddleware');
const { rateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const authController = require('../controllers/authController');

router.post('/register', rateLimiter(20, 15), validate(registerSchema), authController.register);
router.post('/login', rateLimiter(20, 15), validate(loginSchema), authController.login);
router.get('/me', authenticate, setOrganization, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
