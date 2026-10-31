import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI } from '../../services/api';

export default function History() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!user?.userId) return;

  appointmentAPI.getMy(user.userId)
    .then(res => {
      setAppointments(res.data.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load appointment history:', err);
      setLoading(false);
    });
}, [user]);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Appointment History</h3>
        <p className="text-muted">View your past consultations</p>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-clock-history d-block" />
          <h5>No history yet</h5>
          <p>Your completed and cancelled appointments will appear here</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded-3 overflow-hidden shadow-sm">
            <thead className="table-light">
              <tr><th>Date</th><th>Time</th><th>Token</th><th>Status</th><th>Details</th></tr>
            </thead>
            <tbody>
              {appointments.map(a => {
                const rescheduled = a.rescheduleCount > 0;
                const cancelled = a.status === 'CANCELLED';
                const badge = a.status === 'COMPLETED' ? 'success' : cancelled ? 'danger' : a.status === 'IN_CONSULTATION' ? 'success' : a.status === 'CHECKED_IN' ? 'info' : 'primary';
                const statusLabel = cancelled && rescheduled
                  ? 'Cancelled — Missed Rescheduled Appointment'
                  : a.status.replace('_', ' ');
                const fmt = (d) => (d ? new Date(d).toLocaleString() : '');
                return (
                  <tr key={a.id}>
                    <td>
                      {a.appointmentDate}
                      {rescheduled && a.originalAppointmentDate && (
                        <div className="small text-muted">Original: {a.originalAppointmentDate}</div>
                      )}
                    </td>
                    <td>
                      {a.timeSlot}
                      {rescheduled && a.originalTimeSlot && (
                        <div className="small text-muted">Original: {a.originalTimeSlot}</div>
                      )}
                    </td>
                    <td><strong>{a.tokenNumber}</strong></td>
                    <td>
                      <span className={`badge badge-${badge}`}>{statusLabel}</span>
                      {rescheduled && !cancelled && (
                        <span className="badge bg-warning text-dark ms-1">Automatically Rescheduled</span>
                      )}
                    </td>
                    <td className="small text-muted">
                      {rescheduled && <div>Rescheduled {a.rescheduleCount} time{a.rescheduleCount > 1 ? 's' : ''}{a.lastRescheduledAt ? ' on ' + fmt(a.lastRescheduledAt) : ''}</div>}
                      {rescheduled && a.lastRescheduleMessage && <div>{a.lastRescheduleMessage}</div>}
                      {cancelled && a.cancellationReason && <div>{a.cancellationReason}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
