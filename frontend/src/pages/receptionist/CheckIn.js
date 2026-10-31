import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { queueAPI, appointmentAPI } from '../../services/api';

export default function CheckIn() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      // Search by getting all appointments and filtering
      const res = await appointmentAPI.getAll();
      const apts = (res.data.data || []).filter(a =>
        String(a.tokenNumber).toLowerCase().includes(search.toLowerCase()) ||
        String(a.customerId).includes(search)
      );
      setResults(apts);
    } catch (err) { console.error(err); }
    setSearching(false);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      // Get queue token for this appointment
      const res = await queueAPI.getTokenStatus(appointmentId);
      if (res.data.data?.token?.id) {
        await queueAPI.checkIn(res.data.data.token.id);
        alert('Patient checked in successfully!');
        setResults(results.filter(r => r.id !== appointmentId));
      }
    } catch (err) { alert('Check-in failed'); }
  };

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Patient Check-in</h3>
        <p className="text-muted">Search and check in patients for their appointments</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search" /></span>
            <input type="text" className="form-control" placeholder="Search by token number or customer ID..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white"><h6 className="fw-bold mb-0">Search Results ({results.length})</h6></div>
          <div className="card-body">
            {results.map(r => (
              <div key={r.id} className="d-flex align-items-center justify-content-between p-3 rounded-3 border mb-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center fw-bold" style={{width:48,height:48,fontSize:14}}>
                    {r.tokenNumber}
                  </div>
                  <div>
                    <strong>Token: {r.tokenNumber}</strong><br/>
                    <small className="text-muted">Customer #{r.customerId} • {r.appointmentDate} at {r.timeSlot}</small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge badge-${r.status === 'BOOKED' ? 'primary' : r.status === 'CHECKED_IN' ? 'info' : 'secondary'}`}>
                    {r.status}
                  </span>
                  {r.status === 'BOOKED' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(r.id)}>
                      <i className="bi bi-person-check me-1" />Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !searching && search && (
        <div className="empty-state">
          <i className="bi bi-search d-block" />
          <h5>No results found</h5>
          <p>Try a different search term</p>
        </div>
      )}
    </Layout>
  );
}
