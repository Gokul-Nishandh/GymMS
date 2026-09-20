const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.post('/login',    login);
router.post('/register', authMiddleware, adminMiddleware, register);
router.get('/me',        authMiddleware, getMe);

module.exports = router;
