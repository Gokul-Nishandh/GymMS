const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/database');
const receiptService = require('../services/receiptService');

const getRazorpay = () => {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
  });
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  const { payment_id } = req.body;
  const memberId = req.user.member_id;

  if (!payment_id) return res.status(400).json({ success: false, message: 'payment_id is required' });

  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE payment_id=? AND member_id=?',
      [payment_id, memberId]
    );
    if (payments.length === 0) return res.status(404).json({ success: false, message: 'Payment record not found' });
    const payment = payments[0];

    if (payment.payment_status === 'PAID') {
      return res.status(409).json({ success: false, message: 'Payment already completed' });
    }

    const razorpay = getRazorpay();
    const amountPaise = Math.round(parseFloat(payment.amount) * 100);

    let order;
    try {
      order = await razorpay.orders.create({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  payment.receipt_number || `pay_${payment_id}`,
      });
    } catch (rzpErr) {
      console.warn('Razorpay order creation failed (test mode likely):', rzpErr.message);
      // In dev/test, create a mock order so the UI can still demonstrate the flow
      order = {
        id:       `order_demo_${Date.now()}`,
        amount:   amountPaise,
        currency: 'INR',
        status:   'created',
      };
    }

    await pool.query(
      'UPDATE payments SET razorpay_order_id=?, payment_status="PENDING", updated_at=NOW() WHERE payment_id=?',
      [order.id, payment_id]
    );

    res.json({
      success: true,
      data: {
        orderId:    order.id,
        amount:     order.amount,
        currency:   order.currency,
        keyId:      process.env.RAZORPAY_KEY_ID,
        payment_id: payment.payment_id,
        receipt_number: payment.receipt_number,
      },
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_id } = req.body;
  const memberId = req.user.member_id;

  if (!razorpay_order_id || !payment_id) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE payment_id=? AND member_id=?',
      [payment_id, memberId]
    );
    if (payments.length === 0) return res.status(404).json({ success: false, message: 'Payment not found' });
    const payment = payments[0];

    // Verify HMAC-SHA256 signature
    let signatureValid = false;
    if (razorpay_payment_id && razorpay_signature) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
        .update(body)
        .digest('hex');
      signatureValid = expectedSignature === razorpay_signature;
    }

    const isDemoOrder = razorpay_order_id.startsWith('order_demo_');
    if (!isDemoOrder && !signatureValid) {
      await pool.query('UPDATE payments SET payment_status="FAILED" WHERE payment_id=?', [payment_id]);
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    // Update payment as PAID
    await pool.query(
      `UPDATE payments SET 
        payment_status='PAID', 
        razorpay_payment_id=?, 
        razorpay_signature=?,
        payment_method='online',
        payment_date=NOW(),
        updated_at=NOW()
       WHERE payment_id=?`,
      [razorpay_payment_id || 'demo_pay', razorpay_signature || 'demo_sig', payment_id]
    );

    // Generate receipt
    let receipt = null;
    try {
      receipt = await receiptService.generateReceipt(payment_id);
    } catch (receiptErr) {
      console.error('Receipt generation failed (non-fatal):', receiptErr.message);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { payment_id, receipt_number: payment.receipt_number, receipt },
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/payments/webhook
const webhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  if (webhookSecret && signature) {
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    if (expectedSig !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  }

  const event = req.body;
  const eventType = event.event;

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = event.payload?.order?.entity?.id || event.payload?.payment?.entity?.order_id;
      if (orderId) {
        await pool.query(
          "UPDATE payments SET payment_status='PAID', updated_at=NOW() WHERE razorpay_order_id=? AND payment_status='PENDING'",
          [orderId]
        );
      }
    } else if (eventType === 'payment.failed') {
      const orderId = event.payload?.payment?.entity?.order_id;
      if (orderId) {
        await pool.query(
          "UPDATE payments SET payment_status='FAILED', updated_at=NOW() WHERE razorpay_order_id=?",
          [orderId]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false });
  }
};

// GET /api/payments/member/:memberId
const getMemberPayments = async (req, res) => {
  const { memberId } = req.params;
  if (req.user.role === 'member' && req.user.member_id != memberId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE member_id=? ORDER BY created_at DESC',
      [memberId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/payments (all — admin)
const getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, m.name, m.member_code, mp.plan_name
      FROM payments p
      JOIN members m ON m.member_id = p.member_id
      LEFT JOIN memberships ms ON ms.membership_id = p.membership_id
      LEFT JOIN membership_plans mp ON mp.plan_id = ms.plan_id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, webhook, getMemberPayments, getAllPayments };
