import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { queueAPI, appointmentAPI } from '../../services/api';
import { subscribeToQueue } from '../../services/websocket';

export default function TokenStatus() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsActive, setWsActive] = useState(false);

  const loadTokens = useCallback(async () => {
    try {
      const res = await queueAPI.getCustomerTokens(user.userId);
      setTokens(res.data.data || []);
      const active = (res.data.data || []).find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
      if (active) selectToken(active);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user.userId]);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const selectToken = async (token) => {
    setSelectedToken(token);
    try {
      const res = await queueAPI.getTokenStatus(token.appointmentId);
      setQueueData(res.data.data);
    } catch (err) { console.error(err); }
  };

  // Subscribe to real-time queue updates for the selected token's doctor
  useEffect(() => {
    if (!selectedToken?.doctorId) return;
    const unsub = subscribeToQueue(selectedToken.doctorId, (data) => {
      setWsActive(true);
      // Refresh token status when queue updates
      if (selectedToken?.appointmentId) {
        queueAPI.getTokenStatus(selectedToken.appointmentId).then(res => {
          setQueueData(res.data.data);
        }).catch(() => {});
      }
      // Also refresh token list
      queueAPI.getCustomerTokens(user.userId).then(res => {
        setTokens(res.data.data || []);
      }).catch(() => {});
    });
    return unsub;
  }, [selectedToken?.doctorId, selectedToken?.appointmentId, user.userId]);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  const activeTokens = tokens.filter(t => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(t.status));
  const statusColor = { BOOKED:'primary', CHECKED_IN:'info', WAITING:'warning', IN_CONSULTATION:'success', SKIPPED:'secondary', NO_SHOW:'danger', CANCELLED:'danger', COMPLETED:'secondary' };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">Token Status</h3>
          <p className="text-muted">Track your queue position in real-time</p>
        </div>
        {wsActive && <span className="badge bg-success"><i className="bi bi-broadcast me-1" />Live Updates</span>}
      </div>

      {activeTokens.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-ticket-perforated d-block" />
          <h5>No active tokens</h5>
          <p>Your queue tokens will appear here</p>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <h6 className="fw-bold mb-3">Your Active Tokens</h6>
            {activeTokens.map(t => (
              <div key={t.id} className={`queue-item ${selectedToken?.id === t.id ? 'your-token' : ''}`} onClick={() => selectToken(t)} style={{cursor:'pointer'}}>
                <div className="bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center fw-bold" style={{width:48,height:48,fontSize:14}}>
                  {t.tokenNumber}
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold">Token {t.tokenNumber}</small><br/>
                  <small className="text-muted">{t.tokenDate} | {t.sequenceNumber ? `#${t.sequenceNumber}` : ''}</small>
                </div>
                <span className={`badge badge-${statusColor[t.status] || 'secondary'}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>

          <div className="col-lg-7">
            {selectedToken && queueData ? (
              <div>
                <div className="token-card mb-4">
                  <p className="text-muted mb-1">Your Token</p>
                  <div className="token-number">{selectedToken.tokenNumber}</div>
                  <span className={`badge badge-${statusColor[selectedToken.status]} mt-2 px-3 py-2`} style={{fontSize:14}}>
                    {selectedToken.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-3 col-6">
                    <div className="card border-0 shadow-sm text-center p-3 h-100">
                      <small className="text-muted">Currently Serving</small>
                      <h5 className="fw-bold text-success mb-0">{queueData.currentlyServing}</h5>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card border-0 shadow-sm text-center p-3 h-100">
                      <small className="text-muted">People Before You</small>
                      <h5 className="fw-bold text-warning mb-0">{queueData.peopleBefore}</h5>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card border-0 shadow-sm text-center p-3 h-100">
                      <small className="text-muted">Estimated Wait</small>
                      <h5 className="fw-bold text-info mb-0">{queueData.estimatedWait} min</h5>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card border-0 shadow-sm text-center p-3 h-100">
                      <small className="text-muted">Estimated Turn</small>
                      <h5 className="fw-bold text-primary mb-0">{queueData.estimatedTurnTime || '—'}</h5>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between">
                    <h6 className="fw-bold mb-0">Queue Position</h6>
                    {wsActive && <small className="text-success"><i className="bi bi-circle-fill me-1" style={{fontSize:6}} />Auto-updating</small>}
                  </div>
                  <div className="card-body">
                    {queueData.token && (
                      <div className="d-flex flex-column align-items-center gap-2">
                        <div className="queue-item serving" style={{width:'100%',maxWidth:300}}>
                          <div className="bg-success text-white rounded-2 d-flex align-items-center justify-content-center fw-bold" style={{width:40,height:40,fontSize:12}}>{queueData.currentlyServing}</div>
                          <div><small className="fw-semibold">Currently Serving</small></div>
                        </div>
                        <i className="bi bi-three-dots-vertical text-muted" />
                        <div className="queue-item your-token" style={{width:'100%',maxWidth:300}}>
                          <div className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center fw-bold" style={{width:40,height:40,fontSize:12}}>{selectedToken.tokenNumber}</div>
                          <div><small className="fw-semibold">Your Token</small></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-info-circle d-block" />
                <h5>Select a token to view details</h5>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
