import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) {
        const dashMap = { CUSTOMER: '/dashboard', DOCTOR: '/doctor', RECEPTIONIST: '/receptionist', ADMIN: '/admin' };
        navigate(dashMap[result.role] || '/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex">
      <div className="d-none d-lg-flex col-lg-6 bg-primary position-relative overflow-hidden">
        <div className="position-absolute" style={{inset:0,background:'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 50%)'}} />
        <div className="position-relative z-1 d-flex flex-column justify-content-center px-5 text-white">
          <div className="bg-white bg-opacity-15 rounded-3 d-inline-flex align-items-center justify-content-center mb-4" style={{width:56,height:56}}>
            <i className="bi bi-heart-pulse fs-3" />
          </div>
          <h1 className="display-5 fw-bold mb-3">Smart Hospital<br/>Queue Management</h1>
          <p className="lead opacity-75">Book appointments, manage queues, and access your medical records — all in one place.</p>
        </div>
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-4 py-5">
        <div style={{width:'100%',maxWidth:420}}>
          <div className="d-lg-none text-center mb-4">
            <div className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{width:48,height:48}}>
              <i className="bi bi-heart-pulse fs-4" />
            </div>
          </div>

          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <h4 className="fw-bold text-center mb-1">Welcome back</h4>
              <p className="text-muted text-center mb-4">Sign in to access your hospital dashboard</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-envelope" /></span>
                    <input type="email" className="form-control" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-lock" /></span>
                    <input type="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                </div>

                {error && <div className="alert alert-danger py-2 text-center" style={{fontSize:13}}>{error}</div>}

                <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : <>Sign In <i className="bi bi-arrow-right ms-1" /></>}
                </button>
              </form>

              <div className="text-center mt-3">
                <small className="text-muted">Don't have an account? <Link to="/register" className="text-primary text-decoration-none fw-medium">Sign up</Link></small>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <small className="text-muted">
              <strong>Demo accounts:</strong><br/>
              Admin: admin@qms.com | Doctor: doctor@qms.com<br/>
              Receptionist: receptionist@qms.com | Customer: customer@qms.com<br/>
              Password: password123
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
