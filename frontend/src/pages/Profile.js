import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { adminAPI, doctorAPI } from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (user?.role !== 'DOCTOR' || !user?.userId) return;
    doctorAPI.get(user.userId)
      .then(res => setDoctorProfile(res.data.data?.profile || null))
      .catch(() => setDoctorProfile(null));
  }, [user?.role, user?.userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateStaff(user.userId, form);
      setMsg('Profile updated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Failed to update profile'); }
    setSaving(false);
  };

  const roleLabel = { CUSTOMER: 'Patient', DOCTOR: 'Doctor', RECEPTIONIST: 'Receptionist', ADMIN: 'Administrator' };
  const roleColor = { CUSTOMER: 'bg-primary', DOCTOR: 'bg-success', RECEPTIONIST: 'bg-warning', ADMIN: 'bg-purple' };

  return (
    <Layout>
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <h3 className="fw-bold mb-4">Profile</h3>

          <div className="card border-0 shadow-sm mb-4 overflow-hidden">
            <div className="bg-primary bg-opacity-10 p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold" style={{width:64,height:64,fontSize:24}}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{user?.fullName}</h5>
                  <small className="text-muted">{user?.email}</small>
                  <div><span className={`badge ${roleColor[user?.role]} mt-1`}>{roleLabel[user?.role]}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white"><h6 className="fw-bold mb-0">Personal Information</h6></div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-medium">Full Name</label>
                <input type="text" className="form-control" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium">Email</label>
                <input type="email" className="form-control" value={user?.email || ''} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium">Phone</label>
                <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              {user?.role === 'DOCTOR' && doctorProfile?.experience !== undefined && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Experience</label>
                  <input type="text" className="form-control" value={`${doctorProfile.experience} years`} disabled />
                </div>
              )}
              {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'} py-2`}>{msg}</div>}
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-check-lg me-1" />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
