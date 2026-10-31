import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navConfig = {
  CUSTOMER: [
    { label: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2' },
    { label: 'Find Doctors', path: '/doctors', icon: 'bi-search' },
    { label: 'My Appointments', path: '/appointments', icon: 'bi-calendar-check' },
    { label: 'Token Status', path: '/token-status', icon: 'bi-ticket-perforated' },
    { label: 'History', path: '/history', icon: 'bi-clock-history' },
    { label: 'Medical Records', path: '/medical-records', icon: 'bi-file-earmark-text' },
    { label: 'Notifications', path: '/notifications', icon: 'bi-bell' },
    { label: 'Profile', path: '/profile', icon: 'bi-person' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/doctor', icon: 'bi-grid-1x2' },
    { label: "Today's Queue", path: '/doctor/queue', icon: 'bi-list-task' },
    { label: 'Appointments Calendar', path: '/doctor/appointments', icon: 'bi-calendar3' },
    { label: 'Patients', path: '/doctor/patients', icon: 'bi-people' },
    { label: 'Notifications', path: '/notifications', icon: 'bi-bell' },
    { label: 'Profile', path: '/profile', icon: 'bi-person' },
  ],
  RECEPTIONIST: [
    { label: 'Dashboard', path: '/receptionist', icon: 'bi-grid-1x2' },
    { label: 'Patient Check-in', path: '/receptionist/checkin', icon: 'bi-person-check' },
    { label: 'Queue Management', path: '/receptionist/queue', icon: 'bi-activity' },
    { label: 'Notifications', path: '/notifications', icon: 'bi-bell' },
    { label: 'Profile', path: '/profile', icon: 'bi-person' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin', icon: 'bi-grid-1x2' },
    { label: 'Staff Management', path: '/admin/staff', icon: 'bi-person-gear' },
    { label: 'Doctor Management', path: '/admin/doctors', icon: 'bi-heart-pulse' },
    { label: 'Customers', path: '/admin/customers', icon: 'bi-people' },
    { label: 'Notifications', path: '/notifications', icon: 'bi-bell' },
    { label: 'Profile', path: '/profile', icon: 'bi-person' },
  ],
};

const roleConfig = {
  CUSTOMER: { label: 'Patient', icon: 'bi-heart-pulse', color: 'bg-primary bg-opacity-10 text-primary' },
  DOCTOR: { label: 'Doctor', icon: 'bi-stethoscope', color: 'bg-success bg-opacity-10 text-success' },
  RECEPTIONIST: { label: 'Receptionist', icon: 'bi-person-badge', color: 'bg-warning bg-opacity-10 text-warning' },
  ADMIN: { label: 'Administrator', icon: 'bi-shield-check', color: 'bg-purple bg-opacity-10 text-purple' },
};

export default function Sidebar({ show, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'CUSTOMER';
  const navItems = navConfig[role] || navConfig.CUSTOMER;
  const roleInfo = roleConfig[role] || roleConfig.CUSTOMER;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {show && <div className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" style={{zIndex:999}} onClick={onClose} />}
      <aside className={`sidebar ${show ? 'show' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><i className="bi bi-heart-pulse" /></div>
          <div>
            <h5>MedQueue</h5>
            <small>Hospital QMS</small>
          </div>
          <button className="btn btn-sm btn-link text-white ms-auto d-lg-none" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="sidebar-role">
          <span className={`badge ${roleInfo.color}`}>
            <i className={`bi ${roleInfo.icon}`} />
            {roleInfo.label}
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/doctor' || item.path === '/receptionist' || item.path === '/admin'}
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-signout">
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left me-2" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
