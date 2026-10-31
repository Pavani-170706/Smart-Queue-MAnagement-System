import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI, appointmentAPI } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, doctors: 0, receptionists: 0, appointments: 0, waiting: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getCustomers(), adminAPI.getStaff(), appointmentAPI.getAll()]).then(([custRes, staffRes, aptRes]) => {
      const staff = staffRes.data.data || [];
      const apts = aptRes.data.data || [];
      setStats({
        customers: (custRes.data.data || []).length,
        doctors: staff.filter(s => s.role === 'DOCTOR').length,
        receptionists: staff.filter(s => s.role === 'RECEPTIONIST').length,
        appointments: apts.length,
        waiting: apts.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length,
        completed: apts.filter(a => a.status === 'COMPLETED').length,
        cancelled: apts.filter(a => a.status === 'CANCELLED').length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Admin Dashboard</h3>
        <p className="text-muted">System overview and management</p>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: 'Customers', value: stats.customers, icon: 'bi-people', color: 'text-primary', bg: 'bg-primary bg-opacity-10' },
          { title: 'Doctors', value: stats.doctors, icon: 'bi-heart-pulse', color: 'text-success', bg: 'bg-success bg-opacity-10' },
          { title: 'Receptionists', value: stats.receptionists, icon: 'bi-person-badge', color: 'text-warning', bg: 'bg-warning bg-opacity-10' },
          { title: "Today's Appointments", value: stats.appointments, icon: 'bi-calendar-check', color: 'text-info', bg: 'bg-info bg-opacity-10' },
          { title: 'Waiting', value: stats.waiting, icon: 'bi-hourglass', color: 'text-warning', bg: 'bg-warning bg-opacity-10' },
          { title: 'Completed', value: stats.completed, icon: 'bi-check-circle', color: 'text-success', bg: 'bg-success bg-opacity-10' },
          { title: 'Cancelled', value: stats.cancelled, icon: 'bi-x-circle', color: 'text-danger', bg: 'bg-danger bg-opacity-10' },
        ].map((s, i) => (
          <div key={i} className="col-6 col-lg-3 col-xl">
            <div className="stat-card">
              <div className="d-flex justify-content-between">
                <div><p className="text-muted mb-1" style={{fontSize:12}}>{s.title}</p><h4 className="fw-bold mb-0">{s.value}</h4></div>
                <div className={`stat-icon ${s.bg} ${s.color}`} style={{width:36,height:36}}><i className={`bi ${s.icon}`} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
