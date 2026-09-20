const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, webhook, getMemberPayments, getAllPayments } = require('../controllers/paymentController');

// Webhook must use raw body — handled in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

router.post('/create-order', authMiddleware, createOrder);
router.post('/verify',       authMiddleware, verifyPayment);
router.get('/',              authMiddleware, adminMiddleware, getAllPayments);
router.get('/member/:memberId', authMiddleware, getMemberPayments);

module.exports = router;
