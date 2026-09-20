import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from '../components/Toast';

// Load Razorpay script dynamically
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function MyPayments() {
  const { profile } = useAuth();
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [success,   setSuccess]   = useState(null);

  const memberId = profile?.member_id;

  const fetchPayments = useCallback(async () => {
    if (!memberId) return;
    try {
      const { data } = await api.get(`/payments/member/${memberId}`);
      setPayments(data.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [memberId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handlePay = async (payment) => {
    setPaying(true);
    try {
      // Step 1 — create Razorpay order on server
      const { data: orderData } = await api.post('/payments/create-order', { payment_id: payment.payment_id });

      const { orderId, amount, currency, keyId, payment_id } = orderData.data;

      // Step 2 — load Razorpay checkout script
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your connection.');
        setPaying(false);
        return;
      }

      // Demo mode: if key is placeholder, simulate success
      const isDemo = !keyId || keyId === 'rzp_test_placeholder';
      if (isDemo) {
        toast.info('Demo mode: simulating payment success (add real Razorpay keys in .env)');
        await simulatePayment(payment_id, orderId);
        setPaying(false);
        return;
      }

      // Step 3 — open Razorpay Checkout
      const options = {
        key:         keyId,
        amount:      amount,
        currency:    currency,
        name:        'GymMS',
        description: `Membership Payment — ${profile?.name}`,
        order_id:    orderId,
        prefill: {
          name:    profile?.name,
          email:   profile?.email,
          contact: profile?.phone,
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => { toast.info('Payment cancelled'); setPaying(false); },
        },
        handler: async (response) => {
          // Step 4 — verify on backend
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              payment_id,
            });

            if (verifyData.success) {
              setSuccess(verifyData.data);
              toast.success('Payment verified! Receipt generated.');
              fetchPayments();
            } else {
              toast.error('Payment verification failed');
            }
          } catch {
            toast.error('Verification error. Contact support.');
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  const simulatePayment = async (payment_id, orderId) => {
    try {
      // In demo mode we send the order ID back without a real signature
      const { data } = await api.post('/payments/verify', {
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_order_id:   orderId,
        razorpay_signature:  'demo_signature',
        payment_id,
      });
      if (data.success) {
        setSuccess(data.data);
        toast.success('Demo payment complete! Receipt generated.');
        fetchPayments();
      }
    } catch (err) {
      toast.error('Demo verification failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const statusBadge = (s) => {
    const map = { PAID: 'success', PENDING: 'warning', FAILED: 'danger' };
    return <span className={`badge badge-${map[s] || 'default'}`}>{s}</span>;
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Payments</h1>
          <p className="page-subtitle">View pending fees and make online payments</p>
        </div>
      </div>

      {/* Pending payments */}
      {payments.filter(p => p.payment_status === 'PENDING').map(p => (
        <div key={p.payment_id} className="payment-card mb-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="badge badge-warning">⏳ Payment Due</span>
            <span className="chip">#{p.receipt_number || `PAY-${p.payment_id}`}</span>
          </div>

          <div className="amount-display">
            <span className="currency">₹</span>
            <span className="value">{Number(p.amount).toLocaleString('en-IN')}</span>
            <span className="period">Membership fee · {p.plan_name || 'Plan'}</span>
          </div>

          <div className="plan-highlight">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Member',  profile?.name],
                ['Member ID', profile?.member_code],
                ['Amount', `₹${Number(p.amount).toLocaleString('en-IN')}`],
                ['Due Date', new Date(p.created_at).toLocaleDateString('en-IN')],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            id={`pay-btn-${p.payment_id}`}
            className="btn btn-pay btn-full"
            onClick={() => handlePay(p)}
            disabled={paying}
          >
            {paying ? <><span className="spinner" style={{width:20,height:20,borderWidth:2}} /> Processing…</> : '💳 Pay Now with Razorpay'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            🔒 Secured by Razorpay · UPI, Cards, Net Banking, Wallets accepted
          </p>
        </div>
      ))}

      {/* Success modal */}
      {success && (
        <div className="modal-overlay" onClick={() => setSuccess(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="payment-success">
              <div className="success-icon">✅</div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Payment Successful!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your receipt has been generated</p>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Receipt Number</div>
                <div style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{success.receipt_number}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setSuccess(null); window.location.href='/receipts'; }}>
                  🧾 View Receipts
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSuccess(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📋 Payment History</h3>
        {payments.filter(p => p.payment_status !== 'PENDING').length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No payment history</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.filter(p => p.payment_status !== 'PENDING').map(p => (
                  <tr key={p.payment_id}>
                    <td><span className="chip">{p.receipt_number || '—'}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td>{new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN')}</td>
                    <td>{p.payment_method || '—'}</td>
                    <td>{statusBadge(p.payment_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
