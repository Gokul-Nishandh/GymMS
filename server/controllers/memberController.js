const { pool } = require('../config/database');

// GET /api/members
const getMembers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, 
        ms.status AS membership_status, ms.expiry_date,
        mp.plan_name, mp.price AS plan_price
      FROM members m
      LEFT JOIN memberships ms ON ms.member_id = m.member_id AND ms.status = 'active'
      LEFT JOIN membership_plans mp ON mp.plan_id = ms.plan_id
      ORDER BY m.member_id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/members/:id
const getMember = async (req, res) => {
  const { id } = req.params;
  // Members can only view their own profile
  if (req.user.role === 'member' && req.user.member_id != id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });

    const [memberships] = await pool.query(`
      SELECT ms.*, mp.plan_name, mp.price, mp.duration_months, mp.features
      FROM memberships ms
      JOIN membership_plans mp ON mp.plan_id = ms.plan_id
      WHERE ms.member_id = ?
      ORDER BY ms.membership_id DESC
    `, [id]);

    const [attendance] = await pool.query(
      'SELECT * FROM attendance WHERE member_id = ? ORDER BY attendance_date DESC LIMIT 30',
      [id]
    );
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE member_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({ success: true, data: { ...rows[0], memberships, attendance, payments } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/members
const createMember = async (req, res) => {
  const { name, email, phone, date_of_birth, gender, address, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, "member")', [email, hashed]);
    const userId = userResult.insertId;

    const [lastMember] = await pool.query('SELECT COUNT(*) as cnt FROM members');
    const seq = (lastMember[0].cnt + 1).toString().padStart(5, '0');
    const memberCode = `GM-${seq}`;

    const [memberResult] = await pool.query(
      `INSERT INTO members (user_id, member_code, name, email, phone, date_of_birth, gender, address, date_joined, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')`,
      [userId, memberCode, name, email, phone || null, date_of_birth || null, gender || null, address || null]
    );

    res.status(201).json({ success: true, data: { member_id: memberResult.insertId, member_code: memberCode, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/members/:id
const updateMember = async (req, res) => {
  const { id } = req.params;
  const { name, phone, date_of_birth, gender, address, status } = req.body;
  try {
    await pool.query(
      `UPDATE members SET name=?, phone=?, date_of_birth=?, gender=?, address=?, status=?, updated_at=NOW()
       WHERE member_id=?`,
      [name, phone || null, date_of_birth || null, gender || null, address || null, status || 'active', id]
    );
    res.json({ success: true, message: 'Member updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/members/:id (deactivate)
const deleteMember = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE members SET status="inactive" WHERE member_id=?', [id]);
    res.json({ success: true, message: 'Member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/members/stats
const getStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM members WHERE status="active"');
    const [[{ expiring }]] = await pool.query(`
      SELECT COUNT(*) as expiring FROM memberships 
      WHERE status='active' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);
    const [[{ today_checkins }]] = await pool.query(
      'SELECT COUNT(*) as today_checkins FROM attendance WHERE attendance_date = CURDATE()'
    );
    const [[{ monthly_revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as monthly_revenue FROM payments 
       WHERE payment_status='PAID' AND MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())`
    );
    const [[{ pending_payments }]] = await pool.query(
      'SELECT COUNT(*) as pending_payments FROM payments WHERE payment_status="PENDING"'
    );
    res.json({ success: true, data: { total_members: total, expiring_memberships: expiring, today_checkins, monthly_revenue, pending_payments } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember, getStats };
