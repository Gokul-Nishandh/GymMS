import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';

const GENDERS = ['Male', 'Female', 'Other'];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [assignModal, setAssignModal] = useState(null); // member object

  const [form, setForm] = useState({
    name: '', email: '', phone: '', date_of_birth: '',
    gender: '', address: '', password: ''
  });

  const [assignForm, setAssignForm] = useState({ plan_id: '', start_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchMembers(); fetchPlans(); }, []);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/members');
      setMembers(data.data);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data.data);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/members', form);
      toast.success('Member created successfully!');
      setShowModal(false);
      setForm({ name:'', email:'', phone:'', date_of_birth:'', gender:'', address:'', password:'' });
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create member');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this member?')) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deactivated');
      fetchMembers();
    } catch { toast.error('Failed'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/memberships', { member_id: assignModal.member_id, ...assignForm });
      toast.success('Membership assigned!');
      setAssignModal(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    }
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.member_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => ({
    active:    <span className="badge badge-success">Active</span>,
    inactive:  <span className="badge badge-danger">Inactive</span>,
    suspended: <span className="badge badge-warning">Suspended</span>,
  }[s] || <span className="badge badge-default">{s}</span>);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{members.length} total members registered</p>
        </div>
        <button className="btn btn-primary" id="add-member-btn" onClick={() => setShowModal(true)}>
          ＋ Add Member
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="chip">{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No members found</div>
          <div className="empty-state-desc">Try adjusting your search</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Code</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.member_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{m.member_code}</span></td>
                  <td>{m.phone || '—'}</td>
                  <td>
                    {m.plan_name
                      ? <span className="badge badge-purple">{m.plan_name}</span>
                      : <span className="badge badge-default">No plan</span>}
                  </td>
                  <td>
                    {m.expiry_date
                      ? <span style={{ color: new Date(m.expiry_date) < new Date() ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {new Date(m.expiry_date).toLocaleDateString('en-IN')}
                        </span>
                      : '—'}
                  </td>
                  <td>{statusBadge(m.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setAssignModal(m)}>
                        🎖️ Assign
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(m.member_id)}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">➕ Add New Member</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Rahul Kumar" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="rahul@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="9876543210" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" placeholder="Set login password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="Chennai, Tamil Nadu" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Create Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Membership Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🎖️ Assign Membership</h2>
              <button className="modal-close" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(124,58,237,0.08)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{assignModal.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{assignModal.email} · {assignModal.member_code}</div>
            </div>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Membership Plan *</label>
                <select className="form-select" value={assignForm.plan_id} onChange={e=>setAssignForm({...assignForm,plan_id:e.target.value})} required>
                  <option value="">Choose a plan…</option>
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_name} — {p.duration_months} month(s) — ₹{Number(p.price).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input className="form-input" type="date" value={assignForm.start_date} onChange={e=>setAssignForm({...assignForm,start_date:e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setAssignModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Assign Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
