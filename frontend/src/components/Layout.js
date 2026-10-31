import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications } from '../services/websocket';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user?.userId) return;
    const unsubscribe = subscribeToNotifications(user.userId, (notification) => {
      setLiveNotification(notification);
      window.setTimeout(() => setLiveNotification(null), 6000);
    });
    return unsubscribe;
  }, [user?.userId]);

  return (
    <div className="d-flex">
      {liveNotification && (
        <div className="position-fixed top-0 end-0 m-3 alert alert-info shadow-lg border-0" style={{zIndex: 2000, maxWidth: 380}} role="alert">
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-bell-fill fs-5" />
            <div className="flex-grow-1">
              <div className="fw-bold">{liveNotification.title}</div>
              <div className="small">{liveNotification.message}</div>
            </div>
            <button type="button" className="btn-close" onClick={() => setLiveNotification(null)} aria-label="Close" />
          </div>
        </div>
      )}
      <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content flex-grow-1">
        <header className="topbar d-flex align-items-center justify-content-between">
          <button className="btn btn-sm btn-light d-lg-none" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list fs-5" />
          </button>
          <div className="flex-grow-1" />
          <button className="btn btn-sm btn-light position-relative me-3" onClick={() => navigate('/notifications')}>
            <i className="bi bi-bell" />
          </button>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{width:32,height:32,fontSize:13,fontWeight:700}}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="d-none d-sm-block">
              <p className="mb-0" style={{fontSize:13,fontWeight:600}}>{user?.fullName || 'User'}</p>
              <p className="mb-0" style={{fontSize:11,color:'#64748b'}}>{user?.email}</p>
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
