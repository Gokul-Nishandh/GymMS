const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getPlans, createPlan, updatePlan,
  assignMembership, getMemberMemberships,
  getMemberAttendance, checkIn, getAllAttendance,
} = require('../controllers/membershipController');

// Plans
router.get('/plans',       authMiddleware, getPlans);
router.post('/plans',      authMiddleware, adminMiddleware, createPlan);
router.put('/plans/:id',   authMiddleware, adminMiddleware, updatePlan);

// Memberships
router.post('/memberships',               authMiddleware, adminMiddleware, assignMembership);
router.get('/memberships/:memberId',       authMiddleware, getMemberMemberships);

// Attendance
router.get('/attendance',                  authMiddleware, adminMiddleware, getAllAttendance);
router.post('/attendance/check-in',        authMiddleware, adminMiddleware, checkIn);
router.get('/attendance/:memberId',        authMiddleware, getMemberAttendance);

module.exports = router;
