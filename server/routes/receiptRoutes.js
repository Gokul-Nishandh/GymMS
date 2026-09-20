const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getReceipt, downloadReceipt, getMemberReceipts } = require('../controllers/receiptController');

router.get('/member/:memberId', authMiddleware, getMemberReceipts);
router.get('/:paymentId',           authMiddleware, getReceipt);
router.get('/:paymentId/download',  authMiddleware, downloadReceipt);

module.exports = router;
