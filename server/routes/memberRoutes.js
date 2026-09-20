const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { getMembers, getMember, createMember, updateMember, deleteMember, getStats } = require('../controllers/memberController');

router.get('/stats',  authMiddleware, adminMiddleware, getStats);
router.get('/',       authMiddleware, adminMiddleware, getMembers);
router.get('/:id',    authMiddleware, getMember);
router.post('/',      authMiddleware, adminMiddleware, createMember);
router.put('/:id',    authMiddleware, adminMiddleware, updateMember);
router.delete('/:id', authMiddleware, adminMiddleware, deleteMember);

module.exports = router;
