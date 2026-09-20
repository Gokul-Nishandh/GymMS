import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from '../components/Toast';

export default function Receipts() {
  const { profile } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [downloading, setDownloading] = useState(null);

  const memberId = profile?.member_id;

  useEffect(() => {
    if (!memberId) { setLoading(false); return; }
    api.get(`/receipts/member/${memberId}`)
      .then(({ data }) => setReceipts(data.data))
      .catch(() => toast.error('Failed to load receipts'))
      .finally(() => setLoading(false));
  }, [memberId]);

  const handleDownload = async (paymentId, receiptNumber) => {
    setDownloading(paymentId);
    try {
      const { data } = await api.get(`/receipts/${paymentId}/download`);
      if (data.data?.download_url) {
        window.open(data.data.download_url, '_blank');
        toast.success('Receipt opened!');
      } else {
        toast.info('Receipt will download shortly');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Receipts</h1>
          <p className="page-subtitle">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''} generated</p>
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-title">No receipts yet</div>
          <div className="empty-state-desc">Complete a payment to get your first receipt</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {receipts.map(r => (
            <div key={r.receipt_id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Decorative */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.08)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Receipt Number</div>
                  <div style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 800, color: 'var(--success)' }}>
                    {r.receipt_number}
                  </div>
                </div>
                <span className="badge badge-success">✓ PAID</span>
              </div>

              <div className="divider" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amount</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>₹{Number(r.amount).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {new Date(r.payment_date || r.generated_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>File</div>
                  <div style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.file_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Storage</div>
                  <div>
                    {r.s3_object_key
                      ? <span className="badge badge-info">☁️ S3</span>
                      : <span className="badge badge-default">💾 Local</span>}
                  </div>
                </div>
              </div>

              <button
                id={`download-receipt-${r.receipt_id}`}
                className="btn btn-success btn-full"
                onClick={() => handleDownload(r.payment_id, r.receipt_number)}
                disabled={downloading === r.payment_id}
              >
                {downloading === r.payment_id
                  ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Preparing…</>
                  : '⬇️ Download Receipt PDF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
