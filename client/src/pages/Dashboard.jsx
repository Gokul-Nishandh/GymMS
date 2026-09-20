import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon, label, value, trend }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-label">{label}</span>
      <span className="stat-icon">{icon}</span>
    </div>
    <div className="stat-value">{value ?? '—'}</div>
    {trend && <div className="stat-trend">{trend}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/members/stats'),
      api.get('/payments'),
    ])
      .then(([s, p]) => {
        setStats(s.data.data);
        setPayments(p.data.data.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const map = { PAID: 'success', PENDING: 'warning', FAILED: 'danger' };
    return <span className={`badge badge-${map[s] || 'neutral'}`}>{s}</span>;
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard metrics…</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-desc">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/members')}>
          ＋ Add New Member
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="👥" label="Active Members" value={stats?.total_members} trend="Enrolled" />
        <StatCard icon="⏱️" label="Check-ins Today" value={stats?.today_checkins} trend="Daily attendance" />
        <StatCard icon="⚠️" label="Expiring Soon" value={stats?.expiring_memberships} trend="Within 7 days" />
        <StatCard
          icon="💰"
          label="Monthly Revenue"
          value={stats?.monthly_revenue ? `₹${Number(stats.monthly_revenue).toLocaleString('en-IN')}` : '₹0'}
          trend="Total captured"
        />
        <StatCard icon="⏳" label="Pending Payments" value={stats?.pending_payments} trend="Action required" />
      </div>

      {/* Recent Payments Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Transactions</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Latest membership order transactions via Razorpay</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/payments')}>
            View All Payments
          </button>
        </div>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No recent payment transactions found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Receipt Number</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.member_code}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {p.receipt_number || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN')}
                    </td>
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
