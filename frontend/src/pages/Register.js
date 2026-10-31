import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', password:'', confirmPassword:'', role:'CUSTOMER', gender:'', dateOfBirth:'', address:'', specialization:'', department:'', room:'', qualification:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await register(form);
      if (result.success) {
        const dashMap = { CUSTOMER: '/dashboard', DOCTOR: '/doctor', RECEPTIONIST: '/receptionist', ADMIN: '/admin' };
        navigate(dashMap[result.role] || '/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
  console.error('REGISTRATION ERROR:', err);
  console.error('Response:', err.response);
  console.error('Response data:', err.response?.data);

  setError(
    err.response?.data?.message ||
    err.message ||
    'Registration failed. Please try again.'
  );
}
    setLoading(false);
  };

  const update = (field, value) => setForm({...form, [field]: value});

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-4 py-5">
      <div style={{width:'100%',maxWidth:480}}>
        <div className="text-center mb-4">
          <div className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{width:48,height:48}}>
            <i className="bi bi-heart-pulse fs-4" />
          </div>
          <h4 className="fw-bold">Create Account</h4>
          <p className="text-muted">Join MedQueue today</p>
        </div>

        <div className="card border-0 shadow-lg">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div className="mb-3">
                <label className="form-label fw-medium">I am a...</label>
                <div className="row g-2">
                  {[
                    { value:'CUSTOMER', label:'Patient', icon:'bi-person', desc:'Book appointments' },
                    { value:'DOCTOR', label:'Doctor', icon:'bi-stethoscope', desc:'Manage patients' },
                    { value:'RECEPTIONIST', label:'Receptionist', icon:'bi-person-badge', desc:'Front desk' },
                    { value:'ADMIN', label:'Admin', icon:'bi-shield-check', desc:'System admin' },
                  ].map(r => (
                    <div key={r.value} className="col-6">
                      <button type="button" className={`w-100 p-2 rounded-3 border text-center ${form.role === r.value ? 'border-primary bg-primary bg-opacity-10' : 'border'}`} onClick={() => update('role', r.value)}>
                        <i className={`bi ${r.icon} d-block mb-1 ${form.role === r.value ? 'text-primary' : ''}`} />
                        <small className="fw-bold d-block">{r.label}</small>
                        <small className="text-muted" style={{fontSize:10}}>{r.desc}</small>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Full Name</label>
                <input type="text" className="form-control" placeholder="John Doe" value={form.fullName} onChange={e => update('fullName', e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Email</label>
                <input type="email" className="form-control" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Phone</label>
                <input type="tel" className="form-control" placeholder="+1-555-0123" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>

              {form.role === 'DOCTOR' && (
                <div className="border rounded-3 p-3 mb-3 bg-light">
                  <h6 className="fw-bold mb-3">Doctor Profile</h6>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Specialization</label>
                    <input type="text" className="form-control" placeholder="e.g. Cardiology" value={form.specialization} onChange={e => update('specialization', e.target.value)} required />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-medium">Department</label>
                      <input type="text" className="form-control" placeholder="e.g. Cardiology Department" value={form.department} onChange={e => update('department', e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-medium">Room</label>
                      <input type="text" className="form-control" placeholder="e.g. C-101" value={form.room} onChange={e => update('room', e.target.value)} required />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label fw-medium">Qualification</label>
                    <input type="text" className="form-control" placeholder="e.g. MBBS, MD" value={form.qualification} onChange={e => update('qualification', e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label fw-medium">Password</label>
                  <input type="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                </div>
                <div className="col-6">
                  <label className="form-label fw-medium">Confirm</label>
                  <input type="password" className="form-control" placeholder="Confirm password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
                </div>
              </div>

              {error && <div className="alert alert-danger py-2 text-center" style={{fontSize:13}}>{error}</div>}

              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating account...</> : 'Create Account'}
              </button>
            </form>

            <div className="text-center mt-3">
              <small className="text-muted">Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-medium">Sign in</Link></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
