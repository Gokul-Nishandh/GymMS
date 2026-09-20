const { pool } = require('../config/database');
const receiptService = require('../services/receiptService');
const s3Service = require('../services/s3Service');
const path = require('path');
const fs = require('fs');

// GET /api/receipts/:paymentId
const getReceipt = async (req, res) => {
  const { paymentId } = req.params;
  const memberId = req.user.member_id;

  try {
    const [rows] = await pool.query('SELECT * FROM receipts WHERE payment_id=?', [paymentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Receipt not found' });
    const receipt = rows[0];

    // Members can only access their own receipts
    if (req.user.role === 'member' && receipt.member_id != memberId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/receipts/:paymentId/download
const downloadReceipt = async (req, res) => {
  const { paymentId } = req.params;
  const memberId = req.user.member_id;

  try {
    const [rows] = await pool.query('SELECT * FROM receipts WHERE payment_id=?', [paymentId]);
    if (rows.length === 0) {
      // Try generating on the fly
      try {
        const receipt = await receiptService.generateReceipt(paymentId);
        const [newRows] = await pool.query('SELECT * FROM receipts WHERE payment_id=?', [paymentId]);
        if (newRows.length > 0) {
          return await streamOrRedirect(newRows[0], req.user, res);
        }
      } catch (genErr) {
        console.error('On-demand generation failed:', genErr.message);
      }
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const receipt = rows[0];
    if (req.user.role === 'member' && receipt.member_id != memberId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await streamOrRedirect(receipt, req.user, res);
  } catch (err) {
    console.error('downloadReceipt error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const streamOrRedirect = async (receipt, user, res) => {
  // If S3
  if (receipt.s3_object_key) {
    try {
      const url = await s3Service.getPresignedUrl(receipt.s3_object_key);
      return res.json({ success: true, data: { download_url: url, expires_in: 3600 } });
    } catch (e) {
      console.warn('S3 presigned URL failed, falling back to local:', e.message);
    }
  }

  // Local fallback
  if (receipt.local_path) {
    const localFile = path.resolve(__dirname, '../receipts', receipt.file_name);
    if (fs.existsSync(localFile)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${receipt.file_name}"`);
      return res.sendFile(localFile);
    }
  }

  return res.status(404).json({ success: false, message: 'Receipt file not found on server' });
};

// GET /api/receipts/member/:memberId
const getMemberReceipts = async (req, res) => {
  const { memberId } = req.params;
  if (req.user.role === 'member' && req.user.member_id != memberId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT r.*, p.amount, p.payment_date, p.payment_status FROM receipts r JOIN payments p ON p.payment_id=r.payment_id WHERE r.member_id=? ORDER BY r.generated_at DESC',
      [memberId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getReceipt, downloadReceipt, getMemberReceipts };
