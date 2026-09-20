import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/attendance'), api.get('/members')])
      .then(([a, m]) => { setRecords(a.data.data); setMembers(m.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (member_id) => {
    setChecking(true);
    try {
      await api.post('/attendance/check-in', { member_id });
      toast.success('Check-in recorded!');
      const { data } = await api.get('/attendance');
      setRecords(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIds  = new Set(records.filter(r => r.attendance_date?.split('T')[0] === todayStr).map(r => r.member_id));

  const filtered = records.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.member_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">{records.filter(r => r.attendance_date?.split('T')[0] === todayStr).length} check-ins today</p>
        </div>
      </div>

      {/* Quick check-in */}
      <div className="card mb-6">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Check-In</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {members.filter(m => m.status === 'active').map(m => (
            <button
              key={m.member_id}
              id={`checkin-${m.member_id}`}
              className={`btn btn-sm ${todayIds.has(m.member_id) ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => !todayIds.has(m.member_id) && handleCheckIn(m.member_id)}
              disabled={todayIds.has(m.member_id) || checking}
              title={todayIds.has(m.member_id) ? 'Already checked in' : 'Check in'}
            >
              {todayIds.has(m.member_id) ? '✅' : '📍'} {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Search attendance…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.attendance_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.member_code}</div>
                  </td>
                  <td>{new Date(r.attendance_date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                  <td><span className="badge badge-info">{r.check_in_time}</span></td>
                  <td>{r.check_out_time ? <span className="badge badge-default">{r.check_out_time}</span> : '—'}</td>
                  <td><span className="badge badge-success">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
