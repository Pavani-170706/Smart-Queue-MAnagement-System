import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI } from '../../services/api';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAppointments(); }, [user]);

  const loadAppointments = async () => {
    try {
      const res = await appointmentAPI.getMy(user.userId);
      setAppointments(res.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id);
      loadAppointments();
    } catch (err) { alert('Failed to cancel'); }
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  const statusColor = { BOOKED:'primary', CHECKED_IN:'info', IN_CONSULTATION:'success', COMPLETED:'secondary', CANCELLED:'danger' };

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">My Appointments</h3>
        <p className="text-muted">Manage your upcoming and past appointments</p>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-calendar-x d-block" />
          <h5>No appointments yet</h5>
          <p>Book your first appointment with a specialist</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded-3 overflow-hidden shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Token</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.appointmentDate}
                    {a.rescheduleCount > 0 && a.originalAppointmentDate && (
                      <div className="small text-muted text-decoration-line-through">Original: {a.originalAppointmentDate}</div>
                    )}
                  </td>
                  <td>
                    {a.timeSlot}
                    {a.rescheduleCount > 0 && a.originalTimeSlot && (
                      <div className="small text-muted text-decoration-line-through">Original: {a.originalTimeSlot}</div>
                    )}
                  </td>
                  <td><strong>{a.tokenNumber}</strong></td>
                  <td><span className={`badge badge-${statusColor[a.status]}`}>{a.status.replace('_', ' ')}</span>
                    {a.rescheduleCount > 0 && a.status !== 'CANCELLED' && (
                      <span className="badge bg-warning text-dark ms-1">Automatically Rescheduled</span>
                    )}
                    {a.status === 'CANCELLED' && a.rescheduleCount > 0 && (
                      <div className="small text-danger mt-1">Cancelled — Missed Rescheduled Appointment</div>
                    )}
                    {a.rescheduleCount > 0 && a.lastRescheduleMessage && (
                      <div className="small text-muted mt-1">{a.lastRescheduleMessage}</div>
                    )}
                  </td>
                  <td>
                    {(a.status === 'BOOKED' || a.status === 'CHECKED_IN') && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(a.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
