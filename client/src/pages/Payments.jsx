import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments')
      .then(({ data }) => setPayments(data.data))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const map = { PAID: 'success', PENDING: 'warning', FAILED: 'danger', REFUNDED: 'info' };
    return <span className={`badge badge-${map[s] || 'default'}`}>{s}</span>;
  };

  const filtered = payments.filter(p => {
    const matchFilter = filter === 'ALL' || p.payment_status === filter;
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.receipt_number || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const total   = payments.filter(p => p.payment_status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter(p => p.payment_status === 'PENDING').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Total collected: ₹{total.toLocaleString('en-IN')} · {pending} pending</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by member or receipt…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['ALL', 'PAID', 'PENDING', 'FAILED'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <span className="chip">{filtered.length} records</span>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-title">No payments found</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Receipt No.</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Razorpay ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.payment_id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{p.payment_id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.member_code}</div>
                  </td>
                  <td><span className="chip">{p.receipt_number || '—'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                  <td>{p.payment_method || '—'}</td>
                  <td style={{ fontSize: 13 }}>{new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN')}</td>
                  <td>{statusBadge(p.payment_status)}</td>
                  <td>
                    {p.razorpay_payment_id
                      ? <span className="chip" style={{ fontSize: 11 }}>{p.razorpay_payment_id.slice(-8)}</span>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
