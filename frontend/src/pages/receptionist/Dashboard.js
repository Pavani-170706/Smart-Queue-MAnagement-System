import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { appointmentAPI, queueAPI, doctorAPI } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState('');

  useEffect(() => {
    Promise.all([
      appointmentAPI.getAll(), doctorAPI.list(),
    ]).then(([aptRes, doctorRes]) => {
      setDoctors(doctorRes.data.data || []);
      const apts = aptRes.data.data || [];
      setStats({
        total: apts.length,
        waiting: apts.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length,
        completed: apts.filter(a => a.status === 'COMPLETED').length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Receptionist Dashboard</h3>
        <p className="text-muted">Manage appointments and patient check-ins</p>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: 'Total Appointments', value: stats.total, icon: 'bi-calendar-check', color: 'text-primary', bg: 'bg-primary bg-opacity-10' },
          { title: 'Waiting', value: stats.waiting, icon: 'bi-hourglass', color: 'text-warning', bg: 'bg-warning bg-opacity-10' },
          { title: 'Completed', value: stats.completed, icon: 'bi-check-circle', color: 'text-success', bg: 'bg-success bg-opacity-10' },
        ].map((s, i) => (
          <div key={i} className="col-md-4">
            <div className="stat-card">
              <div className="d-flex justify-content-between">
                <div><p className="text-muted mb-1" style={{fontSize:13}}>{s.title}</p><h3 className="fw-bold mb-0">{s.value}</h3></div>
                <div className={`stat-icon ${s.bg} ${s.color}`}><i className={`bi ${s.icon}`} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div><h5 className="fw-bold mb-1">Doctor Directory</h5><p className="text-muted small mb-0">Doctors imported from the hospital dataset</p></div>
            <select className="form-select" style={{maxWidth:260}} value={department} onChange={e => setDepartment(e.target.value)}><option value="">All departments</option>{[...new Set(doctors.map(d => d.profile?.department).filter(Boolean))].sort().map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
          </div>
          <div className="row g-3">{doctors.filter(d => !department || d.profile?.department === department).map(d => <div className="col-md-6 col-xl-4" key={d.user?.id}>
            <div className="border rounded-3 p-3 h-100"><div className="fw-bold">{d.user?.fullName}</div><div className="text-primary small">{d.profile?.specialization}</div><div className="text-muted small">{d.profile?.department} · Room {d.profile?.room}</div><div className="text-muted small">{d.profile?.qualification} · {d.profile?.experience} yrs experience</div></div>
          </div>)}{doctors.length === 0 && <div className="col-12 text-muted">No active doctors are available yet. Ask an administrator to import the doctor dataset.</div>}</div>
        </div>
      </div>

      <div className="row g-4">
        {[
          { title: 'Patient Check-in', desc: 'Check in patients for their appointments', path: '/receptionist/checkin', icon: 'bi-person-check', color: 'text-primary' },
          { title: 'Queue Management', desc: 'Manage the active queue and tokens', path: '/receptionist/queue', icon: 'bi-activity', color: 'text-success' },
        ].map(a => (
          <div key={a.path} className="col-md-6">
            <Link to={a.path} className="text-decoration-none">
              <div className="feature-card h-100">
                <div className={`bg-primary bg-opacity-10 ${a.color} rounded-3 d-inline-flex align-items-center justify-content-center mb-3`} style={{width:48,height:48}}>
                  <i className={`bi ${a.icon} fs-4`} />
                </div>
                <h5 className="fw-bold text-dark">{a.title}</h5>
                <p className="text-muted mb-0">{a.desc}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </Layout>
  );
}
