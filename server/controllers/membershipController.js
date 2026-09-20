const { pool } = require('../config/database');

// GET /api/plans
const getPlans = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM membership_plans WHERE status='active' ORDER BY price");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/plans
const createPlan = async (req, res) => {
  const { plan_name, duration_months, price, description, features } = req.body;
  if (!plan_name || !duration_months || !price) {
    return res.status(400).json({ success: false, message: 'Plan name, duration and price are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO membership_plans (plan_name, duration_months, price, description, features) VALUES (?, ?, ?, ?, ?)',
      [plan_name, duration_months, price, description || null, JSON.stringify(features || [])]
    );
    res.status(201).json({ success: true, data: { plan_id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/plans/:id
const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { plan_name, duration_months, price, description, features, status } = req.body;
  try {
    await pool.query(
      'UPDATE membership_plans SET plan_name=?, duration_months=?, price=?, description=?, features=?, status=? WHERE plan_id=?',
      [plan_name, duration_months, price, description, JSON.stringify(features || []), status || 'active', id]
    );
    res.json({ success: true, message: 'Plan updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/memberships — assign a plan to a member
const assignMembership = async (req, res) => {
  const { member_id, plan_id, start_date } = req.body;
  if (!member_id || !plan_id || !start_date) {
    return res.status(400).json({ success: false, message: 'member_id, plan_id and start_date are required' });
  }
  try {
    const [plans] = await pool.query('SELECT * FROM membership_plans WHERE plan_id = ?', [plan_id]);
    if (plans.length === 0) return res.status(404).json({ success: false, message: 'Plan not found' });
    const plan = plans[0];

    const start = new Date(start_date);
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + plan.duration_months);

    // Deactivate old memberships
    await pool.query("UPDATE memberships SET status='cancelled' WHERE member_id=? AND status='active'", [member_id]);

    const [result] = await pool.query(
      "INSERT INTO memberships (member_id, plan_id, start_date, expiry_date, status) VALUES (?, ?, ?, ?, 'active')",
      [member_id, plan_id, start_date, expiry.toISOString().split('T')[0]]
    );

    // Create a pending payment
    const year = new Date().getFullYear();
    const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM payments');
    const receiptNum = `GYM-${year}-${String(cnt + 1).padStart(6, '0')}`;

    await pool.query(
      "INSERT INTO payments (member_id, membership_id, amount, currency, payment_status, receipt_number) VALUES (?, ?, ?, 'INR', 'PENDING', ?)",
      [member_id, result.insertId, plan.price, receiptNum]
    );

    res.status(201).json({ success: true, message: 'Membership assigned', data: { membership_id: result.insertId, expiry_date: expiry.toISOString().split('T')[0] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/memberships/:memberId
const getMemberMemberships = async (req, res) => {
  const { memberId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT ms.*, mp.plan_name, mp.price, mp.duration_months, mp.features, mp.description
      FROM memberships ms
      JOIN membership_plans mp ON mp.plan_id = ms.plan_id
      WHERE ms.member_id = ?
      ORDER BY ms.membership_id DESC
    `, [memberId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/attendance/:memberId
const getMemberAttendance = async (req, res) => {
  const { memberId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE member_id = ? ORDER BY attendance_date DESC LIMIT 60',
      [memberId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/attendance/check-in
const checkIn = async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) return res.status(400).json({ success: false, message: 'member_id is required' });
  try {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toISOString().split('T')[0];

    const [existing] = await pool.query(
      'SELECT * FROM attendance WHERE member_id=? AND attendance_date=?',
      [member_id, date]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Already checked in today' });
    }

    await pool.query(
      "INSERT INTO attendance (member_id, attendance_date, check_in_time, status) VALUES (?, ?, ?, 'present')",
      [member_id, date, time]
    );

    res.status(201).json({ success: true, message: 'Check-in successful', data: { date, check_in_time: time } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/attendance (all — admin)
const getAllAttendance = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, m.name, m.member_code
      FROM attendance a
      JOIN members m ON m.member_id = a.member_id
      ORDER BY a.attendance_date DESC, a.check_in_time DESC
      LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPlans, createPlan, updatePlan, assignMembership, getMemberMemberships, getMemberAttendance, checkIn, getAllAttendance };
