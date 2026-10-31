import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { queueAPI } from '../../services/api';

export default function ReceptionistQueue() {
  const [queue, setQueue] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQueue = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await queueAPI.getQueue(doctorId);
      setQueue(res.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCheckIn = async (tokenId) => {
    try { await queueAPI.checkIn(tokenId); loadQueue(); } catch (err) { alert('Failed'); }
  };

  const handleSkip = async (tokenId) => {
    try { await queueAPI.skipToken(tokenId); loadQueue(); } catch (err) { alert('Failed'); }
  };

  const handleCancel = async (tokenId) => {
    if (!window.confirm('Cancel this token?')) return;
    try { await queueAPI.cancelToken(tokenId); loadQueue(); } catch (err) { alert('Failed'); }
  };

  const statusColor = { BOOKED:'primary', CHECKED_IN:'info', WAITING:'warning', IN_CONSULTATION:'success', COMPLETED:'secondary', CANCELLED:'danger', SKIPPED:'secondary', NO_SHOW:'danger' };

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Queue Management</h3>
        <p className="text-muted">Manage patient queue and tokens</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-medium">Doctor ID</label>
              <input type="text" className="form-control" placeholder="Enter doctor ID" value={doctorId} onChange={e => setDoctorId(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={loadQueue} disabled={!doctorId || loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Load Queue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white"><h6 className="fw-bold mb-0">Active Queue ({queue.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length})</h6></div>
          <div className="card-body">
            {queue.map(t => (
              <div key={t.id} className={`queue-item mb-2 ${t.status === 'IN_CONSULTATION' ? 'serving' : ''}`}>
                <div className={`rounded-2 d-flex align-items-center justify-content-center fw-bold ${t.status === 'IN_CONSULTATION' ? 'bg-success text-white' : 'bg-primary bg-opacity-10 text-primary'}`} style={{width:48,height:48,fontSize:14}}>
                  {t.tokenNumber}
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold">{t.tokenNumber}</small><br/>
                  <small className="text-muted">Customer #{t.customerId} • #{t.sequenceNumber}</small>
                </div>
                <span className={`badge badge-${statusColor[t.status]} me-2`}>{t.status.replace('_', ' ')}</span>
                <div className="d-flex gap-1">
                  {t.status === 'BOOKED' && <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(t.id)}>Check In</button>}
                  {(t.status === 'WAITING' || t.status === 'BOOKED') && <button className="btn btn-sm btn-outline-secondary" onClick={() => handleSkip(t.id)}>Skip</button>}
                  {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(t.id)}>Cancel</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {queue.length === 0 && !loading && doctorId && (
        <div className="empty-state">
          <i className="bi bi-inbox d-block" />
          <h5>No tokens in queue</h5>
        </div>
      )}
    </Layout>
  );
}
