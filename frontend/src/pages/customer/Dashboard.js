import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, notificationAPI, medicalAPI } from '../../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user?.userId) {
        const [aptRes, notifRes, recordRes] = await Promise.all([
          appointmentAPI.getMy(user.userId),
          notificationAPI.getMy(user.userId),
          medicalAPI.getPatientRecords(user.userId)
        ]);
        setAppointments(aptRes.data.data || []);
        setNotifications(notifRes.data.data || []);
        setRecordCount((recordRes.data.data || []).length);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const upcoming = appointments.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN');
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const unreadNotifs = notifications.filter(n => !n.isRead);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">{getGreeting()}, {user?.fullName?.split(' ')[0] || 'there'}</h3>
        <p className="text-muted">Here's your health dashboard overview</p>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: 'Upcoming', value: upcoming.length, icon: 'bi-calendar-check', color: 'text-primary', bg: 'bg-primary bg-opacity-10' },
          { title: 'Completed', value: completed.length, icon: 'bi-check-circle', color: 'text-success', bg: 'bg-success bg-opacity-10' },
          { title: 'Notifications', value: unreadNotifs.length, icon: 'bi-bell', color: 'text-warning', bg: 'bg-warning bg-opacity-10' },
          { title: 'Medical Records', value: recordCount, icon: 'bi-file-text', color: 'text-info', bg: 'bg-info bg-opacity-10' },
        ].map((s, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1" style={{fontSize:13}}>{s.title}</p>
                  <h3 className="fw-bold mb-0">{s.value}</h3>
                </div>
                <div className={`stat-icon ${s.bg} ${s.color}`}><i className={`bi ${s.icon}`} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Appointment */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Upcoming Appointment</h6>
          <Link to="/doctors" className="btn btn-sm btn-outline-primary">Find Doctor</Link>
        </div>
        <div className="card-body">
          {upcoming.length > 0 ? (
            <div className="p-3 rounded-3 bg-primary bg-opacity-5 border border-primary border-opacity-10">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{width:48,height:48}}>
                  <i className="bi bi-heart-pulse fs-5" />
                </div>
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0">{upcoming[0].tokenNumber}</h6>
                  <small className="text-muted">Date: {upcoming[0].appointmentDate} | Time: {upcoming[0].timeSlot}</small>
                </div>
                <span className={`badge rounded-pill badge-${upcoming[0].status.toLowerCase()}`}>{upcoming[0].status}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2" />
              <p>No upcoming appointments</p>
              <Link to="/doctors" className="btn btn-primary btn-sm">Find Doctors</Link>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Quick Actions */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white"><h6 className="fw-bold mb-0">Quick Actions</h6></div>
            <div className="card-body">
              {[
                { label: 'Find Doctors', desc: 'Search and book with specialists', path: '/doctors', icon: 'bi-search' },
                { label: 'View Token Status', desc: 'Check your queue position', path: '/token-status', icon: 'bi-ticket-perforated' },
                { label: 'Medical Records', desc: 'Access your health records', path: '/medical-records', icon: 'bi-file-text' },
                { label: 'History', desc: 'View past consultations', path: '/history', icon: 'bi-clock-history' },
              ].map(a => (
                <Link key={a.path} to={a.path} className="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none mb-2" style={{transition:'background 0.15s'}}>
                  <div className="bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center" style={{width:36,height:36}}>
                    <i className={`bi ${a.icon}`} />
                  </div>
                  <div className="flex-grow-1">
                    <small className="fw-semibold">{a.label}</small><br/>
                    <small className="text-muted">{a.desc}</small>
                  </div>
                  <i className="bi bi-chevron-right text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between">
              <h6 className="fw-bold mb-0">Recent Notifications</h6>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {notifications.length > 0 ? notifications.slice(0, 4).map(n => (
                <div key={n.id} className={`p-2 rounded-3 mb-2 ${n.isRead ? '' : 'bg-primary bg-opacity-5'}`}>
                  <div className="d-flex gap-2">
                    {!n.isRead && <div className="bg-primary rounded-circle mt-1" style={{width:6,height:6}} />}
                    <div>
                      <small className="fw-semibold">{n.title}</small><br/>
                      <small className="text-muted">{n.message}</small>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted py-3">
                  <i className="bi bi-bell-slash fs-4 d-block mb-2" />
                  <small>No notifications yet</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
