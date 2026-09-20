import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function MemberPortal() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const memberId = profile?.member_id;

  useEffect(() => {
    if (!memberId) { setLoading(false); return; }
    Promise.all([
      api.get(`/memberships/${memberId}`),
      api.get(`/attendance/${memberId}`),
      api.get(`/payments/member/${memberId}`),
    ]).then(([ms, att, pay]) => {
      const active = ms.data.data.find(m => m.status === 'active');
      setMembership(active || null);
      setAttendance(att.data.data.slice(0, 7));
      setPayments(pay.data.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [memberId]);

  const daysLeft = membership
    ? Math.max(0, Math.ceil((new Date(membership.expiry_date) - new Date()) / 86400000))
    : 0;

  const expiryPct = membership
    ? Math.min(100, Math.round((daysLeft / (membership.duration_months * 30)) * 100))
    : 0;

  const pendingPayment = payments.find(p => p.payment_status === 'PENDING');

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  const initials = (profile?.name || 'M').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="fade-in">
      {/* Member header */}
      <div className="member-portal-header">
        <div className="member-avatar-lg">{initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            Welcome back, {profile?.name?.split(' ')[0] || 'Member'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {profile?.member_code} · Joined {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
        {pendingPayment && (
          <button className="btn btn-pay" onClick={() => navigate('/my-payments')}>
            💳 Pay Now — ₹{Number(pendingPayment.amount).toLocaleString('en-IN')}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Membership card */}
        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple">🎖️</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{membership?.plan_name || 'No Plan'}</div>
          <div className="stat-label">Current Plan</div>
        </div>

        <div className="stat-card stat-card-cyan">
          <div className="stat-icon stat-icon-cyan">📅</div>
          <div className="stat-value">{daysLeft}</div>
          <div className="stat-label">Days Remaining</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green">📍</div>
          <div className="stat-value">{attendance.length}</div>
          <div className="stat-label">Check-ins This Month</div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-icon stat-icon-amber">💳</div>
          <div className="stat-value">{payments.filter(p => p.payment_status === 'PAID').length}</div>
          <div className="stat-label">Payments Made</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
        {/* Membership details */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎖️ Membership Details</h3>
          {membership ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  ['Plan',        membership.plan_name],
                  ['Duration',    `${membership.duration_months} month(s)`],
                  ['Start Date',  new Date(membership.start_date).toLocaleDateString('en-IN')],
                  ['Expiry Date', new Date(membership.expiry_date).toLocaleDateString('en-IN')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Validity</span>
                <span style={{ color: daysLeft < 10 ? 'var(--danger)' : 'var(--success)' }}>{daysLeft} days left</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${expiryPct}%`, background: daysLeft < 10 ? 'var(--danger)' : undefined }} />
              </div>

              {/* Features */}
              {(() => { try { const f = typeof membership.features === 'string' ? JSON.parse(membership.features) : membership.features; return f?.length ? (
                <ul className="plan-features" style={{ marginTop: 16 }}>
                  {f.map((feat, i) => <li key={i}>{feat}</li>)}
                </ul>
              ) : null; } catch { return null; } })()}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🎖️</div>
              <div className="empty-state-title">No active membership</div>
              <div className="empty-state-desc">Contact your gym admin to get started</div>
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📅 Recent Attendance</h3>
          {attendance.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No records yet</div>
            </div>
          ) : (
            <div className="activity-list">
              {attendance.map(a => (
                <div key={a.attendance_id} className="activity-item">
                  <div className="activity-dot" style={{ background: 'var(--success)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(a.attendance_date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Check-in: {a.check_in_time}</div>
                  </div>
                  <span className="badge badge-success">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
