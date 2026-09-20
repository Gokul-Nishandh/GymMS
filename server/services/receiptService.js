const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const s3Service = require('./s3Service');

const RECEIPTS_DIR = path.resolve(__dirname, '../receipts');

const ensureReceiptsDir = () => {
  if (!fs.existsSync(RECEIPTS_DIR)) fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
};

const generateReceipt = async (paymentId) => {
  // Fetch all data from DB (never trust frontend data)
  const [payments] = await pool.query('SELECT * FROM payments WHERE payment_id=?', [paymentId]);
  if (payments.length === 0) throw new Error('Payment not found');
  const payment = payments[0];
  if (payment.payment_status !== 'PAID') throw new Error('Payment not completed');

  const [members] = await pool.query('SELECT * FROM members WHERE member_id=?', [payment.member_id]);
  if (members.length === 0) throw new Error('Member not found');
  const member = members[0];

  let membership = null;
  let plan = null;
  if (payment.membership_id) {
    const [ms] = await pool.query(`
      SELECT ms.*, mp.plan_name, mp.duration_months, mp.features
      FROM memberships ms JOIN membership_plans mp ON mp.plan_id=ms.plan_id
      WHERE ms.membership_id=?`, [payment.membership_id]);
    if (ms.length > 0) {
      membership = ms[0];
      plan = ms[0];
    }
  }

  const receiptNumber = payment.receipt_number || `GYM-${new Date().getFullYear()}-${String(paymentId).padStart(6, '0')}`;
  const fileName = `${receiptNumber}.pdf`;
  const filePath = path.join(RECEIPTS_DIR, fileName);

  ensureReceiptsDir();

  // Build PDF
  const pdfBuffer = await buildPDF({ payment, member, membership, plan, receiptNumber });
  fs.writeFileSync(filePath, pdfBuffer);

  // Try S3 upload
  let s3Key = null;
  const storageMode = process.env.RECEIPT_STORAGE || 'local';
  if (storageMode === 's3') {
    try {
      const date = new Date();
      s3Key = `receipts/${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${fileName}`;
      await s3Service.uploadPDF(s3Key, pdfBuffer);
    } catch (s3Err) {
      console.warn('S3 upload failed, using local storage:', s3Err.message);
      s3Key = null;
    }
  }

  // Upsert receipt record
  await pool.query(
    `INSERT INTO receipts (payment_id, member_id, receipt_number, file_name, s3_object_key, local_path, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE s3_object_key=VALUES(s3_object_key), local_path=VALUES(local_path), generated_at=NOW()`,
    [paymentId, member.member_id, receiptNumber, fileName, s3Key, `receipts/${fileName}`]
  );

  // Update receipt_number on payment
  await pool.query('UPDATE payments SET receipt_number=? WHERE payment_id=?', [receiptNumber, paymentId]);

  return { receipt_number: receiptNumber, file_name: fileName, s3_key: s3Key };
};

const buildPDF = (data) => {
  return new Promise((resolve, reject) => {
    const { payment, member, membership, plan, receiptNumber } = data;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primary = '#7c3aed';
    const dark    = '#1e1b4b';
    const gray    = '#6b7280';

    // Header background
    doc.rect(0, 0, doc.page.width, 120).fill('#1e1b4b');

    // Gym logo area
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff').text('💪 GymMS', 50, 35, { align: 'left' });
    doc.fontSize(11).font('Helvetica').fillColor('#a5b4fc').text('PAYMENT RECEIPT', 50, 65);

    // Receipt number (top right)
    doc.fontSize(10).fillColor('#a5b4fc').text(`Receipt No: ${receiptNumber}`, 0, 35, { align: 'right', width: doc.page.width - 50 });
    const dateStr = new Date(payment.payment_date || payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Date: ${dateStr}`, 0, 50, { align: 'right', width: doc.page.width - 50 });

    doc.moveDown(4);

    // PAID badge
    doc.roundedRect(50, 130, 90, 28, 4).fill('#10b981');
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#ffffff').text('✓  PAID', 55, 137);

    doc.moveDown(1.5);

    // Section helper
    const sectionHeader = (title, y) => {
      doc.rect(50, y, doc.page.width - 100, 24).fill('#f5f3ff');
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primary).text(title, 58, y + 6);
      return y + 32;
    };

    const row = (label, value, y) => {
      doc.fontSize(10).font('Helvetica').fillColor(gray).text(label, 58, y);
      doc.fontSize(10).font('Helvetica').fillColor(dark).text(String(value || '—'), 220, y);
      return y + 20;
    };

    let y = 175;

    // Member Details
    y = sectionHeader('MEMBER DETAILS', y);
    y = row('Member ID',   member.member_code,        y);
    y = row('Name',        member.name,               y);
    y = row('Email',       member.email,              y);
    y = row('Phone',       member.phone || '—',       y);
    y += 8;

    // Membership Details
    if (plan) {
      y = sectionHeader('MEMBERSHIP DETAILS', y);
      y = row('Plan',        plan.plan_name,           y);
      y = row('Duration',    `${plan.duration_months} Month(s)`, y);
      y = row('Start Date',  membership?.start_date ? new Date(membership.start_date).toLocaleDateString('en-IN') : '—', y);
      y = row('Expiry Date', membership?.expiry_date ? new Date(membership.expiry_date).toLocaleDateString('en-IN') : '—', y);
      y += 8;
    }

    // Payment Details
    y = sectionHeader('PAYMENT DETAILS', y);
    y = row('Amount',         `₹${parseFloat(payment.amount).toFixed(2)}`, y);
    y = row('Currency',       payment.currency || 'INR', y);
    y = row('Payment Method', payment.payment_method || 'Online', y);
    y = row('Payment Status', payment.payment_status, y);
    if (payment.razorpay_order_id) y = row('Razorpay Order', payment.razorpay_order_id, y);
    if (payment.razorpay_payment_id) y = row('Payment ID', payment.razorpay_payment_id, y);
    y += 16;

    // Total Box
    doc.rect(50, y, doc.page.width - 100, 50).fill(primary);
    doc.fontSize(12).font('Helvetica').fillColor('#ffffff').text('TOTAL AMOUNT PAID', 70, y + 10);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#ffffff').text(`₹${parseFloat(payment.amount).toFixed(2)}`, 0, y + 10, { align: 'right', width: doc.page.width - 65 });
    y += 65;

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text('This is a system-generated receipt. No signature required.', 50, y, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(9).text('GymMS — Cloud-Based Gym Management System', 50, y + 14, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
};

module.exports = { generateReceipt };
