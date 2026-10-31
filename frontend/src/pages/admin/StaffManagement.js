import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

const initialForm = {
  fullName: '', email: '', phone: '', role: 'DOCTOR', password: '',
  department: '', specialization: '', qualification: '', room: '', experience: ''
};

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    try { const res = await adminAPI.getStaff(); setStaff(res.data.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, role: form.role, experience: form.role === 'DOCTOR' ? Number(form.experience || 0) : null };
      const res = await adminAPI.createStaff(payload);
      if (!res.data.success) throw new Error(res.data.message || 'Failed to create staff');
      alert(`${form.role === 'DOCTOR' ? 'Doctor' : 'Receptionist'} account created successfully. They can now log in using this email and password.`);
      setShowForm(false);
      setForm(initialForm);
      await loadStaff();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create staff');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try { await adminAPI.deleteStaff(id); await loadStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">Staff Management</h3>
          <p className="text-muted mb-0">Create doctor and receptionist accounts directly from the admin panel</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="bi bi-plus-lg me-1" />Add Staff
        </button>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white">
            <h6 className="fw-bold mb-0">Create Staff Account</h6>
            <small className="text-muted">The account is created in both authentication and user services. No separate registration is required.</small>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-md-4"><label className="form-label">Full Name *</label><input className="form-control" value={form.fullName} onChange={e => update('fullName', e.target.value)} required /></div>
              <div className="col-md-4"><label className="form-label">Email *</label><input type="email" className="form-control" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
              <div className="col-md-4"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
              <div className="col-md-3"><label className="form-label">Role *</label><select className="form-select" value={form.role} onChange={e => update('role', e.target.value)}><option value="DOCTOR">Doctor</option><option value="RECEPTIONIST">Receptionist</option></select></div>
              <div className="col-md-3"><label className="form-label">Password *</label><input type="password" minLength="6" className="form-control" value={form.password} onChange={e => update('password', e.target.value)} required /></div>

              {form.role === 'DOCTOR' && <>
                <div className="col-md-3"><label className="form-label">Department *</label><input className="form-control" value={form.department} onChange={e => update('department', e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">Specialization *</label><input className="form-control" value={form.specialization} onChange={e => update('specialization', e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">Qualification *</label><input className="form-control" value={form.qualification} onChange={e => update('qualification', e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">Room *</label><input className="form-control" value={form.room} onChange={e => update('room', e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">Experience (Years) *</label><input type="number" min="0" step="1" className="form-control" value={form.experience} onChange={e => update('experience', e.target.value)} required /></div>
              </>}

              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setForm(initialForm); }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td className="fw-medium">{s.fullName}</td><td>{s.email}</td><td>{s.phone || '—'}</td>
                  <td><span className={`badge ${s.role === 'DOCTOR' ? 'bg-success' : 'bg-warning text-dark'}`}>{s.role}</span></td>
                  <td><span className={`badge ${s.isActive ? 'bg-success' : 'bg-secondary'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}><i className="bi bi-trash" /></button></td>
                </tr>
              ))}
              {staff.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No staff members</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
