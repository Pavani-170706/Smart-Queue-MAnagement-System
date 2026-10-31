import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, [user]);

  const loadNotifications = async () => {
    try { const res = await notificationAPI.getMy(user.userId); setNotifications(res.data.data || []); } catch (err) { console.error(err); }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try { await notificationAPI.markAsRead(id, user.userId); loadNotifications(); } catch (err) {}
  };

  const markAllRead = async () => {
    try { await notificationAPI.markAllAsRead(user.userId); loadNotifications(); } catch (err) {}
  };

  const typeIcon = { APPOINTMENT: 'bi-calendar-check text-primary', QUEUE: 'bi-clock text-warning', MEDICAL: 'bi-file-text text-success', SYSTEM: 'bi-gear text-secondary' };
  const typeBg = { APPOINTMENT: 'bg-primary bg-opacity-10', QUEUE: 'bg-warning bg-opacity-10', MEDICAL: 'bg-success bg-opacity-10', SYSTEM: 'bg-secondary bg-opacity-10' };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  const unread = notifications.filter(n => !n.isRead);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">Notifications</h3>
          <p className="text-muted mb-0">{unread.length} unread notification{unread.length !== 1 ? 's' : ''}</p>
        </div>
        {unread.length > 0 && <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}><i className="bi bi-check-all me-1" />Mark all read</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-bell d-block" />
          <h5>No notifications</h5>
          <p>You'll see updates about your appointments here</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {notifications.map(n => (
            <div key={n.id} className={`p-3 rounded-3 border ${n.isRead ? '' : 'bg-primary bg-opacity-5 border-primary border-opacity-10'}`} onClick={() => !n.isRead && markAsRead(n.id)} style={{cursor:'pointer'}}>
              <div className="d-flex gap-3">
                <div className={`${typeBg[n.type]} rounded-2 d-flex align-items-center justify-content-center`} style={{width:36,height:36}}>
                  <i className={`bi ${typeIcon[n.type] || 'bi-bell'}`} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2">
                    <small className="fw-bold">{n.title}</small>
                    {!n.isRead && <div className="bg-primary rounded-circle" style={{width:6,height:6}} />}
                  </div>
                  <small className="text-muted">{n.message}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
