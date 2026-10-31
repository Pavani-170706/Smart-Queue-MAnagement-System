import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import DoctorSearch from './pages/customer/DoctorSearch';
import BookAppointment from './pages/customer/BookAppointment';
import TokenStatus from './pages/customer/TokenStatus';
import MyAppointments from './pages/customer/MyAppointments';
import History from './pages/customer/History';
import MedicalRecords from './pages/customer/MedicalRecords';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorQueue from './pages/doctor/Queue';
import DoctorPatients from './pages/doctor/Patients';
import DoctorAppointmentsCalendar from './pages/doctor/AppointmentsCalendar';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import CheckIn from './pages/receptionist/CheckIn';
import ReceptionistQueue from './pages/receptionist/Queue';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import CustomerManagement from './pages/admin/CustomerManagement';

// Shared
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner-border text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} />;
  }
  return children;
}

function getDashboardPath(role) {
  switch (role) {
    case 'DOCTOR': return '/doctor';
    case 'RECEPTIONIST': return '/receptionist';
    case 'ADMIN': return '/admin';
    default: return '/dashboard';
  }
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer Routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><DoctorSearch /></ProtectedRoute>} />
      <Route path="/book-appointment" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
      <Route path="/token-status" element={<ProtectedRoute><TokenStatus /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/medical-records" element={<ProtectedRoute><MedicalRecords /></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/queue" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorQueue /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAppointmentsCalendar /></ProtectedRoute>} />

      {/* Receptionist Routes */}
      <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['RECEPTIONIST']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/receptionist/checkin" element={<ProtectedRoute allowedRoles={['RECEPTIONIST']}><CheckIn /></ProtectedRoute>} />
      <Route path="/receptionist/queue" element={<ProtectedRoute allowedRoles={['RECEPTIONIST']}><ReceptionistQueue /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['ADMIN']}><StaffManagement /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['ADMIN']}><DoctorManagement /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['ADMIN']}><CustomerManagement /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
