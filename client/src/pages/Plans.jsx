import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';

export default function Plans() {
  const [plans,  setPlans]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ plan_name: '', duration_months: '', price: '', description: '', features: '' });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data.data);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const features = form.features.split('\n').map(s => s.trim()).filter(Boolean);
      await api.post('/plans', { ...form, duration_months: Number(form.duration_months), price: Number(form.price), features });
      toast.success('Plan created!');
      setShowModal(false);
      setForm({ plan_name:'', duration_months:'', price:'', description:'', features:'' });
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const colorMap = ['purple', 'cyan', 'amber', 'green'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Membership Plans</h1>
          <p className="page-subtitle">Manage gym subscription plans</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Plan</button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {plans.map((p, i) => {
            const features = (() => { try { return typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []); } catch { return []; } })();
            return (
              <div key={p.plan_id} className="plan-card">
                {i === 1 && <div className="plan-card-popular">⭐ Popular</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{p.plan_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{p.duration_months} month{p.duration_months > 1 ? 's' : ''}</div>
                  </div>
                  <span className={`badge badge-${colorMap[i % 4]}`}>{p.status}</span>
                </div>
                <div className="plan-price">₹{Number(p.price).toLocaleString('en-IN')} <span>/ {p.duration_months}mo</span></div>
                {p.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>{p.description}</p>}
                <ul className="plan-features">
                  {features.slice(0, 5).map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            );
          })}

          {/* Add Plan tile */}
          <div className="plan-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, cursor: 'pointer', border: '2px dashed rgba(124,58,237,0.3)' }} onClick={() => setShowModal(true)}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>＋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>Create New Plan</div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📋 Create Plan</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Plan Name *</label>
                <input className="form-input" placeholder="Premium" value={form.plan_name} onChange={e=>setForm({...form,plan_name:e.target.value})} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Duration (months) *</label>
                  <input className="form-input" type="number" min="1" placeholder="3" value={form.duration_months} onChange={e=>setForm({...form,duration_months:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" min="0" placeholder="2999" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Brief description…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Features (one per line)</label>
                <textarea className="form-input" rows={4} placeholder={"Gym Access\nLocker Room\nAll Equipment"} value={form.features} onChange={e=>setForm({...form,features:e.target.value})} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
