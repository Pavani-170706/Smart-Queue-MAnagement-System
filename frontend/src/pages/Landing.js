import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-white border-bottom">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <div className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center" style={{width:32,height:32}}>
              <i className="bi bi-heart-pulse" />
            </div>
            MedQueue
          </Link>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-outline-primary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <span className="badge bg-white bg-opacity-10 text-white mb-4 px-3 py-2">
                <i className="bi bi-circle-fill text-success me-1" style={{fontSize:8}} /> Hospital Queue Management System
              </span>
              <h1 className="display-4 fw-bold mb-3">
                Skip the Wait.<br/>
                <span className="text-primary">Manage Your Queue.</span>
              </h1>
              <p className="lead mb-4 opacity-75">
                Book appointments, track your queue position in real-time, and access your medical records — all from one modern platform.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Link to="/register" className="btn btn-light btn-lg px-4">
                  Get Started Free <i className="bi bi-arrow-right ms-1" />
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                  Find a Doctor
                </Link>
              </div>
              <div className="row mt-5 pt-4 g-4 justify-content-center">
                <div className="col-4 text-center">
                  <h3 className="fw-bold">Smart</h3>
                  <small className="opacity-60">Queue System</small>
                </div>
                <div className="col-4 text-center">
                  <h3 className="fw-bold">24/7</h3>
                  <small className="opacity-60">Online Access</small>
                </div>
                <div className="col-4 text-center">
                  <h3 className="fw-bold">100%</h3>
                  <small className="opacity-60">Digital</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center fw-bold mb-2">Everything You Need</h2>
          <p className="text-center text-muted mb-5">A complete queue management solution for modern healthcare</p>
          <div className="row g-4">
            {[
              { icon: 'bi-calendar-check', title: 'Smart Booking', desc: 'Book appointments up to 2 days in advance with real-time availability.' },
              { icon: 'bi-clock-history', title: 'Live Queue', desc: 'See your token number, people ahead, and estimated waiting time.' },
              { icon: 'bi-file-earmark-text', title: 'Digital Records', desc: 'Access your complete medical history and prescriptions anytime.' },
              { icon: 'bi-bell', title: 'Notifications', desc: 'Get notified when it\'s your turn or when records are ready.' },
              { icon: 'bi-shield-check', title: 'Secure & Private', desc: 'Your medical data is protected with role-based access control.' },
              { icon: 'bi-people', title: 'Multi-Role System', desc: 'Purpose-built interfaces for patients, doctors, and admins.' },
            ].map((f, i) => (
              <div key={i} className="col-md-4">
                <div className="feature-card h-100">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{width:48,height:48}}>
                    <i className={`bi ${f.icon} fs-5`} />
                  </div>
                  <h5 className="fw-bold">{f.title}</h5>
                  <p className="text-muted mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">How It Works</h2>
          <p className="text-muted mb-5">Get started in minutes</p>
          <div className="row justify-content-center">
            <div className="col-lg-6">
              {['Create your account', 'Search for a doctor', 'Book your appointment', 'Receive your token', 'Get real-time updates', 'Access your records'].map((step, i) => (
                <div key={i} className="d-flex align-items-center gap-3 py-3 border-bottom">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width:36,height:36,fontSize:14}}>
                    {i + 1}
                  </div>
                  <span className="fw-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/register" className="btn btn-primary btn-lg mt-4 px-5">
            Create Your Account <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
      </section>

      <footer className="bg-white border-top py-4">
        <div className="container text-center">
          <p className="text-muted mb-0">&copy; 2026 MedQueue — Smart Hospital Queue Management System</p>
        </div>
      </footer>
    </div>
  );
}
